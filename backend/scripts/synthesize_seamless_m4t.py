#!/usr/bin/env python3
"""
synthesize_seamless_m4t.py — Synthesizes speech using Meta MMS / Seamless models.
Saves audio cleanly to MP3 using bundled FFmpeg and generates word timings for karaoke captions.
"""

import sys
import os
import json
import subprocess
import torch
import soundfile as sf

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

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: synthesize_seamless_m4t.py <text> <output_audio_path> [reference_audio_path]"}))
        sys.exit(1)

    text = sys.argv[1].strip()
    out_path = sys.argv[2]
    ref_audio_path = sys.argv[3] if len(sys.argv) > 3 and os.path.exists(sys.argv[3]) else None

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    clean_text = text.replace("*", "").replace("#", "").replace("`", "").replace("_", "").strip()

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"[MetaSpeech] Using device: {device}", file=sys.stderr)

    from transformers import VitsModel, AutoTokenizer

    model_id = "facebook/mms-tts-eng"
    print(f"[MetaSpeech] Loading Meta model {model_id}...", file=sys.stderr)
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = VitsModel.from_pretrained(model_id).to(device)

    inputs = tokenizer(clean_text, return_tensors="pt").to(device)
    with torch.no_grad():
        waveform = model(**inputs).waveform

    audio_array = waveform.cpu().numpy().squeeze()
    sample_rate = model.config.sampling_rate

    # Save to temporary WAV, then convert to output path (MP3/WAV)
    tmp_wav = out_path + ".tmp.wav"
    sf.write(tmp_wav, audio_array, sample_rate)

    ffmpeg_bin = find_ffmpeg()
    cmd = [ffmpeg_bin, "-y", "-i", tmp_wav, "-b:a", "192k", out_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(tmp_wav):
        os.remove(tmp_wav)

    duration_sec = round(len(audio_array) / float(sample_rate), 2)

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
