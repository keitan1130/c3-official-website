import { prepareContent } from "../../scripts/content/generate.ts";
import { SITE } from "../../scripts/lib/environment.ts";
import { preparePages } from "../../scripts/pages/generate.ts";
import { createPageMetadata } from "../../src/util/pageMetadata.ts";

import path from "node:path";

import type { Plugin } from "vite";

export function localContent(): Plugin {
  let root: string;
  let cleanup: (() => void) | undefined;
  const generate = () =>
    prepareContent(
      path.join(root, "content"),
      path.join(root, "src/generated/contentData.ts"),
    );
  return {
    name: "local-content",
    configResolved(config) {
      root = config.root;
      generate();
    },
    configureServer(server) {
      const contentRoot = path.join(root, "content");
      let timer: ReturnType<typeof setTimeout>;
      server.watcher.add(contentRoot);
      const refresh = (_event: string, file: string) => {
        if (!file.startsWith(contentRoot + path.sep)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            generate();
          } catch (error) {
            server.ws.send({
              type: "error",
              err: { message: String(error), stack: "" },
            });
          }
        }, 100);
      };
      server.watcher.on("all", refresh);
      cleanup = () => {
        clearTimeout(timer);
        server.watcher.off("all", refresh);
      };
    },
    closeBundle() {
      cleanup?.();
    },
  };
}

export function siteMetadata(): Plugin {
  return {
    name: "site-metadata",
    configResolved(config) {
      const origin = config.env.VITE_SITE_URL;
      if (typeof origin === "string") process.env.VITE_SITE_URL = origin;
      else delete process.env.VITE_SITE_URL;
      SITE.origin;
    },
    transformIndexHtml() {
      const meta = createPageMetadata({ title: SITE.title, pathname: "/" });
      return [
        { tag: "title", children: meta.title, injectTo: "head" },
        {
          tag: "meta",
          attrs: { name: "theme-color", content: SITE.themeColor },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { name: "description", content: meta.description },
          injectTo: "head",
        },
      ];
    },
  };
}

export function pagesOutput(): Plugin {
  let root: string;
  let output: string;
  return {
    name: "site-pages",
    apply: "build",
    configResolved(config) {
      root = config.root;
      output = path.resolve(root, config.build.outDir);
    },
    writeBundle() {
      preparePages(root, output);
    },
  };
}
