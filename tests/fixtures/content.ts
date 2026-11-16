import { COMMUNITIES } from "../../src/config/communities.ts";

import fs from "node:fs";
import path from "node:path";
export function contentFixture(root: string) {
  const write = (name: string, value: string | Record<string, unknown>) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      typeof value === "string" ? value : JSON.stringify(value),
    );
  };
  fs.mkdirSync(path.join(root, "news"), { recursive: true });
  write("about/index.json", { summary: "About summary", body: "./body.md" });
  write("about/body.md", "About");
  for (const { slug } of COMMUNITIES) {
    write(`communities/${slug}/index.json`, {
      domain: "Fixture field",
      body: "./body.md",
      mp4: "./assets/hero.mp4",
    });
    write(`communities/${slug}/body.md`, "Community");
    write(`communities/${slug}/assets/hero.mp4`, "video");
  }
  return write;
}
