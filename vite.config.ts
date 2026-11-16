import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import {
  localContent,
  pagesOutput,
  siteMetadata,
} from "./build/vite/plugins.ts";

import path from "node:path";

export default defineConfig({
  plugins: [react(), localContent(), siteMetadata(), pagesOutput()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
});
