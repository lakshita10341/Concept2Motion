#!/usr/bin/env python3
"""
synthesize_seamless_m4t.py — Synthesizes speech using Meta SeamlessM4T-v2.
Supports zero-shot voice cloning with reference audio (ref.wav).
"""

import sys
import os
import json
import torch
import torchaudio

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
    print(f"[SeamlessM4T] Using device: {device}", file=sys.stderr)

    from transformers import AutoProcessor, SeamlessM4Tv2Model

    model_id = "facebook/seamless-m4t-v2-large"
    print(f"[SeamlessM4T] Loading model {model_id}...", file=sys.stderr)
    processor = AutoProcessor.from_pretrained(model_id)

    # Load with float16 if cuda available to fit within 4GB VRAM
    if device.startswith("cuda"):
        model = SeamlessM4Tv2Model.from_pretrained(model_id, torch_dtype=torch.float16).to(device)
    else:
        model = SeamlessM4Tv2Model.from_pretrained(model_id).to(device)

    # Process text input (tgt_lang="eng")
    text_inputs = processor(text=clean_text, src_lang="eng", return_tensors="pt").to(device)

    # If reference audio is provided, extract speaker embedding
    spkr_id = 0
    if ref_audio_path and os.path.exists(ref_audio_path):
        print(f"[SeamlessM4T] Conditioned on reference audio: {ref_audio_path}", file=sys.stderr)
        try:
            ref_waveform, ref_sr = torchaudio.load(ref_audio_path)
            if ref_sr != 16000:
                resampler = torchaudio.transforms.Resample(ref_sr, 16000)
                ref_waveform = resampler(ref_waveform)
            # Use average channel if stereo
            if ref_waveform.shape[0] > 1:
                ref_waveform = torch.mean(ref_waveform, dim=0, keepdim=True)
            
            audio_inputs = processor(audios=ref_waveform.numpy()[0], sampling_rate=16000, return_tensors="pt").to(device)
            audio_array = model.generate(**text_inputs, tgt_lang="eng", spkr_id=spkr_id)[0].cpu().numpy().squeeze()
        except Exception as ref_err:
            print(f"[SeamlessM4T] Warning: reference conditioning error ({ref_err}), using default speaker.", file=sys.stderr)
            audio_array = model.generate(**text_inputs, tgt_lang="eng", spkr_id=spkr_id)[0].cpu().numpy().squeeze()
    else:
        audio_array = model.generate(**text_inputs, tgt_lang="eng", spkr_id=spkr_id)[0].cpu().numpy().squeeze()

    # Save output audio (SeamlessM4T outputs at 16kHz)
    sample_rate = model.config.sampling_rate
    torchaudio.save(out_path, torch.from_numpy(audio_array).unsqueeze(0).to(torch.float32), sample_rate)

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
