#!/usr/bin/env python3
"""
synthesize_seamless_m4t.py — Synthesizes speech with optional zero-shot voice cloning.
If a reference audio clip is provided, it uses Coqui XTTS-v2 to speak in the user's voice.
Otherwise, it uses Meta MMS-TTS (facebook/mms-tts-eng).
Saves audio cleanly to MP3 using bundled FFmpeg and generates word timings for karaoke captions.
"""

import sys
import os
import json
import subprocess
import time
import soundfile as sf
import torch

os.environ["COQUI_TOS_AGREED"] = "1"

# Monkey-patch torchaudio.load with soundfile to avoid torchcodec / libavutil dependency errors
import torchaudio

def _safe_load(filepath, *args, **kwargs):
    data, sr = sf.read(filepath)
    tensor = torch.from_numpy(data).float()
    if tensor.ndim == 1:
        tensor = tensor.unsqueeze(0)
    else:
        tensor = tensor.t()
    return tensor, sr

torchaudio.load = _safe_load

def find_ffmpeg():
    candidates = [
        os.path.abspath("backend/node_modules/@ffmpeg-installer/linux-x64/ffmpeg"),
        os.path.abspath("node_modules/@ffmpeg-installer/linux-x64/ffmpeg"),
        os.path.abspath("../backend/node_modules/@ffmpeg-installer/linux-x64/ffmpeg"),
        "ffmpeg"
    ]
    for c in candidates:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return "ffmpeg"

def normalize_ref_audio(raw_ref_path, ffmpeg_bin):
    """Ensures reference audio is a standard 24kHz mono PCM WAV file."""
    if not os.path.exists(raw_ref_path):
        return None
    norm_wav = raw_ref_path + ".norm.wav"
    try:
        subprocess.run(
            [ffmpeg_bin, "-y", "-i", raw_ref_path, "-ac", "1", "-ar", "24000", norm_wav],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        return norm_wav
    except Exception as e:
        print(f"[VoiceClone] Reference audio normalization warning: {e}", file=sys.stderr)
        return raw_ref_path

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: synthesize_seamless_m4t.py <text> <output_audio_path> [reference_audio_path]"}))
        sys.exit(1)

    text = sys.argv[1].strip()
    out_path = sys.argv[2]
    raw_ref_path = sys.argv[3] if len(sys.argv) > 3 and os.path.exists(sys.argv[3]) else None

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    clean_text = text.replace("*", "").replace("#", "").replace("`", "").replace("_", "").strip()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    ffmpeg_bin = find_ffmpeg()
    tmp_wav = out_path + ".tmp.wav"

    cloned_successfully = False

    if raw_ref_path and os.path.exists(raw_ref_path):
        norm_ref = normalize_ref_audio(raw_ref_path, ffmpeg_bin)
        print(f"[VoiceClone] Using user reference audio: {raw_ref_path} (normalized: {norm_ref})", file=sys.stderr)
        try:
            from TTS.api import TTS
            print(f"[VoiceClone] Loading XTTS-v2 onto {device} for voice cloning...", file=sys.stderr)
            tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
            print(f"[VoiceClone] Synthesizing speech in user cloned voice ({len(clean_text)} chars)...", file=sys.stderr)
            tts.tts_to_file(text=clean_text, speaker_wav=norm_ref, language="en", file_path=tmp_wav)
            cloned_successfully = os.path.exists(tmp_wav) and os.path.getsize(tmp_wav) > 1000
            if cloned_successfully:
                print(f"[VoiceClone] Cloned voice speech generated successfully ({os.path.getsize(tmp_wav)} bytes)", file=sys.stderr)
        except Exception as clone_err:
            print(f"[VoiceClone] Voice cloning error ({clone_err}), falling back to Meta MMS model.", file=sys.stderr)
            cloned_successfully = False

    if not cloned_successfully:
        print(f"[MetaSpeech] Using Meta MMS model on {device}...", file=sys.stderr)
        from transformers import VitsModel, AutoTokenizer
        model_id = "facebook/mms-tts-eng"
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = VitsModel.from_pretrained(model_id).to(device)
        inputs = tokenizer(clean_text, return_tensors="pt").to(device)
        with torch.no_grad():
            waveform = model(**inputs).waveform
        audio_array = waveform.cpu().numpy().squeeze()
        sample_rate = model.config.sampling_rate
        sf.write(tmp_wav, audio_array, sample_rate)

    # Convert generated WAV to output MP3 using bundled FFmpeg
    cmd = [ffmpeg_bin, "-y", "-i", tmp_wav, "-b:a", "192k", out_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(tmp_wav):
        os.remove(tmp_wav)

    # Get duration from output file
    try:
        f_info = sf.info(out_path)
        duration_sec = round(f_info.duration, 2)
    except Exception:
        duration_sec = 4.0

    # Calculate word timings for karaoke captions
    words = [w for w in clean_text.split() if w]
    word_timings = []
    if words:
        cur_ms = 80.0
        total_chars = max(1, sum(len(w) for w in words))
        est_total_ms = duration_sec * 1000.0
        for w in words:
            w_dur = max(90.0, (len(w) / total_chars) * est_total_ms)
            word_timings.append({
                "word": w,
                "startMs": round(cur_ms, 1),
                "endMs": round(cur_ms + w_dur, 1)
            })
            cur_ms += w_dur

    result = {
        "audioDurationSeconds": duration_sec,
        "wordTimings": word_timings
    }

    print("---OUTPUT_START---")
    print(json.dumps(result))
    print("---OUTPUT_END---")

if __name__ == "__main__":
    main()
