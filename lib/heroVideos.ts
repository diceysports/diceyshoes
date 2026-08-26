import { promises as fs } from "node:fs";
import path from "node:path";

export const HERO_VIDEO_DIR = path.join(
  process.cwd(),
  "public",
  "videos",
  "hero",
);

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

/**
 * Lists the hero clips actually present in `public/videos/hero`.
 *
 * Reading the directory rather than hard-coding a manifest means dropping new
 * MP4s into that folder is all it takes to change the hero — no code edit. An
 * empty list makes the hero fall back to its poster treatment.
 */
export async function listHeroVideos(): Promise<string[]> {
  try {
    const entries = await fs.readdir(HERO_VIDEO_DIR, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) &&
          !entry.name.startsWith("."),
      )
      .map((entry) => `/videos/hero/${entry.name}`)
      .sort();
  } catch {
    return [];
  }
}
