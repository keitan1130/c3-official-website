import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { ContentData } from "../../src/shared/types/content.ts";

type GeneratedResult = {
  body: string;
  newsIds: string[];
  assets: Record<string, string>;
};

// Run the generated module with Node's native importer, outside Vitest's
// transformed module graph. Query imports are modeled exactly as before.
export function loadGeneratedContent(
  output: string,
  assetUrls: Record<string, string> = {},
): GeneratedResult {
  const result = execFileSync(
    process.execPath,
    [fileURLToPath(import.meta.url), output, JSON.stringify(assetUrls)],
    { encoding: "utf8" },
  );
  return JSON.parse(result) as GeneratedResult;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const output = process.argv[2];
  if (!output) throw new Error("Expected generated module path");
  const assetUrls = JSON.parse(process.argv[3] ?? "{}") as Record<
    string,
    string
  >;
  const urls = new Map<string, string>();
  const hooks = registerHooks({
    load(url, context, nextLoad) {
      if (url.endsWith("?url&no-inline")) {
        const file = fileURLToPath(url);
        if (!urls.has(file))
          urls.set(
            file,
            assetUrls[path.basename(file)] ??
              `/assets/file-${urls.size}${path.extname(file)}`,
          );
        return {
          format: "module",
          shortCircuit: true,
          source: `export default ${JSON.stringify(urls.get(file))};`,
        };
      }
      if (url.endsWith("?raw"))
        return {
          format: "module",
          shortCircuit: true,
          source: `export default ${JSON.stringify(fs.readFileSync(fileURLToPath(url), "utf8"))};`,
        };
      return nextLoad(url, context);
    },
  });
  try {
    const { default: content } = (await import(pathToFileURL(output).href)) as {
      default: ContentData;
    };
    const result: GeneratedResult = {
      body: await content.about.body(),
      newsIds: content.news.map((entry) => entry.id),
      assets: Object.fromEntries(urls),
    };
    process.stdout.write(JSON.stringify(result));
  } finally {
    hooks.deregister();
  }
}
