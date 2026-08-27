import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const html = fs.readFileSync(path.join(process.cwd(), "snapshot.html"), "utf8");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
