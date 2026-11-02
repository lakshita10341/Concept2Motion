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
    
    sentences = []
    has_audio = False

    with open(out_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
                has_audio = True
            elif chunk["type"] == "SentenceBoundary":
                sentences.append({
                    "text": chunk.get("text", "").strip(),
                    "offsetMs": chunk.get("offset", 0) / 10000.0,
                    "durationMs": chunk.get("duration", 0) / 10000.0,
                })

    word_timings = []

    if sentences:
        for s in sentences:
            s_text = s["text"]
            s_words = [w for w in s_text.split() if w]
            if not s_words:
                continue

            total_chars = max(1, sum(len(w) for w in s_words))
            cur_ms = s["offsetMs"]
            s_dur = max(300.0, s["durationMs"])

            for w in s_words:
                w_dur = max(90.0, (len(w) / total_chars) * s_dur)
                word_timings.append({
                    "word": w,
                    "startMs": round(cur_ms, 1),
                    "endMs": round(cur_ms + w_dur, 1)
                })
                cur_ms += w_dur
        
        last_end_ms = word_timings[-1]["endMs"] if word_timings else 2000.0
        total_duration_sec = round((last_end_ms / 1000.0) + 0.15, 2)
    else:
        # Fallback if no sentence boundary events received
        words = [w for w in clean_text.split() if w]
        cur_ms = 80.0
        total_chars = max(1, sum(len(w) for w in words))
        est_total_ms = max(2000.0, (len(words) / 2.6) * 1000.0)
        for w in words:
            w_dur = max(100.0, (len(w) / total_chars) * est_total_ms)
            word_timings.append({
                "word": w,
                "startMs": round(cur_ms, 1),
                "endMs": round(cur_ms + w_dur, 1)
            })
            cur_ms += w_dur
        total_duration_sec = round((cur_ms / 1000.0) + 0.1, 2)

    result = {
        "audioDurationSeconds": total_duration_sec,
        "wordTimings": word_timings
    }

    print("---OUTPUT_START---")
    print(json.dumps(result))
    print("---OUTPUT_END---")

if __name__ == "__main__":
    asyncio.run(main())
