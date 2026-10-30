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
    return (unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Generates a 9:16 Vertical Reel format SVG (1080x1920)
   */
  private generateSceneSVG(scene: any, index: number, width = 1080, height = 1920): string {
    const rawTitle = scene.title || "Technical Concept";
    const title = this.escapeXml(rawTitle);
    const props = scene.customProps || {};
    const explanation = this.escapeXml(props.explanation || scene.concept || "Concept Walkthrough");
    const algo = props.algorithm;

    const isBinarySearch = algo === "Binary Search";
    const isBloom = algo === "Bloom Filter";

    let centerVisualSvg = "";
    let badgeText = `SCENE ${index + 1}`;

    if (isBloom) {
      badgeText = "BLOOM FILTER";
      const state = props.simulationState || {};
      const bitArray = state.array || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const hashIndices = new Set(state.hashIndices || []);
      const currentItem = state.currentItem ? this.escapeXml(state.currentItem) : null;
      const action = state.action || "init";

      // 2 rows of 5 boxes for vertical phone display
      const boxSize = 150;
      const gap = 24;
      const cols = 5;
      const totalGridW = cols * boxSize + (cols - 1) * gap;
      const startX = (width - totalGridW) / 2;
      const startY = height / 2 - 200;

      let boxes = "";
      bitArray.forEach((val: number, i: number) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxSize + gap);
        const y = startY + row * (boxSize + gap + 40);
        const isHighlighted = hashIndices.has(i);

        let bgColor = val === 1 ? "#1e3a5f" : "#0f172a";
        let strokeColor = val === 1 ? "#38bdf8" : "#334155";
        let textColor = val === 1 ? "#38bdf8" : "#64748b";

        if (isHighlighted) {
          if (action === "insert") {
            bgColor = "#047857";
            strokeColor = "#34d399";
            textColor = "#ffffff";
          } else if (action === "query") {
            bgColor = val === 1 ? "#1d4ed8" : "#b91c1c";
            strokeColor = val === 1 ? "#60a5fa" : "#f87171";
            textColor = "#ffffff";
          }
        }

        boxes += `
          <g transform="translate(${x}, ${y})">
            <rect width="${boxSize}" height="${boxSize}" rx="20" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
            <text x="${boxSize / 2}" y="${boxSize / 2 + 18}" font-family="DejaVu Sans, Arial" font-size="52" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
            <text x="${boxSize / 2}" y="${boxSize + 32}" font-family="DejaVu Sans Mono, monospace" font-size="20" fill="#94a3b8" text-anchor="middle">bit [${i}]</text>
          </g>
        `;
      });
      centerVisualSvg = boxes;
      if (currentItem) badgeText = `${action.toUpperCase()}: "${currentItem}"`;

    } else if (isBinarySearch) {
      badgeText = "BINARY SEARCH";
      const state = props.simulationState || {};
      const array = state.array || [7, 14, 21, 28, 35, 42, 49, 56, 63];
      const left = state.left ?? 0;
      const right = state.right ?? array.length - 1;
      const mid = state.mid ?? null;
      const eliminated = new Set(state.eliminated || []);

      // 3x3 Grid of elements tailored for vertical phone screens
      const boxSize = 160;
      const gap = 30;
      const cols = 3;
      const gridW = cols * boxSize + (cols - 1) * gap;
      const startX = (width - gridW) / 2;
      const startY = height / 2 - 320;

      let boxes = "";
      array.forEach((val: number, i: number) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxSize + gap);
        const y = startY + row * (boxSize + gap + 50);

        let bgColor = "#1e293b";
        let strokeColor = "#475569";
        let textColor = "#f8fafc";
        let pointerLabel = "";

        if (eliminated.has(i)) {
          bgColor = "#0f172a";
          strokeColor = "#1e293b";
          textColor = "#475569";
        }

        if (i === mid && state.status === "found") {
          bgColor = "#059669";
          strokeColor = "#34d399";
          pointerLabel = "MATCH!";
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

        boxes += `
          <g transform="translate(${x}, ${y})">
            <rect width="${boxSize}" height="${boxSize}" rx="24" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
            <text x="${boxSize / 2}" y="${boxSize / 2 + 18}" font-family="DejaVu Sans, Arial" font-size="48" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
            <text x="${boxSize / 2}" y="${boxSize + 32}" font-family="DejaVu Sans Mono, monospace" font-size="20" fill="#94a3b8" text-anchor="middle">idx: ${i}</text>
            ${
              pointerLabel
                ? `<rect x="${boxSize / 2 - 50}" y="-34" width="100" height="28" rx="8" fill="#0284c7" />
                   <text x="${boxSize / 2}" y="-15" font-family="DejaVu Sans, Arial" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">${pointerLabel}</text>`
                : ""
            }
          </g>
        `;
      });
      centerVisualSvg = boxes;

    } else {
      // Vertical Architecture / Protocol Diagram for Reels
      badgeText = `STEP ${index + 1} OF ${scene.narrationSegmentIds?.length || 3}`;

      const cardW = 920;
      const cardX = (width - cardW) / 2;
      const startY = height / 2 - 340;

      const step1Color = index >= 0 ? "#3b82f6" : "#334155";
      const step2Color = index >= 1 ? "#6366f1" : "#334155";
      const step3Color = index >= 2 ? "#10b981" : "#334155";
      const step4Color = index >= 3 ? "#ec4899" : "#334155";

      centerVisualSvg = `
        <g transform="translate(${cardX}, ${startY})">
          <!-- Step 1 Card -->
          <rect x="40" y="0" width="840" height="110" rx="20" fill="${index === 0 ? "#1e3a5f" : "#0f172a"}" stroke="${step1Color}" stroke-width="3" />
          <text x="80" y="48" font-family="DejaVu Sans, Arial" font-size="20" font-weight="bold" fill="#60a5fa">1. CLIENT REQUEST</text>
          <text x="80" y="82" font-family="DejaVu Sans, Arial" font-size="18" fill="#cbd5e1">Browser initiates connection &amp; sends client parameters</text>

          <path d="M 460 110 L 460 145" stroke="${index >= 1 ? "#60a5fa" : "#334155"}" stroke-width="4" stroke-dasharray="6" />

          <!-- Step 2 Card -->
          <rect x="40" y="150" width="840" height="110" rx="20" fill="${index === 1 ? "#2e1065" : "#0f172a"}" stroke="${step2Color}" stroke-width="3" />
          <text x="80" y="198" font-family="DejaVu Sans, Arial" font-size="20" font-weight="bold" fill="#c084fc">2. VERIFICATION &amp; AUTH</text>
          <text x="80" y="232" font-family="DejaVu Sans, Arial" font-size="18" fill="#cbd5e1">Certificate Authority proof or resolver inspection</text>

          <path d="M 460 260 L 460 295" stroke="${index >= 2 ? "#818cf8" : "#334155"}" stroke-width="4" stroke-dasharray="6" />

          <!-- Step 3 Card -->
          <rect x="40" y="300" width="840" height="110" rx="20" fill="${index === 2 ? "#064e3b" : "#0f172a"}" stroke="${step3Color}" stroke-width="3" />
          <text x="80" y="348" font-family="DejaVu Sans, Arial" font-size="20" font-weight="bold" fill="#34d399">3. KEY EXCHANGE / HANDSHAKE</text>
          <text x="80" y="382" font-family="DejaVu Sans, Arial" font-size="18" fill="#cbd5e1">Cryptographic handshake generates shared keys</text>

          <path d="M 460 410 L 460 445" stroke="${index >= 3 ? "#34d399" : "#334155"}" stroke-width="4" stroke-dasharray="6" />

          <!-- Step 4 Card -->
          <rect x="40" y="450" width="840" height="110" rx="20" fill="${index >= 3 ? "#831843" : "#0f172a"}" stroke="${step4Color}" stroke-width="3" />
          <text x="80" y="498" font-family="DejaVu Sans, Arial" font-size="20" font-weight="bold" fill="#f472b6">4. ENCRYPTED SESSION</text>
          <text x="80" y="532" font-family="DejaVu Sans, Arial" font-size="18" fill="#cbd5e1">Fast, secure transmission with zero interception</text>
        </g>
      `;
    }

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#050811" />
            <stop offset="50%" stop-color="#0b1329" />
            <stop offset="100%" stop-color="#030712" />
          </linearGradient>
          <linearGradient id="reelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="50%" stop-color="#8b5cf6" />
            <stop offset="100%" stop-color="#ec4899" />
          </linearGradient>
        </defs>

        <!-- Vertical Reel Background -->
        <rect width="${width}" height="${height}" fill="url(#bg)" />

        <!-- Header Ribbon -->
        <rect x="70" y="100" width="${width - 140}" height="8" rx="4" fill="url(#reelGrad)" />
        
        <!-- Header Category Badge -->
        <rect x="70" y="130" width="220" height="46" rx="14" fill="#1e1b4b" stroke="#6366f1" stroke-width="2" />
        <text x="180" y="160" font-family="DejaVu Sans, Arial" font-size="18" font-weight="bold" fill="#a5b4fc" text-anchor="middle">${badgeText}</text>

        <!-- Title -->
        <text x="70" y="240" font-family="DejaVu Sans, Arial" font-size="48" font-weight="800" fill="#f8fafc">${title}</text>
        <text x="70" y="285" font-family="DejaVu Sans, Arial" font-size="22" font-weight="500" fill="#94a3b8">Concept2Motion • Scene ${index + 1}</text>

        <!-- Center Interactive Visual Component -->
        ${centerVisualSvg}

        <!-- Bottom Subtitle Card for Reels -->
        <rect x="70" y="${height - 380}" width="${width - 140}" height="240" rx="28" fill="#0b1329" stroke="#1e293b" stroke-width="2" />
        <text x="120" y="${height - 325}" font-family="DejaVu Sans, Arial" font-size="22" font-weight="bold" fill="#38bdf8">KEY TAKEAWAY</text>
        <text x="120" y="${height - 275}" font-family="DejaVu Sans, Arial" font-size="28" font-weight="600" fill="#f8fafc">${explanation}</text>
        <text x="120" y="${height - 225}" font-family="DejaVu Sans, Arial" font-size="20" fill="#94a3b8">Generated autonomously with Meta Muse Spark</text>

        <!-- Progress bar at bottom -->
        <rect x="70" y="${height - 90}" width="${width - 140}" height="6" rx="3" fill="#1e293b" />
        <rect x="70" y="${height - 90}" width="${((index + 1) / (scene.narrationSegmentIds?.length || 3)) * (width - 140)}" height="6" rx="3" fill="url(#reelGrad)" />
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

    // Vertical 9:16 standard Reel resolution (1080 x 1920)
    const reelWidth = 1080;
    const reelHeight = 1920;

    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];
      const segment = script.segments[i];
      const audioPath = path.join(jobDir, `${segment.segmentId}.mp3`);
      const svgPath = path.join(jobDir, `scene_${i + 1}.svg`);
      const pngPath = path.join(jobDir, `scene_${i + 1}.png`);
      const sceneVideoPath = path.join(jobDir, `scene_${i + 1}.mp4`);

      const svgContent = this.generateSceneSVG(scene, i, reelWidth, reelHeight);
      fs.writeFileSync(svgPath, svgContent, "utf-8");

      const resvg = new Resvg(svgContent, {
        fitTo: { mode: "width", value: reelWidth },
        font: {
          loadSystemFonts: true,
          defaultFontFamily: "DejaVu Sans",
        },
      });
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
            "-vf", `scale=${reelWidth}:${reelHeight}`,
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
            "-vf", `scale=${reelWidth}:${reelHeight}`,
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
