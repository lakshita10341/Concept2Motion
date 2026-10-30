import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { Storyboard, TeachingScript } from "../shared/types/index.js";

export class VideoRendererService {
  private ffmpegPath: string;

  constructor() {
    const localFfmpeg = path.resolve(
      process.cwd(),
      "backend/node_modules/@ffmpeg-installer/linux-x64/ffmpeg"
    );
    const rootLocalFfmpeg = path.resolve(
      process.cwd(),
      "node_modules/@ffmpeg-installer/linux-x64/ffmpeg"
    );

    if (fs.existsSync(localFfmpeg)) {
      this.ffmpegPath = localFfmpeg;
    } else if (fs.existsSync(rootLocalFfmpeg)) {
      this.ffmpegPath = rootLocalFfmpeg;
    } else {
      this.ffmpegPath = "ffmpeg";
    }
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private generateSceneSVG(scene: any, index: number, width = 1920, height = 1080): string {
    const rawTitle = scene.title || "Technical Algorithm Visualization";
    const title = this.escapeXml(rawTitle);
    const props = scene.customProps || {};
    const explanation = this.escapeXml(props.explanation || "Executable Simulation Step");
    const state = props.simulationState || {};
    const isBloom = props.algorithm === "Bloom Filter" || (props.array && props.array.length === 10 && props.array.every((x: any) => x === 0 || x === 1));

    let arrayBoxesSvg = "";
    let badgeText = "INVARIANT VERIFIED";

    if (isBloom) {
      // Render Bloom Filter Bit Array
      badgeText = "BLOOM FILTER: BIT ARRAY";
      const bitArray = state.array || props.array || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const hashIndices = new Set(state.hashIndices || []);
      const currentItem = state.currentItem ? this.escapeXml(state.currentItem) : null;
      const action = state.action || "init";

      const boxWidth = 130;
      const boxHeight = 130;
      const gap = 24;
      const totalWidth = bitArray.length * boxWidth + (bitArray.length - 1) * gap;
      const startX = (width - totalWidth) / 2;
      const startY = height / 2 - 30;

      bitArray.forEach((val: number, i: number) => {
        const x = startX + i * (boxWidth + gap);
        const y = startY;
        const isHighlighted = hashIndices.has(i);

        let bgColor = val === 1 ? "#1e3a5f" : "#0f172a";
        let strokeColor = val === 1 ? "#38bdf8" : "#334155";
        let textColor = val === 1 ? "#38bdf8" : "#64748b";

        if (isHighlighted) {
          if (action === "insert") {
            bgColor = "#047857"; // green
            strokeColor = "#34d399";
            textColor = "#ffffff";
          } else if (action === "query") {
            bgColor = val === 1 ? "#1d4ed8" : "#b91c1c"; // blue if 1, red if 0
            strokeColor = val === 1 ? "#60a5fa" : "#f87171";
            textColor = "#ffffff";
          }
        }

        const pointerLabel = isHighlighted ? (action === "insert" ? "SET (hash)" : "PROBE") : "";

        arrayBoxesSvg += `
          <g transform="translate(${x}, ${y})">
            <rect width="${boxWidth}" height="${boxHeight}" rx="16" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
            <text x="${boxWidth / 2}" y="${boxHeight / 2 + 16}" font-family="sans-serif" font-size="48" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
            <text x="${boxWidth / 2}" y="${boxHeight + 35}" font-family="monospace" font-size="20" fill="#94a3b8" text-anchor="middle">bit [${i}]</text>
            ${
              pointerLabel
                ? `<path d="M ${boxWidth / 2} -25 L ${boxWidth / 2} -8" stroke="#38bdf8" stroke-width="4" />
                   <rect x="${boxWidth / 2 - 60}" y="-65" width="120" height="32" rx="8" fill="#0284c7" />
                   <text x="${boxWidth / 2}" y="-44" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">${pointerLabel}</text>`
                : ""
            }
          </g>
        `;
      });

      if (currentItem) {
        badgeText = `${action.toUpperCase()}: "${currentItem}"`;
      }
    } else {
      // Render Binary Search
      badgeText = "TARGET: 42";
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

      array.forEach((val: number, i: number) => {
        const x = startX + i * (boxWidth + gap);
        const y = startY;

        let bgColor = "#1e293b";
        let strokeColor = "#475569";
        let textColor = "#f8fafc";
        let pointerLabel = "";

        if (eliminated.has(i)) {
          bgColor = "#0f172a";
          strokeColor = "#334155";
          textColor = "#64748b";
        }

        if (i === mid && state.status === "found") {
          bgColor = "#059669";
          strokeColor = "#34d399";
          pointerLabel = "MID (MATCH!)";
        } else if (i === mid) {
          bgColor = "#2563eb";
          strokeColor = "#60a5fa";
          pointerLabel = "MID";
        } else if (i === left && i === right) {
          pointerLabel = "L=R";
        } else if (i === left) {
          pointerLabel = "LEFT";
        } else if (i === right) {
          pointerLabel = "RIGHT";
        }

        arrayBoxesSvg += `
          <g transform="translate(${x}, ${y})">
            <rect width="${boxWidth}" height="${boxHeight}" rx="16" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
            <text x="${boxWidth / 2}" y="${boxHeight / 2 + 16}" font-family="sans-serif" font-size="44" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
            <text x="${boxWidth / 2}" y="${boxHeight + 35}" font-family="monospace" font-size="20" fill="#94a3b8" text-anchor="middle">idx: ${i}</text>
            ${
              pointerLabel
                ? `<path d="M ${boxWidth / 2} -25 L ${boxWidth / 2} -8" stroke="#38bdf8" stroke-width="4" />
                   <rect x="${boxWidth / 2 - 60}" y="-65" width="120" height="32" rx="8" fill="#0284c7" />
                   <text x="${boxWidth / 2}" y="-44" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${pointerLabel}</text>`
                : ""
            }
          </g>
        `;
      });
    }

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

        <rect width="${width}" height="${height}" fill="url(#bg)" />

        <!-- Header -->
        <rect x="120" y="70" width="8" height="64" rx="4" fill="url(#cardGrad)" />
        <text x="145" y="115" font-family="sans-serif" font-size="44" font-weight="800" fill="#f8fafc">${title}</text>
        <text x="145" y="150" font-family="sans-serif" font-size="22" font-weight="500" fill="#94a3b8">Concept2Motion • Scene ${index + 1} • Invariant Visualization</text>

        <!-- Dynamic Badge -->
        <rect x="${width - 420}" y="75" width="300" height="60" rx="16" fill="#1e1b4b" stroke="#6366f1" stroke-width="2" />
        <text x="${width - 270}" y="113" font-family="sans-serif" font-size="22" font-weight="bold" fill="#818cf8" text-anchor="middle">${badgeText}</text>

        <!-- Array Elements Visualization -->
        ${arrayBoxesSvg}

        <!-- Subtitle / Explanation Card -->
        <rect x="${(width - 1200) / 2}" y="${height - 200}" width="1200" height="110" rx="20" fill="#0f172a" stroke="#334155" stroke-width="2" />
        <text x="${width / 2}" y="${height - 145}" font-family="sans-serif" font-size="26" font-weight="600" fill="#38bdf8" text-anchor="middle">${explanation}</text>
        <text x="${width / 2}" y="${height - 110}" font-family="sans-serif" font-size="20" font-weight="400" fill="#94a3b8" text-anchor="middle">Time Complexity: O(k) / O(log N) • Executed Simulation State Invariant</text>
      </svg>
    `;
  }

  async renderFinalVideo(
    storyboard: Storyboard,
    script: TeachingScript,
    jobDir: string
  ): Promise<string> {
    const videoOutPath = path.join(jobDir, "final_video.mp4");
    const sceneVideoPaths: string[] = [];

    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];
      const segment = script.segments[i];
      const audioPath = path.join(jobDir, `${segment.segmentId}.mp3`);
      const svgPath = path.join(jobDir, `scene_${i + 1}.svg`);
      const pngPath = path.join(jobDir, `scene_${i + 1}.png`);
      const sceneVideoPath = path.join(jobDir, `scene_${i + 1}.mp4`);

      const svgContent = this.generateSceneSVG(scene, i);
      fs.writeFileSync(svgPath, svgContent, "utf-8");

      const resvg = new Resvg(svgContent, { fitTo: { mode: "width", value: 1920 } });
      const pngData = resvg.render();
      fs.writeFileSync(pngPath, pngData.asPng());

      const duration = Math.max(3, segment.audioDurationSeconds || scene.durationSeconds || 5);

      await new Promise<void>((resolve, reject) => {
        let args: string[] = [];

        if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
          args = [
            "-y",
            "-loop", "1",
            "-i", pngPath,
            "-i", audioPath,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            sceneVideoPath,
          ];
        } else {
          args = [
            "-y",
            "-loop", "1",
            "-i", pngPath,
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
          } else {
            reject(new Error(`Scene render error for scene ${i + 1}: ${errLog}`));
          }
        });
      });
    }

    const concatListPath = path.join(jobDir, "concat_list.txt");
    const concatContent = sceneVideoPaths.map((p) => `file '${path.resolve(p)}'`).join("\n");
    fs.writeFileSync(concatListPath, concatContent, "utf-8");

    await new Promise<void>((resolve, reject) => {
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
        if (code === 0) resolve();
        else reject(new Error(`Final video concatenation failed: ${errLog}`));
      });
    });

    return videoOutPath;
  }
}
