import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { WordTiming } from "../../shared/types/index.js";
import { TTSProvider, EdgeTTSProvider } from "./EdgeTTSProvider.js";

export class SeamlessM4TProvider implements TTSProvider {
  name = "meta-seamless-m4t";
  private fallbackTTS: EdgeTTSProvider;

  constructor() {
    this.fallbackTTS = new EdgeTTSProvider();
  }

  async synthesizeSpeech(
    text: string,
    outputPath: string,
    voice?: string,
    referenceAudioPath?: string
  ): Promise<{ audioDurationSeconds: number; wordTimings?: WordTiming[] }> {
    const parentDir = path.dirname(outputPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const scriptPath = path.resolve(process.cwd(), "backend/scripts/synthesize_seamless_m4t.py");
    const altScriptPath = path.resolve(process.cwd(), "scripts/synthesize_seamless_m4t.py");
    const activeScript = fs.existsSync(scriptPath) ? scriptPath : altScriptPath;

    const venvPy = path.resolve(process.cwd(), "backend/.venv-voice/bin/python");
    const altVenvPy = path.resolve(process.cwd(), ".venv-voice/bin/python");
    const activeVenvPy = fs.existsSync(venvPy) ? venvPy : fs.existsSync(altVenvPy) ? altVenvPy : "python3";

    // If python environment or script is not ready, seamlessly fall back to EdgeTTS
    if (!fs.existsSync(activeScript)) {
      console.warn("[SeamlessM4T] SeamlessM4T script not found, falling back to neural TTS");
      return this.fallbackTTS.synthesizeSpeech(text, outputPath, voice);
    }

    const cleanText = text.replace(/[*_#`]/g, "").trim();
    const args = [activeScript, cleanText, outputPath];
    if (referenceAudioPath && fs.existsSync(referenceAudioPath)) {
      args.push(referenceAudioPath);
    }

    return new Promise((resolve) => {
      console.log(`[SeamlessM4T] Synthesizing speech (${cleanText.length} chars)${referenceAudioPath ? ` with cloned voice (${path.basename(referenceAudioPath)})` : ""}...`);
      const proc = spawn(activeVenvPy, args);

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d) => (stdout += d.toString()));
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
        const line = d.toString().trim();
        if (line.startsWith("[SeamlessM4T]") || line.startsWith("[MetaSpeech]")) {
          console.log(line);
        }
      });

      proc.on("close", (code) => {
        if (code === 0  && stdout.includes("---OUTPUT_START---")) {
          try {
            const raw = stdout.split("---OUTPUT_START---")[1].split("---OUTPUT_END---")[0].trim();
            const parsed = JSON.parse(raw);
            return resolve({
              audioDurationSeconds: parsed.audioDurationSeconds || 4.0,
              wordTimings: parsed.wordTimings || [],
            });
          } catch (e) {
            console.warn("[SeamlessM4T] JSON parse failed, falling back to neural TTS");
          }
        }

        const safeFallbackVoice = (voice && voice.includes("Neural")) ? voice : "en-US-GuyNeural";
        console.warn(`[SeamlessM4T] Process exited with code ${code}. Falling back to neural voice (${safeFallbackVoice}).`);
        this.fallbackTTS.synthesizeSpeech(text, outputPath, safeFallbackVoice).then(resolve);
      });

      proc.on("error", (err) => {
        const safeFallbackVoice = (voice && voice.includes("Neural")) ? voice : "en-US-GuyNeural";
        console.warn(`[SeamlessM4T] Failed to spawn process: ${err.message}. Falling back to neural voice (${safeFallbackVoice}).`);
        this.fallbackTTS.synthesizeSpeech(text, outputPath, safeFallbackVoice).then(resolve);
      });
    });
  }
}
