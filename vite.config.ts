/// <reference types="vitest/config" />

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";

import { prepareContent } from "./scripts/prepare-content.mjs";
import { createPageMetadata, PAGES, SITE } from "./src/config/site.ts";

import path from "node:path";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    {
      name: "site-metadata",
      transformIndexHtml() {
        const meta = createPageMetadata({
          title: PAGES.home.title,
          pathname: PAGES.home.path,
        });
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
    },
    {
      name: "local-content-registry",
      configureServer(server) {
        const contentRoot = path.resolve("content");
        let timer: ReturnType<typeof setTimeout>;
        server.watcher.add(contentRoot);
        const refresh = (_event: string, file: string) => {
          if (!file.startsWith(contentRoot + path.sep)) return;
          clearTimeout(timer);
          timer = setTimeout(() => {
            try {
              prepareContent();
            } catch (error) {
              server.ws.send({
                type: "error",
                err: { message: String(error), stack: "" },
              });
            }
          }, 100);
        };
        server.watcher.on("all", refresh);
        server.httpServer?.once("close", () => {
          clearTimeout(timer);
          server.watcher.off("all", refresh);
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(import.meta.dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
