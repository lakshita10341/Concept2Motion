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

  private generateSceneSVG(scene: any, index: number, width = 1920, height = 1080): string {
    const rawTitle = scene.title || "Technical Concept Explanation";
    const title = this.escapeXml(rawTitle);
    const props = scene.customProps || {};
    const explanation = this.escapeXml(props.explanation || scene.concept || "Educational Concept Walkthrough");
    const algo = props.algorithm;

    // Check visualization type
    const isBinarySearch = algo === "Binary Search";
    const isBloom = algo === "Bloom Filter";

    let centerVisualSvg = "";
    let badgeText = "ARCHITECTURE / PROTOCOL";

    if (isBloom) {
      // 1. Bloom Filter Bit Array
      badgeText = "BLOOM FILTER BIT ARRAY";
      const state = props.simulationState || {};
      const bitArray = state.array || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const hashIndices = new Set(state.hashIndices || []);
      const currentItem = state.currentItem ? this.escapeXml(state.currentItem) : null;
      const action = state.action || "init";

      const boxWidth = 130;
      const boxHeight = 130;
      const gap = 24;
      const totalWidth = bitArray.length * boxWidth + (bitArray.length - 1) * gap;
      const startX = (width - totalWidth) / 2;
      const startY = height / 2 - 30;

      let boxes = "";
      bitArray.forEach((val: number, i: number) => {
        const x = startX + i * (boxWidth + gap);
        const y = startY;
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

        const pointerLabel = isHighlighted ? (action === "insert" ? "SET (hash)" : "PROBE") : "";

        boxes += `
          <g transform="translate(${x}, ${y})">
            <rect width="${boxWidth}" height="${boxHeight}" rx="16" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
            <text x="${boxWidth / 2}" y="${boxHeight / 2 + 16}" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="48" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
            <text x="${boxWidth / 2}" y="${boxHeight + 35}" font-family="DejaVu Sans Mono, Liberation Mono, monospace" font-size="20" fill="#94a3b8" text-anchor="middle">bit [${i}]</text>
            ${
              pointerLabel
                ? `<path d="M ${boxWidth / 2} -25 L ${boxWidth / 2} -8" stroke="#38bdf8" stroke-width="4" />
                   <rect x="${boxWidth / 2 - 60}" y="-65" width="120" height="32" rx="8" fill="#0284c7" />
                   <text x="${boxWidth / 2}" y="-44" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">${pointerLabel}</text>`
                : ""
            }
          </g>
        `;
      });
      centerVisualSvg = boxes;
      if (currentItem) badgeText = `${action.toUpperCase()}: "${currentItem}"`;

    } else if (isBinarySearch) {
      // 2. Binary Search Array & Pointers
      badgeText = "TARGET: 42";
      const state = props.simulationState || {};
      const array = state.array || [7, 14, 21, 28, 35, 42, 49, 56, 63];
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

      let boxes = "";
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

        boxes += `
          <g transform="translate(${x}, ${y})">
            <rect width="${boxWidth}" height="${boxHeight}" rx="16" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
            <text x="${boxWidth / 2}" y="${boxHeight / 2 + 16}" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="44" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
            <text x="${boxWidth / 2}" y="${boxHeight + 35}" font-family="DejaVu Sans Mono, Liberation Mono, monospace" font-size="20" fill="#94a3b8" text-anchor="middle">idx: ${i}</text>
            ${
              pointerLabel
                ? `<path d="M ${boxWidth / 2} -25 L ${boxWidth / 2} -8" stroke="#38bdf8" stroke-width="4" />
                   <rect x="${boxWidth / 2 - 60}" y="-65" width="120" height="32" rx="8" fill="#0284c7" />
                   <text x="${boxWidth / 2}" y="-44" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${pointerLabel}</text>`
                : ""
            }
          </g>
        `;
      });
      centerVisualSvg = boxes;

    } else {
      // 3. Dynamic Technical Diagram / Architecture / Handshake Card
      // Renders unique cards for SSL, DNS, TCP, Operating Systems, Trees, etc.
      badgeText = `STAGE ${index + 1} OF ${scene.narrationSegmentIds?.length || 4}`;

      const cardWidth = 1400;
      const cardHeight = 440;
      const cardX = (width - cardWidth) / 2;
      const cardY = height / 2 - 200;

      const step1Color = index >= 0 ? "#3b82f6" : "#334155";
      const step2Color = index >= 1 ? "#6366f1" : "#334155";
      const step3Color = index >= 2 ? "#10b981" : "#334155";
      const step4Color = index >= 3 ? "#ec4899" : "#334155";

      centerVisualSvg = `
        <g transform="translate(${cardX}, ${cardY})">
          <!-- Glass Panel Background -->
          <rect width="${cardWidth}" height="${cardHeight}" rx="28" fill="#0f172a" stroke="#1e293b" stroke-width="3" />
          
          <!-- Flow diagram nodes -->
          <g transform="translate(100, 60)">
            <!-- Node 1 -->
            <rect x="0" y="0" width="240" height="110" rx="18" fill="${index === 0 ? "#1e3a5f" : "#1e293b"}" stroke="${step1Color}" stroke-width="3" />
            <text x="120" y="45" font-family="DejaVu Sans, Arial" font-size="18" font-weight="bold" fill="#93c5fd" text-anchor="middle">CLIENT / USER</text>
            <text x="120" y="78" font-family="DejaVu Sans, Arial" font-size="14" fill="#cbd5e1" text-anchor="middle">Initiates Request</text>

            <!-- Connector 1 -->
            <path d="M 240 55 L 320 55" stroke="${index >= 1 ? "#60a5fa" : "#475569"}" stroke-width="4" stroke-dasharray="6" />

            <!-- Node 2 -->
            <rect x="320" y="0" width="260" height="110" rx="18" fill="${index === 1 ? "#2e1065" : "#1e293b"}" stroke="${step2Color}" stroke-width="3" />
            <text x="450" y="45" font-family="DejaVu Sans, Arial" font-size="18" font-weight="bold" fill="#c084fc" text-anchor="middle">VERIFICATION / CA</text>
            <text x="450" y="78" font-family="DejaVu Sans, Arial" font-size="14" fill="#cbd5e1" text-anchor="middle">Cryptographic Proof</text>

            <!-- Connector 2 -->
            <path d="M 580 55 L 660 55" stroke="${index >= 2 ? "#818cf8" : "#475569"}" stroke-width="4" stroke-dasharray="6" />

            <!-- Node 3 -->
            <rect x="660" y="0" width="260" height="110" rx="18" fill="${index === 2 ? "#064e3b" : "#1e293b"}" stroke="${step3Color}" stroke-width="3" />
            <text x="790" y="45" font-family="DejaVu Sans, Arial" font-size="18" font-weight="bold" fill="#6ee7b7" text-anchor="middle">SERVER / ENDPOINT</text>
            <text x="790" y="78" font-family="DejaVu Sans, Arial" font-size="14" fill="#cbd5e1" text-anchor="middle">Identity &amp; Handshake</text>

            <!-- Connector 3 -->
            <path d="M 920 55 L 1000 55" stroke="${index >= 3 ? "#34d399" : "#475569"}" stroke-width="4" stroke-dasharray="6" />

            <!-- Node 4 -->
            <rect x="1000" y="0" width="200" height="110" rx="18" fill="${index >= 3 ? "#831843" : "#1e293b"}" stroke="${step4Color}" stroke-width="3" />
            <text x="1100" y="45" font-family="DejaVu Sans, Arial" font-size="18" font-weight="bold" fill="#f472b6" text-anchor="middle">SECURE LINK</text>
            <text x="1100" y="78" font-family="DejaVu Sans, Arial" font-size="14" fill="#cbd5e1" text-anchor="middle">Encrypted Session</text>
          </g>

          <!-- Current Stage Focus Banner -->
          <rect x="100" y="215" width="1200" height="175" rx="20" fill="#020617" stroke="#334155" stroke-width="2" />
          <text x="140" y="260" font-family="DejaVu Sans, Arial" font-size="20" font-weight="bold" fill="#38bdf8">CORE CONCEPT IN FOCUS:</text>
          <text x="140" y="300" font-family="DejaVu Sans, Arial" font-size="28" font-weight="800" fill="#f8fafc">${title}</text>
          <text x="140" y="345" font-family="DejaVu Sans, Arial" font-size="20" fill="#94a3b8">${explanation}</text>
        </g>
      `;
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
        <text x="145" y="115" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="44" font-weight="800" fill="#f8fafc">${title}</text>
        <text x="145" y="150" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="22" font-weight="500" fill="#94a3b8">Concept2Motion • Scene ${index + 1} • Educational Visualization</text>

        <!-- Dynamic Badge -->
        <rect x="${width - 440}" y="75" width="320" height="60" rx="16" fill="#1e1b4b" stroke="#6366f1" stroke-width="2" />
        <text x="${width - 280}" y="113" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="20" font-weight="bold" fill="#818cf8" text-anchor="middle">${badgeText}</text>

        <!-- Center Diagram / Visualization -->
        ${centerVisualSvg}

        <!-- Bottom Subtitle / Explanation Card -->
        <rect x="${(width - 1200) / 2}" y="${height - 180}" width="1200" height="95" rx="18" fill="#0f172a" stroke="#334155" stroke-width="2" />
        <text x="${width / 2}" y="${height - 130}" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="24" font-weight="600" fill="#38bdf8" text-anchor="middle">${explanation}</text>
        <text x="${width / 2}" y="${height - 102}" font-family="DejaVu Sans, Liberation Sans, Arial" font-size="18" font-weight="400" fill="#94a3b8" text-anchor="middle">Concept2Motion • Meta Muse Spark Powered Video Generation</text>
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

      const resvg = new Resvg(svgContent, {
        fitTo: { mode: "width", value: 1920 },
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
