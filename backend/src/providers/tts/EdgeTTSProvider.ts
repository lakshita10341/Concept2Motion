import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { WordTiming } from "../../shared/types/index.js";

export interface TTSProvider {
  name: string;
  synthesizeSpeech(
    text: string,
    outputPath: string,
    voice?: string
  ): Promise<{ audioDurationSeconds: number; wordTimings?: WordTiming[] }>;
}

export class EdgeTTSProvider implements TTSProvider {
  name = "edge-tts";

  async synthesizeSpeech(
    text: string,
    outputPath: string,
    voice = "en-US-GuyNeural"
  ): Promise<{ audioDurationSeconds: number; wordTimings?: WordTiming[] }> {
    const parentDir = path.dirname(outputPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const scriptPath = path.resolve(process.cwd(), "scripts/synthesize_with_words.py");
    const backendScriptPath = path.resolve(process.cwd(), "backend/scripts/synthesize_with_words.py");
    const activeScript = fs.existsSync(scriptPath) ? scriptPath : backendScriptPath;

    return new Promise((resolve, reject) => {
      const cleanText = text.replace(/[*_#`]/g, "").trim();
      const pythonProc = spawn("python3", [activeScript, cleanText, voice, outputPath]);

      let stdout = "";
      let stderr = "";

      pythonProc.stdout.on("data", (d) => {
        stdout += d.toString();
      });

      pythonProc.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      pythonProc.on("close", (code) => {
        if (code === 0 && stdout.includes("---OUTPUT_START---")) {
          try {
            const raw = stdout.split("---OUTPUT_START---")[1].split("---OUTPUT_END---")[0].trim();
            const parsed = JSON.parse(raw);
            return resolve({
              audioDurationSeconds: parsed.audioDurationSeconds || 4.0,
              wordTimings: parsed.wordTimings || [],
            });
          } catch (e) {
            // fallback
          }
        }

        // Fallback if python script had an issue
        const words = cleanText.split(/\s+/).filter(Boolean);
        const estDuration = Math.max(2.5, +(words.length / 2.5).toFixed(2));
        const estTimings: WordTiming[] = [];
        let cur = 100.0;
        const perWord = (estDuration * 1000) / Math.max(1, words.length);
        for (const w of words) {
          estTimings.push({ word: w, startMs: cur, endMs: cur + perWord });
          cur += perWord;
        }

        resolve({ audioDurationSeconds: estDuration, wordTimings: estTimings });
      });

      pythonProc.on("error", () => {
        const words = cleanText.split(/\s+/).filter(Boolean);
        const estDuration = Math.max(2.5, +(words.length / 2.5).toFixed(2));
        fs.writeFileSync(outputPath, "AUDIO_MOCK");
        resolve({ audioDurationSeconds: estDuration, wordTimings: [] });
      });
    });
  }
}
