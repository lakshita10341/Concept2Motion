import fs from "fs";
import path from "path";

export interface AvatarProfile {
  id: string;
  name: string;
  filename: string;
  description: string;
  keywords: string[];
}

export class AvatarService {
  private static AVATARS: AvatarProfile[] = [
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

  public static DEFAULT_AVATAR_ID = "staff_architect";

  public static listAvatars(): AvatarProfile[] {
    return this.AVATARS;
  }

  public static getAvatarById(id: string): AvatarProfile {
    const found = this.AVATARS.find((a) => a.id === id);
    return found || this.AVATARS.find((a) => a.id === this.DEFAULT_AVATAR_ID)!;
  }

  /**
   * Intelligently selects the best-fitting avatar based on topic keywords and context.
   * Never selects Peter Griffin unless explicitly tagged with meme/comedy keywords.
   */
  public static selectAvatarForTopic(title: string, domain?: string, tags?: string[]): AvatarProfile {
    const textCorpus = [
      title || "",
      domain || "",
      ...(tags || []),
    ].join(" ").toLowerCase();

    // Check specific avatars (excluding the meme avatar initially)
    for (const avatar of this.AVATARS) {
      if (avatar.id === "peter_meme" || avatar.id === this.DEFAULT_AVATAR_ID) continue;
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
   * Resolves the absolute disk path to the avatar image file.
   */
  public static getAvatarPath(avatarId?: string): string {
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
