import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { SITE } from "../src/config/site.ts";

// Rasterize the supplied vector without changing its paths or transparency.
// Run explicitly when the logo changes; deployment builds do not need Chromium.
const directory = path.resolve("public");
const svg = fs.readFileSync(path.join(directory, SITE.logo.slice(1))).toString("base64");
const outputs = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["favicon-64x64.png", 64],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
  ["favicon-192.png", 192],
  ["favicon.png", 512],
  ["maskable-icon-512x512.png", 512, true],
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const render = async (size, isMaskable = false) => {
    const result = await page.evaluate(async ({ svg, size, isMaskable, background }) => {
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${svg}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      if (isMaskable) {
        context.fillStyle = background;
        context.fillRect(0, 0, size, size);
      }
      const logoSize = isMaskable ? size * 0.8 : size;
      const inset = (size - logoSize) / 2;
      context.drawImage(image, inset, inset, logoSize, logoSize);
      const pixels = context.getImageData(0, 0, size, size).data;
      let transparentPixels = 0;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] < 255) transparentPixels++;
      }
      return { png: canvas.toDataURL("image/png").split(",")[1], transparentPixels };
    }, { svg, size, isMaskable, background: SITE.backgroundColor });
    if (isMaskable && result.transparentPixels) throw new Error("Maskable icon must have an opaque background");
    return { buffer: Buffer.from(result.png, "base64"), transparentPixels: result.transparentPixels };
  };
  for (const [name, size, isMaskable] of outputs) {
    const result = await render(size, isMaskable);
    fs.writeFileSync(path.join(directory, name), result.buffer);
    console.log(`${name}: ${size}x${size}, ${result.transparentPixels} transparent/translucent pixels`);
  }
  // ICO supports embedded PNG images, preserving alpha in every size.
  const sizes = [16, 32, 48];
  const frames = await Promise.all(sizes.map(async size => (await render(size)).buffer));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  frames.forEach((frame, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(frame.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += frame.length;
  });
  fs.writeFileSync(path.join(directory, "favicon.ico"), Buffer.concat([header, ...frames]));
  const manifest = {
    id: "/", name: SITE.title, short_name: SITE.shortName, description: SITE.description,
    lang: "ja", start_url: "/", scope: "/", display: "standalone",
    background_color: SITE.backgroundColor, theme_color: SITE.themeColor,
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  fs.writeFileSync(path.join(directory, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log("favicon.ico: 16/32/48px; manifest.json: C3 install icons");
} finally {
  await browser.close();
}
