import asyncio
import edge_tts
import json
import sys
import os

async def main():
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: synthesize_with_words.py <text> <voice> <output_audio_path>"}))
        sys.exit(1)

    text = sys.argv[1].strip()
    voice = sys.argv[2]
    out_path = sys.argv[3]

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)

    # Clean text of markdown artifacts
    clean_text = text.replace("*", "").replace("#", "").replace("`", "").replace("_", "").strip()

    comm = edge_tts.Communicate(clean_text, voice)
    
    sentence_offset = 0.0
    sentence_dur = 0.0
    has_audio = False

    with open(out_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
                has_audio = True
            elif chunk["type"] == "SentenceBoundary":
                sentence_offset = chunk["offset"] / 10000.0  # ms
                sentence_dur = chunk["duration"] / 10000.0   # ms

    # Calculate exact duration
    words = [w for w in clean_text.split() if w]
    total_chars = max(1, sum(len(w) for w in words))
    
    # If SentenceBoundary was captured, use it; otherwise fallback to word count estimation
    total_dur_ms = sentence_dur if sentence_dur > 500 else max(2000.0, (len(words) / 2.5) * 1000.0)
    start_base_ms = sentence_offset if sentence_offset >= 0 else 50.0

    word_timings = []
    cur_ms = start_base_ms

    for w in words:
        w_dur = max(120.0, (len(w) / total_chars) * total_dur_ms)
        word_timings.append({
            "word": w,
            "startMs": round(cur_ms, 1),
            "endMs": round(cur_ms + w_dur, 1)
        })
        cur_ms += w_dur

    total_duration_sec = round((cur_ms / 1000.0), 2)

    result = {
        "audioDurationSeconds": total_duration_sec,
        "wordTimings": word_timings
    }

    print("---OUTPUT_START---")
    print(json.dumps(result))
    print("---OUTPUT_END---")

if __name__ == "__main__":
    asyncio.run(main())
