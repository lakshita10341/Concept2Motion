import fs from "fs";
import path from "path";
import { PipelineJob } from "../shared/types/index.js";

const STORAGE_DIR = path.resolve(process.cwd(), "storage/jobs");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export class JobStore {
  static getJobPath(id: string): string {
    return path.join(STORAGE_DIR, `${id}.json`);
  }

  static getJobDir(id: string): string {
    const dir = path.join(STORAGE_DIR, id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  static saveJob(job: PipelineJob): void {
    job.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.getJobPath(job.id), JSON.stringify(job, null, 2), "utf-8");
  }

  static getJob(id: string): PipelineJob | null {
    const p = this.getJobPath(id);
    if (!fs.existsSync(p)) return null;
    const content = fs.readFileSync(p, "utf-8");
    return JSON.parse(content);
  }

  static listJobs(): PipelineJob[] {
    const files = fs.readdirSync(STORAGE_DIR).filter((f) => f.endsWith(".json"));
    const jobs: PipelineJob[] = [];
    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(STORAGE_DIR, f), "utf-8");
        jobs.push(JSON.parse(content));
      } catch (err) {
        // ignore malformed
      }
    }
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
