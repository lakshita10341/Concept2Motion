import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { VisualPlanningAgent } from "../agents/visual-planning/VisualPlanningAgent.js";
import { AvatarService } from "./AvatarService.js";
export class VideoRendererService {
    ffmpegPath;
    constructor() {
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
    getManimBinary() {
        const localVenv = path.resolve(process.cwd(), "backend/.venv-manim/bin/manim");
        if (fs.existsSync(localVenv))
            return localVenv;
        const rootVenv = path.resolve(process.cwd(), ".venv-manim/bin/manim");
        if (fs.existsSync(rootVenv))
            return rootVenv;
        const mambaVenv = "/home/lakshita/.local/share/mamba/envs/.venv-manim/bin/manim";
        if (fs.existsSync(mambaVenv))
            return mambaVenv;
        return "manim";
    }
    escapeXml(unsafe) {
        return (unsafe || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&#34;")
            .replace(/'/g, "&#39;");
    }
    /**
     * Generates a 9:16 Vertical Reel format SVG (1080x1920) with synchronized word highlighting
     */
    generateSceneSVG(scene, index, width = 1080, height = 1920, activeWordIndex = 0) {
        const rawTitle = (scene.title || "Technical Concept").trim();
        const maxChars = 38;
        const displayTitle = rawTitle.length > maxChars ? rawTitle.slice(0, maxChars - 2) + "..." : rawTitle;
        const title = this.escapeXml(displayTitle);
        const titleFontSize = displayTitle.length > 28 ? 30 : displayTitle.length > 20 ? 35 : 42;
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
            bitArray.forEach((val, i) => {
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
                    }
                    else if (action === "query") {
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
            if (currentItem)
                badgeText = `${action.toUpperCase()}: "${currentItem}"`;
        }
        else if (isBinarySearch) {
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
            array.forEach((val, i) => {
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
                }
                else if (i === mid) {
                    bgColor = "#2563eb";
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
                boxes += `
          <g transform="translate(${x}, ${y})">
            <rect width="${boxSize}" height="${boxSize}" rx="24" fill="${bgColor}" stroke="${strokeColor}" stroke-width="4" />
            <text x="${boxSize / 2}" y="${boxSize / 2 + 18}" font-family="DejaVu Sans, Arial" font-size="48" font-weight="bold" fill="${textColor}" text-anchor="middle">${val}</text>
            <text x="${boxSize / 2}" y="${boxSize + 32}" font-family="DejaVu Sans Mono, monospace" font-size="20" fill="#94a3b8" text-anchor="middle">idx: ${i}</text>
            ${pointerLabel
                    ? `<rect x="${boxSize / 2 - 50}" y="-34" width="100" height="28" rx="8" fill="#0284c7" />
                   <text x="${boxSize / 2}" y="-15" font-family="DejaVu Sans, Arial" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">${pointerLabel}</text>`
                    : ""}
          </g>
        `;
            });
            centerVisualSvg = boxes;
        }
        else {
            // 4 Completely Distinct Architectural Layouts (Zero Shared Wireframe)
            const layoutType = index % 4; // 0: Terminal HUD, 1: Mechanical Topology, 2: Failure Partition, 3: Invariant Matrix
            const aiSpec = props.diagramSpec;
            const totalSteps = props.totalSteps || 4;
            const stepNum = index + 1;
            // Safe dynamic data extraction from AI spec or segment concepts
            const conceptName = (scene.concept || scene.title || "Architecture").trim();
            const nodeA = {
                title: this.escapeXml(aiSpec?.nodeA?.title || (props.allConcepts?.[0] || "CLIENT INGRESS").slice(0, 18).toUpperCase()),
                subtitle: this.escapeXml(aiSpec?.nodeA?.subtitle || "DISPATCHER"),
                role: this.escapeXml(aiSpec?.nodeA?.role || "CLIENT"),
                status: this.escapeXml(aiSpec?.nodeA?.status || "ACTIVE"),
            };
            const nodeB = {
                title: this.escapeXml(aiSpec?.nodeB?.title || conceptName.slice(0, 20).toUpperCase()),
                subtitle: this.escapeXml(aiSpec?.nodeB?.subtitle || "CORE ENGINE"),
                role: this.escapeXml(aiSpec?.nodeB?.role || "ORCHESTRATOR"),
                status: this.escapeXml(aiSpec?.nodeB?.status || "PROCESSING"),
            };
            const nodeC = {
                title: this.escapeXml(aiSpec?.nodeC?.title || (props.allConcepts?.[props.allConcepts?.length - 1] || "STATE STORE").slice(0, 18).toUpperCase()),
                subtitle: this.escapeXml(aiSpec?.nodeC?.subtitle || "PERSISTENCE"),
                role: this.escapeXml(aiSpec?.nodeC?.role || "STORAGE"),
                status: this.escapeXml(aiSpec?.nodeC?.status || "COMMITTED"),
            };
            const flowPacket = this.escapeXml(aiSpec?.flow?.packetLabel || "SYNC_PAYLOAD: 128B");
            const invBadge = this.escapeXml(aiSpec?.invariant?.badge || "SYSTEM INVARIANT");
            const invRule = this.escapeXml(aiSpec?.invariant?.rule || props.learningOutcome || "Deterministic state transitions preserved under concurrency");
            const metricText = this.escapeXml(aiSpec?.metricText || `P99: 1.4MS • 500K REQ/S`);
            // Multi-stage top progress track
            const allConcepts = props.allConcepts || [conceptName];
            const maxPills = Math.min(allConcepts.length, 5);
            let progressPills = "";
            const pillW = Math.floor(920 / maxPills) - 10;
            for (let p = 0; p < maxPills; p++) {
                const isCurrent = p === index;
                const isPast = p < index;
                const pLabel = this.escapeXml((allConcepts[p] || `Stage ${p + 1}`).slice(0, 14));
                const pBg = isCurrent ? "#042f2e" : isPast ? "#0f172a" : "#090d16";
                const pStroke = isCurrent ? "#10b981" : isPast ? "#334155" : "#1e293b";
                const pText = isCurrent ? "#34d399" : isPast ? "#94a3b8" : "#475569";
                const pIcon = isPast ? "✓" : `${p + 1}`;
                progressPills += `
          <g transform="translate(${p * (pillW + 10)}, 0)">
            <rect width="${pillW}" height="38" rx="8" fill="${pBg}" stroke="${pStroke}" stroke-width="${isCurrent ? '2' : '1'}" />
            <text x="14" y="24" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="${pText}">${pIcon}</text>
            <text x="${pillW / 2 + 10}" y="24" font-family="DejaVu Sans Mono, monospace" font-size="11" font-weight="${isCurrent ? 'bold' : 'normal'}" fill="${pText}" text-anchor="middle">${pLabel}</text>
          </g>
        `;
            }
            if (layoutType === 0) {
                // SCENE 1: Interactive Developer Terminal / Client Console (The Hook & Ingress)
                badgeText = `CLIENT INGRESS • STAGE 1/${totalSteps}`;
                const packetColor = activeWordIndex % 2 === 1 ? "#34d399" : "#38bdf8";
                centerVisualSvg = `
          <g transform="translate(70, 310)">
            <!-- Top Progress Pills -->
            <g transform="translate(10, 0)">${progressPills}</g>

            <!-- Terminal Window Container -->
            <g transform="translate(10, 60)">
              <!-- macOS Window Chrome Header -->
              <rect width="920" height="42" rx="12" fill="#131826" stroke="#2a344a" stroke-width="1.5" />
              <circle cx="28" cy="21" r="6" fill="#ef4444" />
              <circle cx="48" cy="21" r="6" fill="#f59e0b" />
              <circle cx="68" cy="21" r="6" fill="#10b981" />
              <text x="460" y="26" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#94a3b8" text-anchor="middle">TERMINAL: ${this.escapeXml(conceptName.slice(0, 32).toUpperCase())} INGRESS</text>

              <!-- Terminal Black Canvas Body -->
              <rect y="42" width="920" height="300" rx="0" fill="#070a12" stroke="#2a344a" stroke-width="1.5" />

              <!-- Terminal Code & Telemetry Stream -->
              <g transform="translate(30, 80)">
                <text y="0" font-family="DejaVu Sans Mono, monospace" font-size="14" fill="#38bdf8">&gt; curl -X POST /api/v1/intent \\</text>
                <text y="26" font-family="DejaVu Sans Mono, monospace" font-size="14" fill="#94a3b8">    -H "X-Client-Node: ${nodeA.title}" \\</text>
                <text y="52" font-family="DejaVu Sans Mono, monospace" font-size="14" fill="#94a3b8">    -H "X-Protocol-Switch: ${nodeB.title}" \\</text>
                <text y="78" font-family="DejaVu Sans Mono, monospace" font-size="14" fill="#94a3b8">    -d '{"payload": "${flowPacket}"}'</text>

                <!-- Status Line -->
                <line x1="0" y1="105" x2="860" y2="105" stroke="#1e293b" stroke-width="1" />
                <rect y="120" width="860" height="46" rx="8" fill="#0a192f" stroke="#0284c7" stroke-width="1.5" />
                <circle cx="24" cy="143" r="6" fill="${packetColor}" />
                <text x="45" y="148" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#38bdf8">HTTP/2 STREAM ESTABLISHED</text>
                <text x="830" y="148" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#34d399" text-anchor="end">${metricText}</text>

                <text y="195" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#64748b">STATUS: DISPATCHING REQ_INTENT TO CENTRAL ROUTER...</text>
              </g>

              <!-- Bottom Terminal Status Bar -->
              <g transform="translate(0, 342)">
                <rect width="920" height="40" rx="10" fill="#0d1424" stroke="#1e293b" stroke-width="1" />
                <text x="30" y="25" font-family="DejaVu Sans Mono, monospace" font-size="12" fill="#94a3b8">CLIENT BINDING: ACTIVE</text>
                <text x="890" y="25" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#38bdf8" text-anchor="end">TLS 1.3 ENCRYPTED</text>
              </g>
            </g>
          </g>
        `;
            }
            else if (layoutType === 1) {
                // SCENE 2: The Core Mechanical Topology & Switch Hub (Intricate Network Grid)
                badgeText = `CORE MECHANISM • STAGE 2/${totalSteps}`;
                centerVisualSvg = `
          <g transform="translate(70, 310)">
            <!-- Top Progress Pills -->
            <g transform="translate(10, 0)">${progressPills}</g>

            <!-- Topology Canvas -->
            <g transform="translate(10, 60)">
              <!-- Central Switch / Routing Hub (Top Center) -->
              <g transform="translate(270, 10)">
                <rect width="380" height="120" rx="18" fill="#042f2e" stroke="#10b981" stroke-width="3" />
                <rect x="20" y="12" width="340" height="26" rx="6" fill="#065f46" />
                <text x="190" y="30" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#6ee7b7" text-anchor="middle">CENTRAL ENGINE: ${nodeB.title}</text>
                <text x="190" y="68" font-family="DejaVu Sans Mono, monospace" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">${nodeB.subtitle}</text>
                <text x="190" y="96" font-family="DejaVu Sans Mono, monospace" font-size="12" fill="#facc15" text-anchor="middle">INSPECTION &amp; ROUTING ACTIVE</text>
              </g>

              <!-- Laser Transmission Beams to Downstream Storage Nodes -->
              <path d="M 360 130 L 190 220" stroke="#10b981" stroke-width="3.5" stroke-dasharray="8 6" />
              <path d="M 560 130 L 730 220" stroke="#38bdf8" stroke-width="3.5" stroke-dasharray="8 6" />

              <!-- Left Component Storage / Remitter CBS -->
              <g transform="translate(20, 220)">
                <rect width="350" height="135" rx="14" fill="#0c172b" stroke="#1e3a5f" stroke-width="2" />
                <rect x="15" y="12" width="320" height="24" rx="5" fill="#132338" />
                <text x="175" y="28" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#93c5fd" text-anchor="middle">PARTITION A: ${nodeA.title}</text>
                <text x="175" y="66" font-family="DejaVu Sans Mono, monospace" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">ATOMIC RECORD MUTATION</text>
                <line x1="20" y1="84" x2="330" y2="84" stroke="#1e293b" stroke-width="1" />
                <text x="175" y="108" font-family="DejaVu Sans Mono, monospace" font-size="12" fill="#34d399" text-anchor="middle">STATE: VERIFIED &amp; COMMITTED</text>
              </g>

              <!-- Right Component Storage / Beneficiary CBS -->
              <g transform="translate(550, 220)">
                <rect width="350" height="135" rx="14" fill="#0c172b" stroke="#0284c7" stroke-width="2" />
                <rect x="15" y="12" width="320" height="24" rx="5" fill="#082f49" />
                <text x="175" y="28" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#38bdf8" text-anchor="middle">PARTITION B: ${nodeC.title}</text>
                <text x="175" y="66" font-family="DejaVu Sans Mono, monospace" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">SETTLEMENT ACCOUNTS</text>
                <line x1="20" y1="84" x2="330" y2="84" stroke="#1e293b" stroke-width="1" />
                <text x="175" y="108" font-family="DejaVu Sans Mono, monospace" font-size="12" fill="#38bdf8" text-anchor="middle">STATE: BALANCE REFLECTED</text>
              </g>

              <!-- Center Flow Packet Pill -->
              <g transform="translate(320, 160)">
                <rect width="280" height="34" rx="8" fill="#172554" stroke="#38bdf8" stroke-width="1.5" />
                <text x="140" y="22" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#93c5fd" text-anchor="middle">${flowPacket}</text>
              </g>

              <!-- Bottom Architectural Invariant Card -->
              <g transform="translate(10, 380)">
                <rect width="900" height="54" rx="10" fill="#0c172b" stroke="#10b981" stroke-width="1.5" />
                <circle cx="28" cy="27" r="6" fill="#10b981" />
                <text x="48" y="32" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#34d399">MECHANISM:</text>
                <text x="155" y="32" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#f8fafc">${this.escapeXml(invRule.slice(0, 68))}</text>
              </g>
            </g>
          </g>
        `;
            }
            else if (layoutType === 2) {
                // SCENE 3: Production Failure & Split-Brain Partition Stress (Crimson & Amber Alert HUD)
                badgeText = `FAILURE STRESS • STAGE 3/${totalSteps}`;
                centerVisualSvg = `
          <g transform="translate(70, 310)">
            <!-- Top Progress Pills -->
            <g transform="translate(10, 0)">${progressPills}</g>

            <g transform="translate(10, 60)">
              <!-- Top Alert HUD Bar -->
              <rect width="920" height="52" rx="10" fill="#2d0607" stroke="#ef4444" stroke-width="2" />
              <circle cx="26" cy="26" r="7" fill="#ef4444" />
              <text x="46" y="32" font-family="DejaVu Sans Mono, monospace" font-size="14" font-weight="bold" fill="#fca5a5">CRITICAL: PRODUCTION FAILURE ESCALATION</text>
              <text x="890" y="32" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#ef4444" text-anchor="end">ALERT LEVEL 1</text>

              <!-- Left Isolated Node (Failing Quorum) -->
              <g transform="translate(10, 75)">
                <rect width="400" height="230" rx="14" fill="#1c0f13" stroke="#7f1d1d" stroke-width="2" />
                <text x="200" y="38" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="bold" fill="#fca5a5" text-anchor="middle">PRIMARY [${nodeA.title}]</text>
                <rect x="25" y="60" width="350" height="34" rx="6" fill="#291216" />
                <text x="200" y="82" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#f87171" text-anchor="middle">HEARTBEAT TIMEOUT: 500MS</text>
                <rect x="25" y="105" width="350" height="34" rx="6" fill="#3b0f16" stroke="#ef4444" stroke-width="1" />
                <text x="200" y="127" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#fca5a5" text-anchor="middle">UNACKNOWLEDGED WRITES: 84</text>
                <text x="200" y="185" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#fca5a5" text-anchor="middle">QUORUM STATUS: FAILING</text>
              </g>

              <!-- Severed Network Cut (Split Brain Barrier) -->
              <line x1="460" y1="75" x2="460" y2="305" stroke="#ef4444" stroke-width="5" stroke-dasharray="14 10" />
              <g transform="translate(425, 160)">
                <rect width="70" height="40" rx="8" fill="#7f1d1d" stroke="#ef4444" stroke-width="2" />
                <text x="35" y="26" font-family="DejaVu Sans Mono, monospace" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">⚡</text>
              </g>

              <!-- Right Majority Recovery Quorum Node -->
              <g transform="translate(510, 75)">
                <rect width="400" height="230" rx="14" fill="#042f2e" stroke="#10b981" stroke-width="2" />
                <text x="200" y="38" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="bold" fill="#6ee7b7" text-anchor="middle">MAJORITY PARTITION</text>
                <rect x="25" y="60" width="350" height="34" rx="6" fill="#065f46" />
                <text x="200" y="82" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#34d399" text-anchor="middle">NODE REPLICA QUORUM (2/3)</text>
                <rect x="25" y="105" width="350" height="34" rx="6" fill="#022c22" stroke="#10b981" stroke-width="1" />
                <text x="200" y="127" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#facc15" text-anchor="middle">ELECTION TRIGGERED: FAILOVER</text>
                <text x="200" y="185" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#6ee7b7" text-anchor="middle">SPLIT-BRAIN SAFELY PREVENTED</text>
              </g>

              <!-- Bottom Failure Tradeoff Warning -->
              <g transform="translate(10, 330)">
                <rect width="900" height="54" rx="10" fill="#18181b" stroke="#3f3f46" stroke-width="1.5" />
                <text x="30" y="33" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#f87171">PRODUCTION TRADEOFF:</text>
                <text x="220" y="33" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#f4f4f5">SYSTEM PREFERS CONSISTENCY OVER SILENT DATA CORRUPTION</text>
              </g>
            </g>
          </g>
        `;
            }
            else {
                // SCENE 4: Invariant Proof & Engineering Tradeoff Matrix (Comparison Ledger)
                badgeText = `INVARIANT PROOF • FINAL STAGE`;
                centerVisualSvg = `
          <g transform="translate(70, 310)">
            <!-- Top Progress Pills -->
            <g transform="translate(10, 0)">${progressPills}</g>

            <g transform="translate(10, 60)">
              <!-- Top Verified Banner -->
              <rect width="920" height="52" rx="10" fill="#032e25" stroke="#10b981" stroke-width="2" />
              <circle cx="26" cy="26" r="7" fill="#10b981" />
              <text x="46" y="32" font-family="DejaVu Sans Mono, monospace" font-size="14" font-weight="bold" fill="#6ee7b7">ARCHITECTURAL INVARIANT VERIFIED &amp; SEALED</text>
              <text x="890" y="32" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#34d399" text-anchor="end">ZERO DATA LOSS</text>

              <!-- Left Comparison Box: Guaranteed Properties -->
              <g transform="translate(10, 75)">
                <rect width="440" height="230" rx="14" fill="#062e26" stroke="#10b981" stroke-width="2" />
                <rect x="20" y="14" width="400" height="28" rx="6" fill="#024738" />
                <text x="220" y="33" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#34d399" text-anchor="middle">GUARANTEED SYSTEM PROPERTIES</text>
                
                <text x="30" y="80" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#a7f3d0">✓ ATOMIC STATE TRANSITIONS</text>
                <text x="30" y="115" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#a7f3d0">✓ DETERMINISTIC CONCURRENCY</text>
                <text x="30" y="150" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#a7f3d0">✓ STRICT LINEARIZABLE READS</text>
                <text x="30" y="185" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#34d399">✓ ZERO UNCOMMITTED DRIFT</text>
              </g>

              <!-- Right Comparison Box: The Engineering Sacrifice -->
              <g transform="translate(470, 75)">
                <rect width="440" height="230" rx="14" fill="#13192b" stroke="#334155" stroke-width="2" />
                <rect x="20" y="14" width="400" height="28" rx="6" fill="#1e293b" />
                <text x="220" y="33" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#94a3b8" text-anchor="middle">ENGINEERING TRADE-OFF</text>

                <text x="30" y="80" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#cbd5e1">✗ RAW THROUGHPUT CAPPED</text>
                <text x="30" y="115" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#cbd5e1">✗ NETWORK ROUND-TRIP LATENCY</text>
                <text x="30" y="150" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="#cbd5e1">✗ MAJORITY QUORUM OVERHEAD</text>
                <text x="30" y="185" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#f59e0b">✗ BOUND TO PHYSICAL LAWS</text>
              </g>

              <!-- Bottom Durable Mental Model Badge -->
              <g transform="translate(10, 330)">
                <rect width="900" height="54" rx="10" fill="#091424" stroke="#1d4ed8" stroke-width="1.5" />
                <text x="450" y="33" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#93c5fd" text-anchor="middle">DURABLE MENTAL MODEL: ${invRule.toUpperCase().slice(0, 56)}</text>
              </g>
            </g>
          </g>
        `;
            }
        }
        const keyPillText = isBloom
            ? "GUARANTEED ZERO FALSE NEGATIVES"
            : isBinarySearch
                ? (index === 0 ? "O(log n) SEARCH HORIZON" : index === 3 ? "DIRECT LOGARITHMIC HIT" : "HALVING SEARCH BOUNDS")
                : this.escapeXml((props.learningOutcome || "SYSTEM INVARIANT").toUpperCase().slice(0, 36));
        const svg = `
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

        <!-- Top Engineering Status Strip (Anti-Slop: Monolithic Accent and Concrete Telemetry) -->
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
          <text x="${width - 140 - 75}" y="23" font-family="DejaVu Sans Mono, monospace" font-size="12" font-weight="bold" fill="#94a3b8" text-anchor="middle">STAGE ${index + 1} / ${props.totalSteps || 4}</text>
        </g>

        <!-- High-Contrast Title and Subtitle (Dynamically scaled and strictly bounded) -->
        <text x="70" y="200" font-family="DejaVu Sans, Arial" font-size="${titleFontSize}" font-weight="800" fill="#f8fafc">${title}</text>
        <text x="70" y="236" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="600" fill="#64748b" letter-spacing="1">PRODUCTION ARCHITECTURE SPECIFICATION</text>

        <!-- Center Visual Active Canvas (Upper 2/3: y in 260 to 1140) -->
        <g transform="translate(0, 0)">
          ${centerVisualSvg}
        </g>

        <!-- Lower 1/3 Safe Zone: (y >= 1150) intentionally pitch black and clean for Character Avatar and Karaoke Captions -->
      </svg>
    `;
        return svg
            .replace(/&APOS;/gi, "&#39;")
            .replace(/&QUOT;/gi, "&#34;")
            .replace(/&AMP;/gi, "&amp;")
            .replace(/&LT;/gi, "&lt;")
            .replace(/&GT;/gi, "&gt;")
            .replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
    }
    async renderFinalVideo(storyboard, script, jobDir) {
        const rawVideoOutPath = path.join(jobDir, "raw_scenes.mp4");
        const fullAudioOutPath = path.join(jobDir, "full_narration.mp3");
        const finalVideoOutPath = path.join(jobDir, "final_video.mp4");
        const sceneVideoPaths = [];
        // Vertical 9:16 standard Reel resolution (1080 x 1920)
        const reelWidth = 1080;
        const reelHeight = 1920;
        // 1. Generate full unified narration audio and continuous captions.json
        let continuousCurrentSec = 0.0;
        const unifiedSegments = [];
        const audioConcatListPath = path.join(jobDir, "audio_concat.txt");
        let audioConcatContent = "";
        for (let i = 0; i < script.segments.length; i++) {
            const seg = script.segments[i];
            const segAudioPath = path.join(jobDir, `${seg.segmentId}.mp3`);
            const segDur = Math.max(2.5, seg.audioDurationSeconds || 4.0);
            const segStartSec = continuousCurrentSec;
            const segEndSec = segStartSec + segDur;
            if (fs.existsSync(segAudioPath)) {
                audioConcatContent += `file '${path.resolve(segAudioPath)}'\n`;
            }
            const words = (seg.wordTimings || []).map((wt) => {
                const wStart = segStartSec + wt.startMs / 1000.0;
                const wEnd = segStartSec + wt.endMs / 1000.0;
                return {
                    word: wt.word,
                    start: Math.round(wStart * 100) / 100,
                    end: Math.round(wEnd * 100) / 100,
                };
            });
            unifiedSegments.push({
                id: i,
                start: Math.round(segStartSec * 100) / 100,
                end: Math.round(segEndSec * 100) / 100,
                text: seg.narrationText,
                words,
            });
            continuousCurrentSec = segEndSec;
        }
        const unifiedCaptions = {
            duration: Math.round(continuousCurrentSec * 100) / 100,
            segments: unifiedSegments,
        };
        const captionsJsonPath = path.join(jobDir, "captions.json");
        fs.writeFileSync(captionsJsonPath, JSON.stringify(unifiedCaptions, null, 2), "utf-8");
        fs.writeFileSync(audioConcatListPath, audioConcatContent, "utf-8");
        // Concatenate full narration audio
        await new Promise((resolve, reject) => {
            const proc = spawn(this.ffmpegPath, [
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", audioConcatListPath,
                "-c", "copy",
                fullAudioOutPath,
            ]);
            proc.on("close", (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Failed to concatenate audio tracks`));
            });
        });
        // 2. Render timed scenes via Manim Community (Reel-Generator-Engine Pipeline)
        let renderedViaManim = false;
        const manimBin = this.getManimBinary();
        const scenesPyPath = path.join(jobDir, "scenes.py");
        if (storyboard.manimScript) {
            try {
                fs.writeFileSync(scenesPyPath, storyboard.manimScript, "utf-8");
                const sceneMatches = [...storyboard.manimScript.matchAll(/class\s+(Scene\w+)\s*\(/g)];
                const sceneClassNames = sceneMatches.map((m) => m[1]);
                if (sceneClassNames.length > 0 && fs.existsSync(manimBin)) {
                    console.log(`[VideoRendererService] Rendering ${sceneClassNames.length} scenes via Manim (${manimBin})...`);
                    const mediaDir = path.join(jobDir, "manim_media");
                    await new Promise((resolve, reject) => {
                        const proc = spawn(manimBin, [
                            "-qh",
                            "--format", "mp4",
                            scenesPyPath,
                            ...sceneClassNames,
                            "--media_dir", mediaDir,
                        ]);
                        proc.stdout.on("data", (d) => console.log(`[Manim] ${d.toString().trim()}`));
                        proc.stderr.on("data", (d) => console.warn(`[Manim] ${d.toString().trim()}`));
                        proc.on("close", (code) => {
                            if (code === 0)
                                resolve();
                            else
                                reject(new Error(`Manim render failed with code ${code}`));
                        });
                    });
                    // Verify all rendered scene MP4s exist
                    const manimClips = [];
                    for (const scName of sceneClassNames) {
                        const searchFile = (dir) => {
                            if (!fs.existsSync(dir))
                                return null;
                            const files = fs.readdirSync(dir);
                            for (const f of files) {
                                const full = path.join(dir, f);
                                if (fs.statSync(full).isDirectory()) {
                                    const res = searchFile(full);
                                    if (res)
                                        return res;
                                }
                                else if (f === `${scName}.mp4`) {
                                    return full;
                                }
                            }
                            return null;
                        };
                        const foundClip = searchFile(mediaDir);
                        if (foundClip) {
                            manimClips.push(foundClip);
                        }
                        else {
                            throw new Error(`Rendered clip for ${scName} not found in Manim media directory`);
                        }
                    }
                    if (manimClips.length === sceneClassNames.length) {
                        sceneVideoPaths.push(...manimClips);
                        renderedViaManim = true;
                        console.log(`[VideoRendererService] Successfully rendered all ${manimClips.length} scenes with Manim!`);
                    }
                }
            }
            catch (err) {
                console.warn(`[VideoRendererService] Initial Manim rendering failed: ${err.message}. Regenerating scenes with procedural Manim engine...`);
                sceneVideoPaths.length = 0;
                try {
                    const fallbackScript = new VisualPlanningAgent().generateProceduralManimScript(script);
                    fs.writeFileSync(scenesPyPath, fallbackScript, "utf-8");
                    const fallbackMatches = [...fallbackScript.matchAll(/class\s+(Scene\w+)\s*\(/g)];
                    const fallbackClassNames = fallbackMatches.map((m) => m[1]);
                    const mediaDir = path.join(jobDir, "manim_media_fallback");
                    console.log(`[VideoRendererService] Rendering ${fallbackClassNames.length} procedural Manim scenes...`);
                    await new Promise((resolve, reject) => {
                        const proc = spawn(manimBin, [
                            "-qh",
                            "--format", "mp4",
                            scenesPyPath,
                            ...fallbackClassNames,
                            "--media_dir", mediaDir,
                        ]);
                        proc.stdout.on("data", (d) => console.log(`[Manim-Fallback] ${d.toString().trim()}`));
                        proc.stderr.on("data", (d) => console.warn(`[Manim-Fallback] ${d.toString().trim()}`));
                        proc.on("close", (code) => {
                            if (code === 0)
                                resolve();
                            else
                                reject(new Error(`Fallback Manim render failed with code ${code}`));
                        });
                    });
                    const fallbackClips = [];
                    for (const scName of fallbackClassNames) {
                        const searchFile = (dir) => {
                            if (!fs.existsSync(dir))
                                return null;
                            const files = fs.readdirSync(dir);
                            for (const f of files) {
                                const full = path.join(dir, f);
                                if (fs.statSync(full).isDirectory()) {
                                    const res = searchFile(full);
                                    if (res)
                                        return res;
                                }
                                else if (f === `${scName}.mp4`) {
                                    return full;
                                }
                            }
                            return null;
                        };
                        const foundClip = searchFile(mediaDir);
                        if (foundClip)
                            fallbackClips.push(foundClip);
                    }
                    if (fallbackClips.length === fallbackClassNames.length) {
                        sceneVideoPaths.push(...fallbackClips);
                        renderedViaManim = true;
                        console.log(`[VideoRendererService] Successfully rendered all ${fallbackClips.length} scenes with procedural Manim engine!`);
                    }
                }
                catch (fallbackErr) {
                    console.error(`[VideoRendererService] Procedural Manim also failed:`, fallbackErr.message);
                    sceneVideoPaths.length = 0;
                }
            }
        }
        // Fallback: Render timed scenes with progressive motion subframes if Manim wasn't used
        if (!renderedViaManim) {
            console.log(`[VideoRendererService] Rendering scenes via SVG progressive pipeline...`);
            for (let i = 0; i < storyboard.scenes.length; i++) {
                const scene = storyboard.scenes[i];
                const segment = script.segments[i];
                const sceneVideoPath = path.join(jobDir, `scene_${i + 1}.mp4`);
                const duration = Math.max(2.5, segment.audioDurationSeconds || scene.durationSeconds || 4.0);
                const subDuration = duration / 2;
                const subVideoPaths = [];
                for (let s = 0; s < 2; s++) {
                    const subPngPath = path.join(jobDir, `scene_${i + 1}_sub_${s}.png`);
                    const subVidPath = path.join(jobDir, `scene_${i + 1}_sub_${s}.mp4`);
                    const svgContent = this.generateSceneSVG(scene, i, reelWidth, reelHeight, s);
                    const resvg = new Resvg(svgContent, {
                        fitTo: { mode: "width", value: reelWidth },
                        font: {
                            loadSystemFonts: true,
                            defaultFontFamily: "DejaVu Sans",
                        },
                    });
                    fs.writeFileSync(subPngPath, resvg.render().asPng());
                    await new Promise((resolve, reject) => {
                        const proc = spawn(this.ffmpegPath, [
                            "-y",
                            "-loop", "1",
                            "-i", subPngPath,
                            "-t", `${subDuration}`,
                            "-c:v", "libx264",
                            "-tune", "stillimage",
                            "-vf", `scale=${reelWidth}:${reelHeight}`,
                            "-pix_fmt", "yuv420p",
                            subVidPath,
                        ]);
                        proc.on("close", (code) => {
                            if (code === 0) {
                                subVideoPaths.push(subVidPath);
                                resolve();
                            }
                            else {
                                reject(new Error(`Scene ${i + 1} subframe ${s} render failed`));
                            }
                        });
                    });
                }
                const subConcatPath = path.join(jobDir, `scene_${i + 1}_concat.txt`);
                fs.writeFileSync(subConcatPath, subVideoPaths.map((p) => `file '${path.resolve(p)}'`).join("\n"), "utf-8");
                await new Promise((resolve, reject) => {
                    const proc = spawn(this.ffmpegPath, [
                        "-y",
                        "-f", "concat",
                        "-safe", "0",
                        "-i", subConcatPath,
                        "-c", "copy",
                        sceneVideoPath,
                    ]);
                    proc.on("close", (code) => {
                        if (code === 0) {
                            sceneVideoPaths.push(sceneVideoPath);
                            resolve();
                        }
                        else {
                            reject(new Error(`Scene ${i + 1} concatenation failed`));
                        }
                    });
                });
            }
        }
        // 3. Concatenate scene clips
        const sceneConcatListPath = path.join(jobDir, "scene_concat.txt");
        const sceneConcatContent = sceneVideoPaths.map((p) => `file '${path.resolve(p)}'`).join("\n");
        fs.writeFileSync(sceneConcatListPath, sceneConcatContent, "utf-8");
        await new Promise((resolve, reject) => {
            const proc = spawn(this.ffmpegPath, [
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", sceneConcatListPath,
                "-c", "copy",
                rawVideoOutPath,
            ]);
            proc.on("close", (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Scene video concatenation failed`));
            });
        });
        // 4. Generate high-retention karaoke caption timeline via caption_overlay
        const captionsDir = path.join(jobDir, "captions");
        const selectedAvatar = storyboard?.avatar?.id
            ? AvatarService.getAvatarById(storyboard.avatar.id)
            : AvatarService.selectAvatarForTopic(script.title, script.targetAudience);
        const assetPath = AvatarService.getAvatarPath(selectedAvatar.id);
        console.log(`[VideoRenderer] Using topic avatar "${selectedAvatar.name}" (${selectedAvatar.id}) from ${assetPath}`);
        let captionConcatFile = null;
        let captionY = 1161;
        try {
            let pyScript = path.resolve(process.cwd(), "scripts/render_captions.py");
            if (!fs.existsSync(pyScript)) {
                pyScript = path.resolve(process.cwd(), "backend/scripts/render_captions.py");
            }
            const pyProc = spawn("python3", [pyScript, captionsJsonPath, captionsDir, assetPath]);
            let pyOutput = "";
            pyProc.stdout.on("data", (d) => (pyOutput += d.toString()));
            pyProc.stderr.on("data", (d) => console.warn(`[caption_overlay] ${d.toString()}`));
            await new Promise((resolve) => {
                pyProc.on("close", (code) => {
                    if (code === 0 && pyOutput.includes("---CAPTION_OUTPUT_START---")) {
                        const rawJson = pyOutput
                            .split("---CAPTION_OUTPUT_START---")[1]
                            .split("---CAPTION_OUTPUT_END---")[0]
                            .trim();
                        const parsed = JSON.parse(rawJson);
                        captionConcatFile = parsed.concatFile;
                        captionY = parsed.captionY || 1161;
                    }
                    resolve();
                });
            });
        }
        catch (err) {
            console.warn("[VideoRenderer] caption_overlay failed, proceeding without external caption overlay:", err.message);
        }
        // 5. Final multi-track compilation with Asset Avatar, Karaoke Captions, and 1.2x Pacing Acceleration
        await new Promise((resolve, reject) => {
            const inputs = ["-y", "-i", rawVideoOutPath, "-i", fullAudioOutPath];
            let nextInputIdx = 2;
            let assetInputIdx = -1;
            let captionInputIdx = -1;
            const hasAsset = fs.existsSync(assetPath);
            if (hasAsset) {
                inputs.push("-i", assetPath);
                assetInputIdx = nextInputIdx++;
            }
            if (captionConcatFile && fs.existsSync(captionConcatFile)) {
                inputs.push("-f", "concat", "-safe", "0", "-i", captionConcatFile);
                captionInputIdx = nextInputIdx++;
            }
            const filters = [];
            let curV = "[0:v]";
            if (hasAsset && assetInputIdx !== -1) {
                // Asset width: 45% of frame (approx 486px)
                filters.push(`[${assetInputIdx}:v]scale=486:-2[scaled_asset]`);
                filters.push(`${curV}[scaled_asset]overlay=x=main_w*0.048:y=main_h-overlay_h-(main_h*-0.016)[v_asset]`);
                curV = "[v_asset]";
            }
            if (captionInputIdx !== -1) {
                filters.push(`${curV}[${captionInputIdx}:v]overlay=x=0:y=${captionY}[v_cap]`);
                curV = "[v_cap]";
            }
            // High-retention 1.2x pacing speedup
            filters.push(`${curV}setpts=PTS/1.2[v_final]`);
            filters.push(`[1:a]atempo=1.2[a_final]`);
            const ffmpegArgs = [
                ...inputs,
                "-filter_complex", filters.join(";"),
                "-map", "[v_final]",
                "-map", "[a_final]",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                finalVideoOutPath,
            ];
            const proc = spawn(this.ffmpegPath, ffmpegArgs);
            let errLog = "";
            proc.stderr.on("data", (d) => (errLog += d.toString()));
            proc.on("close", (code) => {
                if (code === 0)
                    resolve();
                else {
                    console.warn(`Multi-track composite failed (${code}): ${errLog}. Falling back to simple merge.`);
                    // Simple fallback
                    const fallbackProc = spawn(this.ffmpegPath, [
                        "-y",
                        "-i", rawVideoOutPath,
                        "-i", fullAudioOutPath,
                        "-filter_complex", "[0:v]setpts=PTS/1.2[v];[1:a]atempo=1.2[a]",
                        "-map", "[v]",
                        "-map", "[a]",
                        "-c:v", "libx264",
                        "-pix_fmt", "yuv420p",
                        "-c:a", "aac",
                        "-b:a", "192k",
                        "-shortest",
                        finalVideoOutPath,
                    ]);
                    fallbackProc.on("close", (c) => {
                        if (c === 0)
                            resolve();
                        else
                            reject(new Error(`Fallback video render failed: ${errLog}`));
                    });
                }
            });
        });
        return finalVideoOutPath;
    }
}
