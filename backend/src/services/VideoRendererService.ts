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

    } else if (algo === "Raft Consensus" || (rawTitle && rawTitle.toLowerCase().includes("raft"))) {
      // 5-Node Raft Cluster Architecture Visualization for Reels
      badgeText = `RAFT CONSENSUS • TERM ${index >= 1 ? "2" : "1"}`;
      const simState = props.simulationState || {};
      const action = simState.action || (index === 0 ? "TIMEOUT" : index === 1 ? "VOTE" : index === 2 ? "LEADER" : "COMMITTED");

      const cx = width / 2;
      const cy = height / 2 - 120;
      const r = 260; // cluster radius

      const nodeCoords = [
        { id: "Node A", angle: -90, role: index >= 2 ? "LEADER" : index === 1 ? "CANDIDATE" : "FOLLOWER" },
        { id: "Node B", angle: -18, role: index >= 2 ? "FOLLOWER (Synced)" : "FOLLOWER" },
        { id: "Node C", angle: 54, role: index >= 2 ? "FOLLOWER (Synced)" : "FOLLOWER" },
        { id: "Node D", angle: 126, role: "FOLLOWER" },
        { id: "Node E", angle: 198, role: "FOLLOWER" },
      ];

      let clusterNodesSvg = "";
      let connectingBeams = "";

      nodeCoords.forEach((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);

        const isLeader = node.role.startsWith("LEADER");
        const isCandidate = node.role === "CANDIDATE";
        const isQuorumFollower = index >= 2 && (node.id === "Node B" || node.id === "Node C");

        let nodeFill = "#0f172a";
        let nodeStroke = "#334155";
        let badgeBg = "#1e293b";
        let badgeColor = "#94a3b8";

        if (isLeader) {
          nodeFill = "#064e3b";
          nodeStroke = "#10b981";
          badgeBg = "#047857";
          badgeColor = "#ffffff";
        } else if (isCandidate) {
          nodeFill = "#78350f";
          nodeStroke = "#f59e0b";
          badgeBg = "#b45309";
          badgeColor = "#ffffff";
        } else if (isQuorumFollower) {
          nodeFill = "#1e3a5f";
          nodeStroke = "#38bdf8";
          badgeBg = "#0284c7";
          badgeColor = "#ffffff";
        }

        // Draw connection beam from Leader/Candidate to Quorum peers
        if ((isLeader || isCandidate) && (node.id === "Node A")) {
          const bRad = (nodeCoords[1].angle * Math.PI) / 180;
          const cRad = (nodeCoords[2].angle * Math.PI) / 180;
          connectingBeams += `
            <line x1="${nx}" y1="${ny}" x2="${cx + r * Math.cos(bRad)}" y2="${cy + r * Math.sin(bRad)}" stroke="#10b981" stroke-width="4" stroke-dasharray="8 6" />
            <line x1="${nx}" y1="${ny}" x2="${cx + r * Math.cos(cRad)}" y2="${cy + r * Math.sin(cRad)}" stroke="#10b981" stroke-width="4" stroke-dasharray="8 6" />
          `;
        }

        clusterNodesSvg += `
          <g transform="translate(${nx}, ${ny})">
            <circle r="68" fill="${nodeFill}" stroke="${nodeStroke}" stroke-width="4" />
            <text y="-8" font-family="DejaVu Sans Mono, monospace" font-size="22" font-weight="bold" fill="#f8fafc" text-anchor="middle">${node.id}</text>
            <rect x="-60" y="14" width="120" height="28" rx="8" fill="${badgeBg}" />
            <text y="33" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="${badgeColor}" text-anchor="middle">${node.role}</text>
          </g>
        `;
      });

      centerVisualSvg = `
        <g>
          <!-- Central Cluster Core -->
          <circle cx="${cx}" cy="${cy}" r="340" fill="#070d1a" stroke="#1e293b" stroke-width="2" stroke-dasharray="10 10" />
          
          <!-- Communication Beams -->
          ${connectingBeams}

          <!-- Cluster Server Nodes -->
          ${clusterNodesSvg}

          <!-- Center Status Card -->
          <g transform="translate(${cx - 180}, ${cy - 45})">
            <rect width="360" height="90" rx="16" fill="#0b1329" stroke="#38bdf8" stroke-width="2" />
            <text x="180" y="32" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="bold" fill="#38bdf8" text-anchor="middle">STATUS: ${action}</text>
            <text x="180" y="64" font-family="DejaVu Sans Mono, monospace" font-size="14" fill="#94a3b8" text-anchor="middle">QUORUM: 3/5 NODES (MAJORITY)</text>
          </g>
        </g>
      `;

    } else {
      // Universal Dynamic Multi-Stage Architecture Cards (DNS, Protocols, Caches, OS, DBs)
      badgeText = `STEP ${index + 1} OF ${scene.narrationSegmentIds?.length || 4}`;

      const cardW = 920;
      const cardX = (width - cardW) / 2;
      const startY = height / 2 - 340;

      const concepts = (props.allConcepts && props.allConcepts.length > 0)
        ? props.allConcepts
        : ["1. System Initialization", "2. State Transformation", "3. Invariant Verification", "4. Deterministic Output"];

      const outcomes = (props.allOutcomes && props.allOutcomes.length > 0)
        ? props.allOutcomes
        : [
            "Initialize parameters and system invariants",
            "Transform states and process inputs",
            "Maintain consistency guarantees",
            "Return verified output with strict bounds"
          ];

      const colors = [
        { activeFill: "#1e3a5f", activeStroke: "#38bdf8", text: "#60a5fa" },
        { activeFill: "#2e1065", activeStroke: "#a855f7", text: "#c084fc" },
        { activeFill: "#064e3b", activeStroke: "#10b981", text: "#34d399" },
        { activeFill: "#831843", activeStroke: "#ec4899", text: "#f472b6" },
      ];

      let stepCardsSvg = "";
      const displayCount = Math.min(4, Math.max(concepts.length, 3));

      for (let sIdx = 0; sIdx < displayCount; sIdx++) {
        const cTitle = this.escapeXml(concepts[sIdx] || `Phase ${sIdx + 1}`);
        const cDesc = this.escapeXml((outcomes[sIdx] || "System invariant guaranteed").slice(0, 75));
        const isActive = index === sIdx;
        const isPassed = index > sIdx;
        const style = colors[sIdx % colors.length];

        const cardFill = isActive ? style.activeFill : isPassed ? "#1e293b" : "#0f172a";
        const cardStroke = isActive ? style.activeStroke : isPassed ? "#475569" : "#334155";
        const strokeW = isActive ? 4 : 2;
        const titleColor = isActive ? style.text : isPassed ? "#cbd5e1" : "#64748b";
        const descColor = isActive ? "#ffffff" : isPassed ? "#94a3b8" : "#475569";
        const yOffset = sIdx * 150;

        stepCardsSvg += `
          <!-- Step ${sIdx + 1} Card -->
          <rect x="40" y="${yOffset}" width="840" height="110" rx="20" fill="${cardFill}" stroke="${cardStroke}" stroke-width="${strokeW}" />
          ${isActive ? `<circle cx="64" cy="${yOffset + 55}" r="8" fill="${style.activeStroke}" />` : ""}
          <text x="${isActive ? 90 : 80}" y="${yOffset + 48}" font-family="DejaVu Sans, Arial" font-size="20" font-weight="bold" fill="${titleColor}">${sIdx + 1}. ${cTitle.toUpperCase()}</text>
          <text x="${isActive ? 90 : 80}" y="${yOffset + 82}" font-family="DejaVu Sans, Arial" font-size="17" fill="${descColor}">${cDesc}</text>
          ${
            sIdx < displayCount - 1
              ? `<path d="M 460 ${yOffset + 110} L 460 ${yOffset + 145}" stroke="${index > sIdx ? style.activeStroke : "#334155"}" stroke-width="4" stroke-dasharray="6" />`
              : ""
          }
        `;
      }

      centerVisualSvg = `
        <g transform="translate(${cardX}, ${startY})">
          ${stepCardsSvg}
        </g>
      `;
    }

    const keyPillText = isBloom
      ? "GUARANTEED ZERO FALSE NEGATIVES"
      : isBinarySearch
      ? (index === 0 ? "O(log n) SEARCH HORIZON" : index === 3 ? "DIRECT LOGARITHMIC HIT" : "HALVING SEARCH BOUNDS")
      : this.escapeXml((props.learningOutcome || "SYSTEM INVARIANT").toUpperCase().slice(0, 36));

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#090a0f" />
            <stop offset="100%" stop-color="#050608" />
          </linearGradient>
        </defs>

        <!-- Precision Matte Canvas (#090A0F Engineering Slate) -->
        <rect width="${width}" height="${height}" fill="url(#bg)" />

        <!-- Clean Structural Hairline Dividers -->
        <line x1="70" y1="200" x2="${width - 70}" y2="200" stroke="#1f2430" stroke-width="1.5" />
        <line x1="70" y1="1340" x2="${width - 70}" y2="1340" stroke="#1f2430" stroke-width="1.5" stroke-dasharray="6 6" />

        <!-- Top Engineering Status Strip (Anti-Slop: Monolithic Accent & Concrete Telemetry) -->
        <rect x="70" y="80" width="${width - 140}" height="3" fill="#10b981" />
        <g transform="translate(70, 105)">
          <!-- Telemetry Tag 1 -->
          <rect width="180" height="34" rx="6" fill="#11141c" stroke="#242b3b" stroke-width="1" />
          <circle cx="16" cy="17" r="4" fill="#10b981" />
          <text x="30" y="23" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#f8fafc" letter-spacing="1">SYSTEM: REEL</text>

          <!-- Telemetry Tag 2 -->
          <rect x="195" width="280" height="34" rx="6" fill="#11141c" stroke="#242b3b" stroke-width="1" />
          <text x="210" y="23" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#38bdf8" letter-spacing="0.5">${badgeText}</text>

          <!-- Telemetry Tag 3 -->
          <rect x="${width - 140 - 150}" width="150" height="34" rx="6" fill="#11141c" stroke="#242b3b" stroke-width="1" />
          <text x="${width - 140 - 75}" y="23" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#94a3b8" text-anchor="middle">STAGE ${index + 1} / 4</text>
        </g>

        <!-- High-Contrast Title & Subtitle (No gradient text) -->
        <text x="70" y="200" font-family="DejaVu Sans, Arial" font-size="44" font-weight="800" fill="#f8fafc">${title}</text>
        <text x="70" y="236" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="600" fill="#64748b" letter-spacing="1">PRODUCTION ARCHITECTURE SPECIFICATION</text>

        <!-- Center Visual Active Canvas (Upper 2/3: y in 260 to 1320) -->
        <g transform="translate(0, 0)">
          ${centerVisualSvg}
        </g>

        <!-- Lower 1/3 Safe Zone: Anti-AI Takeaway Card (Clean, Grounded, High Contrast) -->
        <g transform="translate(70, ${height - 400})">
          <!-- Card Backdrop -->
          <rect width="${width - 140}" height="280" rx="16" fill="#0c0e14" stroke="#1f2430" stroke-width="1.5" />
          
          <!-- Key Invariant Badge -->
          <rect x="36" y="26" width="130" height="28" rx="6" fill="#10b981" />
          <text x="101" y="45" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#042f2e" text-anchor="middle" letter-spacing="1">TAKEAWAY</text>

          <!-- Core Mechanical Insight -->
          <text x="36" y="100" font-family="DejaVu Sans, Arial" font-size="28" font-weight="700" fill="#ffffff">${explanation}</text>

          <!-- Architectural Invariant Pill -->
          <g transform="translate(36, 140)">
            <rect width="${Math.min(width - 212, 620)}" height="46" rx="8" fill="#141824" stroke="#2d3748" stroke-width="1.5" />
            <text x="20" y="30" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="bold" fill="#38bdf8">INVARIANT:</text>
            <text x="135" y="30" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="bold" fill="#facc15">${keyPillText}</text>
          </g>

          <text x="36" y="235" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#64748b">VERIFIED AGAINST SYSTEM SIMULATION INVARIANTS</text>
        </g>

        <!-- Solid High-Contrast Progress Bar (Single Emerald Accent, No Rainbow Gradient) -->
        <rect x="70" y="${height - 70}" width="${width - 140}" height="6" rx="3" fill="#1f2430" />
        <rect x="70" y="${height - 70}" width="${((index + 1) / Math.max(1, scene.narrationSegmentIds?.length || 4)) * (width - 140)}" height="6" rx="3" fill="#10b981" />
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
