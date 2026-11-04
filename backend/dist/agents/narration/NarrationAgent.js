import path from "path";
export class NarrationAgent {
    tts;
    constructor(tts) {
        this.tts = tts;
    }
    async generateAllNarrationAudio(script, jobDir, voice = "en-US-GuyNeural", referenceAudioPath) {
        const updatedSegments = await Promise.all(script.segments.map(async (segment) => {
            const audioFileName = `${segment.segmentId}.mp3`;
            const audioPath = path.join(jobDir, audioFileName);
            const res = await this.tts.synthesizeSpeech(segment.narrationText, audioPath, voice, referenceAudioPath);
            return {
                ...segment,
                audioUrl: `/api/jobs/media/${path.basename(jobDir)}/${audioFileName}`,
                audioDurationSeconds: res.audioDurationSeconds,
                wordTimings: res.wordTimings || [],
            };
        }));
        return {
            ...script,
            segments: updatedSegments,
        };
    }
    async regenerateSegmentAudio(segmentId, narrationText, jobDir, voice = "en-US-GuyNeural") {
        const audioFileName = `${segmentId}.mp3`;
        const audioPath = path.join(jobDir, audioFileName);
        const res = await this.tts.synthesizeSpeech(narrationText, audioPath, voice);
        return {
            audioUrl: `/api/jobs/media/${path.basename(jobDir)}/${audioFileName}`,
            audioDurationSeconds: res.audioDurationSeconds,
        };
    }
}
