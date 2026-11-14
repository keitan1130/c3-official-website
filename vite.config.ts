/// <reference types="vitest/config" />

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { prepareContent } from "./scripts/prepare-content.mjs";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), {
    name: "local-content-registry",
    configureServer(server) {
      const contentRoot = path.resolve("content");
      let timer: ReturnType<typeof setTimeout>;
      server.watcher.add(contentRoot);
      const refresh = (_event: string, file: string) => {
        if (!file.startsWith(contentRoot + path.sep)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try { prepareContent(); }
          catch (error) { server.ws.send({ type: "error", err: { message: String(error), stack: "" } }); }
        }, 100);
      };
      server.watcher.on("all", refresh);
      server.httpServer?.once("close", () => { clearTimeout(timer); server.watcher.off("all", refresh); });
    },
  }],
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
