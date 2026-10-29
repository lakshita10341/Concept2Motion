import path from "path";
import { TTSProvider } from "../providers/tts/EdgeTTSProvider.js";
import { TeachingScript } from "../../shared/types/index.js";

export class NarrationAgent {
  private tts: TTSProvider;

  constructor(tts: TTSProvider) {
    this.tts = tts;
  }

  async generateAllNarrationAudio(
    script: TeachingScript,
    jobDir: string,
    voice = "en-US-GuyNeural"
  ): Promise<TeachingScript> {
    const updatedSegments = [];

    for (const segment of script.segments) {
      const audioFileName = `${segment.segmentId}.mp3`;
      const audioPath = path.join(jobDir, audioFileName);

      const res = await this.tts.synthesizeSpeech(segment.narrationText, audioPath, voice);

      updatedSegments.push({
        ...segment,
        audioUrl: `/api/jobs/media/${path.basename(jobDir)}/${audioFileName}`,
        audioDurationSeconds: res.audioDurationSeconds,
      });
    }

    return {
      ...script,
      segments: updatedSegments,
    };
  }

  async regenerateSegmentAudio(
    segmentId: string,
    narrationText: string,
    jobDir: string,
    voice = "en-US-GuyNeural"
  ): Promise<{ audioUrl: string; audioDurationSeconds: number }> {
    const audioFileName = `${segmentId}.mp3`;
    const audioPath = path.join(jobDir, audioFileName);
    const res = await this.tts.synthesizeSpeech(narrationText, audioPath, voice);

    return {
      audioUrl: `/api/jobs/media/${path.basename(jobDir)}/${audioFileName}`,
      audioDurationSeconds: res.audioDurationSeconds,
    };
  }
}
