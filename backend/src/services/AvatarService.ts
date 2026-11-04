import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";

export interface AvatarProfile {
  id: string;
  name: string;
  filename: string;
  description: string;
  customPath?: string;
}

export class AvatarService {
  // Map of common technology keywords to Devicon CDN icon slugs
  private static TECH_ALIASES: Record<string, string> = {
    postgresql: "postgresql",
    postgres: "postgresql",
    pg: "postgresql",
    kubernetes: "kubernetes",
    k8s: "kubernetes",
    redis: "redis",
    docker: "docker",
    container: "docker",
    containers: "docker",
    kafka: "apachekafka",
    apachekafka: "apachekafka",
    nginx: "nginx",
    mongodb: "mongodb",
    mongo: "mongodb",
    sqlite: "sqlite",
    sqlite3: "sqlite",
    react: "react",
    vue: "vuejs",
    vuejs: "vuejs",
    angular: "angularjs",
    nodejs: "nodejs",
    node: "nodejs",
    typescript: "typescript",
    ts: "typescript",
    javascript: "javascript",
    js: "javascript",
    python: "python",
    rust: "rust",
    golang: "go",
    go: "go",
    linux: "linux",
    kernel: "linux",
    ubuntu: "ubuntu",
    debian: "debian",
    arch: "archlinux",
    archlinux: "archlinux",
    git: "git",
    github: "github",
    gitlab: "gitlab",
    cplusplus: "cplusplus",
    cpp: "cplusplus",
    c: "c",
    java: "java",
    spring: "spring",
    aws: "amazonwebservices",
    gcp: "googlecloud",
    azure: "azure",
    terraform: "terraform",
    ansible: "ansible",
    bash: "bash",
    shell: "bash",
    vim: "vim",
    neovim: "neovim",
    mysql: "mysql",
    mariadb: "mariadb",
    rabbitmq: "rabbitmq",
    elasticsearch: "elasticsearch",
    grafana: "grafana",
    prometheus: "prometheus",
    electron: "electron",
    flutter: "flutter",
    swift: "swift",
    kotlin: "kotlin",
    ruby: "ruby",
    rails: "rails",
    php: "php",
    laravel: "laravel",
    tailwindcss: "tailwindcss",
    tailwind: "tailwindcss",
    css: "css3",
    css3: "css3",
    html: "html5",
    html5: "html5",
    sass: "sass",
    webpack: "webpack",
    vite: "vitejs",
    nextjs: "nextjs",
    next: "nextjs",
    graphql: "graphql",
  };

  // Pre-cached famous cartoon stickers (real, non-AI)
  private static CARTOON_AVATARS: Record<string, AvatarProfile> = {
    tux_linux: {
      id: "tux_linux",
      name: "Tux (Linux Penguin)",
      filename: "tux_linux.png",
      description: "Iconic open-source mascot for OS, systems, networking, and engineering.",
    },
    rick_sanchez: {
      id: "rick_sanchez",
      name: "Rick Sanchez",
      filename: "rick_sanchez.png",
      description: "Famous cynical scientist sticker for chaos, bugs, exploits, and deep edge-cases.",
    },
    homer_simpson: {
      id: "homer_simpson",
      name: "Homer Simpson",
      filename: "homer_simpson.png",
      description: "Classic cartoon sticker for everyday developer humor and simple explainers.",
    },
    ferris_rust: {
      id: "ferris_rust",
      name: "Ferris (Rust)",
      filename: "ferris_rust.png",
      description: "Official Rust community mascot for memory safety and concurrency.",
    },
    gopher_go: {
      id: "gopher_go",
      name: "Go Gopher",
      filename: "gopher_go.png",
      description: "Official Go mascot by Renee French for backend microservices.",
    },
    octocat_git: {
      id: "octocat_git",
      name: "GitHub Octocat",
      filename: "octocat_git.png",
      description: "GitHub Octocat mascot for version control and open source.",
    },
    docker_whale: {
      id: "docker_whale",
      name: "Docker Whale (Moby Dock)",
      filename: "docker_whale.png",
      description: "Official Docker mascot for containerization.",
    },
    python_mascot: {
      id: "python_mascot",
      name: "Python Mascot",
      filename: "python_mascot.png",
      description: "Official Python language mascot.",
    },
    peter_meme: {
      id: "peter_meme",
      name: "Peter Griffin",
      filename: "peter_meme.png",
      description: "Pop-culture cartoon sticker for satire and parodies.",
    },
  };

  public static DEFAULT_CARTOON_ID = "tux_linux";

  private static getAvatarsDir(): string {
    const rootAssets = path.resolve(process.cwd(), "backend/assets/avatars");
    const localAssets = path.resolve(process.cwd(), "assets/avatars");
    return fs.existsSync(rootAssets) ? rootAssets : localAssets;
  }

