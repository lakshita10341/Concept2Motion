import { spawn } from "child_process";
import fs from "fs";
import path from "path";
export class VideoRendererService {
    ffmpegPath;
    constructor() {
        // Resolve ffmpeg binary from node_modules or system
        const localFfmpeg = path.resolve(process.cwd(), "backend/node_modules/@ffmpeg-installer/linux-x64/ffmpeg");
        const rootLocalFfmpeg = path.resolve(process.cwd(), "node_modules/@ffmpeg-installer/linux-x64/ffmpeg");
        if (fs.existsSync(localFfmpeg)) {
            this.ffmpegPath = localFfmpeg;
        }
        else if (fs.existsSync(rootLocalFfmpeg)) {
            this.ffmpegPath = rootLocalFfmpeg;
        }
        else {
            this.ffmpegPath = "ffmpeg";
        }
    }
    // Generates high-resolution SVGs for a scene
    generateSceneSVG(scene, index, width = 1920, height = 1080) {
        const title = scene.title || "Binary Search Algorithm";
        const props = scene.customProps || {};
        const state = props.simulationState || {};
        const array = state.array || props.array || [7, 14, 21, 28, 35, 42, 49, 56, 63];
        const left = state.left ?? 0;
        const right = state.right ?? array.length - 1;
        const mid = state.mid ?? null;
        const eliminated = new Set(state.eliminated || []);
        const boxWidth = 140;
        const boxHeight = 140;
        const gap = 30;
        const totalArrayWidth = array.length * boxWidth + (array.length - 1) * gap;
        const startX = (width - totalArrayWidth) / 2;
        const startY = height / 2 - 40;
        let arrayBoxesSvg = "";
        array.forEach((val, i) => {
            const x = startX + i * (boxWidth + gap);
            const y = startY;
            let bgColor = "#1e293b"; // slate-800
            let strokeColor = "#475569"; // slate-600
            let textColor = "#f8fafc";
            let pointerLabel = "";
            if (eliminated.has(i)) {
                bgColor = "#0f172a";
                strokeColor = "#334155";
                textColor = "#64748b"; // muted
            }
            if (i === mid && state.status === "found") {
                bgColor = "#059669"; // emerald-600
                strokeColor = "#34d399";
                pointerLabel = "MID (MATCH!)";
            }
            else if (i === mid) {
                bgColor = "#2563eb"; // blue-600
                strokeColor = "#60a5fa";
                pointerLabel = "MID";
            }
            else if (i === left && i === right) {
                pointerLabel = "L=R";
            }
            else if (i === left) {
                pointerLabel = "LEFT";
            }
            else if (i === right) {
                pointerLabel = "RIGHT";
            }
            arrayBoxesSvg += `
        <g transform="translate(${x}, ${y})">
          <rect width="${boxWidth}" height="${boxHeight}" rx="16" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
          <text x="${boxWidth / 2}" y="${boxHeight / 2 + 18}" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
          <text x="${boxWidth / 2}" y="${boxHeight + 35}" font-family="monospace" font-size="20" fill="#94a3b8" text-anchor="middle">idx: ${i}</text>
          ${pointerLabel
                ? `<path d="M ${boxWidth / 2} -25 L ${boxWidth / 2} -8" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)" />
                 <rect x="${boxWidth / 2 - 60}" y="-65" width="120" height="32" rx="8" fill="#0284c7" />
                 <text x="${boxWidth / 2}" y="-44" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${pointerLabel}</text>`
                : ""}
        </g>
      `;
        });
        return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bg)" />

        <!-- Grid lines decoration -->
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" stroke-width="1" />
        </pattern>
        <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.6" />

        <!-- Header -->
        <rect x="120" y="70" width="8" height="64" rx="4" fill="url(#cardGrad)" />
        <text x="145" y="115" font-family="system-ui, sans-serif" font-size="44" font-weight="800" fill="#f8fafc">${title}</text>
        <text x="145" y="150" font-family="system-ui, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">Concept2Motion • Scene ${index + 1} • Invariant Visualization</text>

        <!-- Target Badge -->
        <rect x="${width - 360}" y="75" width="240" height="60" rx="16" fill="#1e1b4b" stroke="#6366f1" stroke-width="2" />
        <text x="${width - 240}" y="113" font-family="sans-serif" font-size="24" font-weight="bold" fill="#818cf8" text-anchor="middle">TARGET: 42</text>

        <!-- Array Elements Visualization -->
        ${arrayBoxesSvg}

        <!-- Subtitle / Explanation Card -->
        <rect x="${(width - 1200) / 2}" y="${height - 200}" width="1200" height="110" rx="20" fill="#0f172a" stroke="#334155" stroke-width="2" />
        <text x="${width / 2}" y="${height - 145}" font-family="system-ui, sans-serif" font-size="26" font-weight="600" fill="#38bdf8" text-anchor="middle">${props.explanation || "Executable Simulation Step"}</text>
        <text x="${width / 2}" y="${height - 110}" font-family="system-ui, sans-serif" font-size="20" font-weight="400" fill="#94a3b8" text-anchor="middle">Time Complexity: O(log N) • Guaranteed Elimination Invariant</text>
      </svg>
    `;
    }
    async renderFinalVideo(storyboard, script, jobDir) {
        const videoOutPath = path.join(jobDir, "final_video.mp4");
        const sceneVideoPaths = [];
        for (let i = 0; i < storyboard.scenes.length; i++) {
            const scene = storyboard.scenes[i];
            const segment = script.segments[i];
            const audioPath = path.join(jobDir, `${segment.segmentId}.mp3`);
            const svgPath = path.join(jobDir, `scene_${i + 1}.svg`);
            const sceneVideoPath = path.join(jobDir, `scene_${i + 1}.mp4`);
            // Write SVG frame
            const svgContent = this.generateSceneSVG(scene, i);
            fs.writeFileSync(svgPath, svgContent, "utf-8");
            const duration = Math.max(3, segment.audioDurationSeconds || scene.durationSeconds || 5);
            // Render video segment using ffmpeg
            await new Promise((resolve, reject) => {
                let args = [];
                if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
                    // Both SVG frame and real audio
                    args = [
                        "-y",
                        "-loop", "1",
                        "-i", svgPath,
                        "-i", audioPath,
                        "-c:v", "libx264",
                        "-tune", "stillimage",
                        "-c:a", "aac",
                        "-b:a", "192k",
                        "-pix_fmt", "yuv420p",
                        "-shortest",
                        sceneVideoPath,
                    ];
                }
                else {
                    // Fallback to silent video segment
                    args = [
                        "-y",
                        "-loop", "1",
                        "-i", svgPath,
                        "-f", "lavfi",
                        "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                        "-t", `${duration}`,
                        "-c:v", "libx264",
                        "-tune", "stillimage",
                        "-c:a", "aac",
                        "-pix_fmt", "yuv420p",
                        sceneVideoPath,
                    ];
                }
                const proc = spawn(this.ffmpegPath, args);
                let errLog = "";
                proc.stderr.on("data", (d) => (errLog += d.toString()));
                proc.on("close", (code) => {
                    if (code === 0) {
                        sceneVideoPaths.push(sceneVideoPath);
                        resolve();
                    }
                    else {
                        reject(new Error(`Scene render error for scene ${i + 1}: ${errLog}`));
                    }
                });
            });
        }
        // Concatenate all scene videos into final_video.mp4
        const concatListPath = path.join(jobDir, "concat_list.txt");
        const concatContent = sceneVideoPaths.map((p) => `file '${path.resolve(p)}'`).join("\n");
        fs.writeFileSync(concatListPath, concatContent, "utf-8");
        await new Promise((resolve, reject) => {
            const proc = spawn(this.ffmpegPath, [
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concatListPath,
                "-c", "copy",
                videoOutPath,
            ]);
            let errLog = "";
            proc.stderr.on("data", (d) => (errLog += d.toString()));
            proc.on("close", (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Final video concatenation failed: ${errLog}`));
            });
        });
        return videoOutPath;
    }
}
