import { loadEnv } from "vite";

// Node scripts use the same .env precedence as the production Vite build.
const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "VITE_");
if (env.VITE_SITE_URL) process.env.VITE_SITE_URL = env.VITE_SITE_URL;
else delete process.env.VITE_SITE_URL;

export { SITE, PAGE_TITLES } from "../src/config/site.ts";