  /**
   * Dynamically fetches a real official technology sticker at runtime,
   * or falls back to a famous cartoon character if no tech sticker exists.
   */
  public static async fetchRuntimeSticker(title: string, targetAudience?: string): Promise<AvatarProfile> {
    const corpus = `${title || ""} ${targetAudience || ""}`.toLowerCase();
    const avatarsDir = this.getAvatarsDir();
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    // 1. Detect if any known technology entity is mentioned in the topic
    let detectedSlug: string | null = null;
    for (const [kw, slug] of Object.entries(this.TECH_ALIASES)) {
      const regex = new RegExp(`\\b${kw}(?:s|es|ing|ed)?\\b`, "i");
      if (regex.test(corpus)) {
        detectedSlug = slug;
        break;
      }
    }

    // 2. If a technology entity was detected, try to retrieve or fetch its official sticker
    if (detectedSlug) {
      // Check if already in curated cartoon catalog
      if (detectedSlug === "rust" && fs.existsSync(path.join(avatarsDir, "ferris_rust.png"))) {
        return this.CARTOON_AVATARS.ferris_rust;
      }
      if (detectedSlug === "go" && fs.existsSync(path.join(avatarsDir, "gopher_go.png"))) {
        return this.CARTOON_AVATARS.gopher_go;
      }
      if (detectedSlug === "git" && fs.existsSync(path.join(avatarsDir, "octocat_git.png"))) {
        return this.CARTOON_AVATARS.octocat_git;
      }
      if (detectedSlug === "docker" && fs.existsSync(path.join(avatarsDir, "docker_whale.png"))) {
        return this.CARTOON_AVATARS.docker_whale;
      }
      if (detectedSlug === "python" && fs.existsSync(path.join(avatarsDir, "python_mascot.png"))) {
        return this.CARTOON_AVATARS.python_mascot;
      }
      if (detectedSlug === "linux" && fs.existsSync(path.join(avatarsDir, "tux_linux.png"))) {
        return this.CARTOON_AVATARS.tux_linux;
      }

      // Check if already cached in assets/avatars
      const cachedFile = path.join(avatarsDir, `${detectedSlug}.png`);
      if (fs.existsSync(cachedFile)) {
        console.log(`[AvatarService] Using cached sticker for "${detectedSlug}"`);
        return {
          id: `tech_${detectedSlug}`,
          name: detectedSlug.toUpperCase(),
          filename: `${detectedSlug}.png`,
          description: `Official ${detectedSlug} sticker`,
          customPath: cachedFile,
        };
      }

      // Dynamically fetch official vector from Devicon CDN at runtime
      const cdnUrls = [
        `https://raw.githubusercontent.com/devicons/devicon/master/icons/${detectedSlug}/${detectedSlug}-original.svg`,
        `https://raw.githubusercontent.com/devicons/devicon/master/icons/${detectedSlug}/${detectedSlug}-plain.svg`,
      ];

      for (const url of cdnUrls) {
        try {
          console.log(`[AvatarService] Fetching official sticker from: ${url}`);
          const res = await fetch(url);
          if (res.ok) {
            const svgContent = await res.text();
            if (svgContent && svgContent.includes("<svg")) {
              const resvg = new Resvg(svgContent, { fitTo: { mode: "width", value: 800 } });
              const pngData = resvg.render().asPng();
              fs.writeFileSync(cachedFile, pngData);
              console.log(`[AvatarService] Successfully cached official sticker "${detectedSlug}.png" (${pngData.length} bytes)`);

              return {
                id: `tech_${detectedSlug}`,
                name: detectedSlug.toUpperCase(),
                filename: `${detectedSlug}.png`,
                description: `Official ${detectedSlug} sticker`,
                customPath: cachedFile,
              };
            }
          }
        } catch (err: any) {
          console.warn(`[AvatarService] Could not fetch sticker from ${url}:`, err.message);
        }
      }
    }

    // 3. Fallback: Select a famous cartoon character based on context
    const chaosKeywords = ["bug", "crash", "chaos", "hack", "exploit", "leak", "failure", "insane", "rant", "break", "heisenbug"];
    const memeKeywords = ["meme", "funny", "joke", "comedy", "parody"];

    if (chaosKeywords.some((k) => corpus.includes(k))) {
      console.log(`[AvatarService] Using famous cartoon character: Rick Sanchez (chaos/debug context)`);
      return this.CARTOON_AVATARS.rick_sanchez;
    }

    if (memeKeywords.some((k) => corpus.includes(k))) {
      console.log(`[AvatarService] Using famous cartoon character: Homer Simpson (meme context)`);
      return this.CARTOON_AVATARS.homer_simpson;
    }

    // Default famous cartoon character: Tux the Linux penguin
    console.log(`[AvatarService] Using default famous cartoon mascot: Tux the Linux Penguin`);
    return this.CARTOON_AVATARS[this.DEFAULT_CARTOON_ID];
  }

  /**
   * Resolves the absolute disk path to the avatar image file.
   */
  public static getAvatarPath(avatarId?: string, customPath?: string): string {
    if (customPath && fs.existsSync(customPath)) {
      return customPath;
    }

    const avatarsDir = this.getAvatarsDir();
    const avatar = (avatarId && this.CARTOON_AVATARS[avatarId]) || this.CARTOON_AVATARS[this.DEFAULT_CARTOON_ID];
    const targetFile = path.join(avatarsDir, avatar.filename);

    if (fs.existsSync(targetFile)) {
      return targetFile;
    }

    // Fallback to tux or any existing png
    const defaultFile = path.join(avatarsDir, "tux_linux.png");
    if (fs.existsSync(defaultFile)) {
      return defaultFile;
    }

    return path.resolve(process.cwd(), "backend/assets/asset.png");
  }
}
