import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { MetaModelAPIProvider } from "../providers/meta/MetaModelAPIProvider.js";
export class AvatarService {
    static AVATARS = [
        {
            id: "cyberpunk_hacker",
            name: "Security Hacker",
            filename: "cyberpunk_hacker.png",
            description: "Cyberpunk security specialist with glowing cyan visor and dark hoodie.",
            keywords: ["ssl", "tls", "security", "crypto", "cryptography", "hacker", "exploit", "firewall", "mitm", "auth", "certificate", "cipher", "injection", "attack", "wifi"],
        },
        {
            id: "tux_linux",
            name: "Tux (Linux)",
            filename: "tux_linux.png",
            description: "Iconic Linux mascot for OS, systems, CLI, and kernel architecture.",
            keywords: ["linux", "kernel", "syscall", "unix", "posix", "bash", "cli", "shell", "process", "thread", "ubuntu", "debian", "filesystem"],
        },
        {
            id: "ferris_rust",
            name: "Ferris the Crab (Rust)",
            filename: "ferris_rust.png",
            description: "Official Rust mascot for memory safety, concurrency, and low-level code.",
            keywords: ["rust", "rustacean", "borrow", "ownership", "memory", "concurrency", "unsafe", "lifetimes", "cargo"],
        },
        {
            id: "gopher_go",
            name: "Go Gopher",
            filename: "gopher_go.png",
            description: "Official Go mascot for microservices, goroutines, and cloud backends.",
            keywords: ["go", "golang", "goroutine", "channel", "kubernetes", "k8s", "docker", "container", "microservice", "backend"],
        },
        {
            id: "octocat_git",
            name: "GitHub Octocat",
            filename: "octocat_git.png",
            description: "GitHub Octocat for version control, CI/CD, and developer workflows.",
            keywords: ["git", "github", "commit", "branch", "pull request", "merge", "rebase", "repo", "repository", "ci/cd", "devops"],
        },
        {
            id: "staff_architect",
            name: "Staff Architect (Default)",
            filename: "staff_architect.png",
            description: "Modern senior systems architect with glasses, badge, and terminal coffee mug.",
            keywords: ["system design", "architecture", "database", "acid", "transaction", "sql", "nosql", "distributed", "cache", "redis", "scale", "performance", "atomic", "consistency"],
        },
        {
            id: "peter_meme",
            name: "Peter (Meme / Comedy)",
            filename: "peter_meme.png",
            description: "Humorous pop-culture persona reserved only for memes, comedy, or satire.",
            keywords: ["meme", "comedy", "joke", "satire", "funny", "parody", "peter"],
        },
    ];
    static DEFAULT_AVATAR_ID = "staff_architect";
    static listAvatars() {
        return this.AVATARS;
    }
    static getAvatarById(id) {
        const found = this.AVATARS.find((a) => a.id === id);
        return found || this.AVATARS.find((a) => a.id === this.DEFAULT_AVATAR_ID);
    }
    /**
     * Intelligently selects the best-fitting avatar based on topic keywords and context.
     * Never selects Peter Griffin unless explicitly tagged with meme/comedy keywords.
     */
    static selectAvatarForTopic(title, domain, tags) {
        const textCorpus = [
            title || "",
            domain || "",
            ...(tags || []),
        ].join(" ").toLowerCase();
        // Check specific avatars (excluding the meme avatar initially)
        for (const avatar of this.AVATARS) {
            if (avatar.id === "peter_meme" || avatar.id === this.DEFAULT_AVATAR_ID)
                continue;
            for (const kw of avatar.keywords) {
                // Match word boundaries with optional plural/verb endings (e.g. goroutine -> goroutines)
                const regex = new RegExp(`\\b${kw}(?:s|es|ing|ed)?\\b`, "i");
                if (regex.test(textCorpus)) {
                    return avatar;
                }
            }
        }
        // Check meme avatar ONLY if explicit meme words appear
        const memeAvatar = this.AVATARS.find((a) => a.id === "peter_meme");
        if (memeAvatar) {
            for (const kw of memeAvatar.keywords) {
                const regex = new RegExp(`\\b${kw}\\b`, "i");
                if (regex.test(textCorpus)) {
                    return memeAvatar;
                }
            }
        }
        // Default to modern Staff Architect
        return this.getAvatarById(this.DEFAULT_AVATAR_ID);
    }
    /**
     * Generates a topic-specific avatar on the fly using the Meta Muse Image API.
     * Automatically isolates the character, creates transparency, and crops the bounding box.
     */
    static async generateDynamicAvatar(title, targetAudience, outputDirectory) {
        try {
            const provider = new MetaModelAPIProvider();
            if (!provider.isConfigured()) {
                console.log("[AvatarService] Meta Model API key not configured, skipping dynamic avatar generation.");
                return null;
            }
            console.log(`[AvatarService] Calling Meta Muse Image API for custom avatar: "${title}"...`);
            const personaPrompt = `Waist-up 2D vector technical cartoon illustration of a character specialist presenting "${title}". Flat vector art style, clean outlines, tech aesthetic, modern palette with slate #07090E, cyan #0EA5E9, and muted gray #94A3B8, isolated on solid pure black #000000 background, zero background clutter, facing right.`;
            const res = await provider.generateImage(personaPrompt, { size: "1024x1024" });
            if (!res.b64_json) {
                console.warn("[AvatarService] No image data returned from Muse Image API.");
                return null;
            }
            const rootAssets = path.resolve(process.cwd(), "backend/assets/avatars");
            const localAssets = path.resolve(process.cwd(), "assets/avatars");
            const defaultAvatarsDir = fs.existsSync(path.resolve(process.cwd(), "backend")) ? rootAssets : localAssets;
            const outDir = outputDirectory || defaultAvatarsDir;
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            const rawTempPath = path.join(outDir, "dynamic_avatar_raw.webp");
            const processedPath = path.join(outDir, "dynamic_avatar.png");
            fs.writeFileSync(rawTempPath, Buffer.from(res.b64_json, "base64"));
            // Process transparency & crop using process_avatar.py
            let pythonBin = path.resolve(process.cwd(), "backend/.venv-manim/bin/python3");
            if (!fs.existsSync(pythonBin)) {
                pythonBin = path.resolve(process.cwd(), ".venv-manim/bin/python3");
            }
            if (!fs.existsSync(pythonBin)) {
                pythonBin = "python3";
            }
            let scriptPath = path.resolve(process.cwd(), "backend/scripts/process_avatar.py");
            if (!fs.existsSync(scriptPath)) {
                scriptPath = path.resolve(process.cwd(), "scripts/process_avatar.py");
            }
            const proc = spawnSync(pythonBin, [scriptPath, rawTempPath, processedPath], {
                encoding: "utf-8",
                timeout: 15000,
            });
            if (proc.status !== 0 || !fs.existsSync(processedPath)) {
                console.warn("[AvatarService] Avatar post-processing failed:", proc.stderr || "Unknown error");
                return null;
            }
            // Clean up raw temp file
            try {
                if (fs.existsSync(rawTempPath))
                    fs.unlinkSync(rawTempPath);
            }
            catch (_) { }
            console.log(`[AvatarService] Successfully generated dynamic avatar at: ${processedPath}`);
            return {
                id: "dynamic_muse_avatar",
                name: `Specialist: ${title.slice(0, 24)}`,
                filename: path.basename(processedPath),
                description: `Custom Muse-generated character for "${title}"`,
                keywords: [],
                customPath: processedPath,
            };
        }
        catch (err) {
            console.warn("[AvatarService] Dynamic avatar generation failed, using curated avatar:", err.message);
            return null;
        }
    }
    /**
     * Resolves the absolute disk path to the avatar image file.
     */
    static getAvatarPath(avatarId, customPath) {
        if (customPath && fs.existsSync(customPath)) {
            return customPath;
        }
        const avatar = avatarId ? this.getAvatarById(avatarId) : this.getAvatarById(this.DEFAULT_AVATAR_ID);
        const possibleDirs = [
            path.resolve(process.cwd(), "backend/assets/avatars"),
            path.resolve(process.cwd(), "assets/avatars"),
            path.resolve(process.cwd(), "backend/assets"),
            path.resolve(process.cwd(), "assets"),
        ];
        for (const dir of possibleDirs) {
            const fullPath = path.join(dir, avatar.filename);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        // Fallback to asset.png
        for (const dir of possibleDirs) {
            const fallback = path.join(dir, "asset.png");
            if (fs.existsSync(fallback)) {
                return fallback;
            }
        }
        // Last resort
        return path.resolve(process.cwd(), "backend/assets/asset.png");
    }
}
