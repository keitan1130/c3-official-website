import { loadEnv } from "vite";

export function loadSiteEnvironment(mode = "production", root = process.cwd()) {
  const env = loadEnv(mode, root, "VITE_");
  if (env.VITE_SITE_URL !== undefined)
    process.env.VITE_SITE_URL = env.VITE_SITE_URL;
  else delete process.env.VITE_SITE_URL;
}

export { EXTERNAL_LINKS, PAGE_TITLES, SITE } from "../../src/config/site.ts";
