/**
 * Mission 06.3 — regenerate all brand derivatives from the official mark.
 * Resize / compose only. Never recolor, crop content, filter, or redraw.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = path.join(root, "public/brand");
const attachment = path.join(
  process.env.USERPROFILE ?? "",
  ".cursor/projects/c-Users-ahmed-soda-os/assets",
  "c__Users_ahmed_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_Jul_15__2026__12_29_47_AM-127c89da-4c67-489c-9086-9dffd5b20cb6.png"
);

if (!fs.existsSync(attachment)) {
  throw new Error(`Official attachment missing: ${attachment}`);
}

const raw = fs.readFileSync(attachment);

// Canonical official: lossless PNG, exact pixels
const officialPng = await sharp(raw)
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
fs.writeFileSync(path.join(brand, "soda-logo-official.png"), officialPng);
console.log("wrote soda-logo-official.png", officialPng.length);

async function resizeSquare(size, out) {
  const buf = await sharp(officialPng)
    .resize(size, size, { kernel: sharp.kernel.lanczos3, fit: "fill" })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
  fs.writeFileSync(out, buf);
  console.log("wrote", path.basename(out), size, buf.length);
  return buf;
}

// UI aliases — same mark, no recolor / no purple plates
await resizeSquare(1024, path.join(brand, "soda-logo.png"));
await resizeSquare(1024, path.join(brand, "soda-mark-white.png"));
await resizeSquare(1024, path.join(brand, "soda-mark.png"));
await resizeSquare(1024, path.join(brand, "soda-mark-tile.png"));
await resizeSquare(1024, path.join(brand, "soda-logo-master.png"));
await resizeSquare(512, path.join(brand, "soda-icon.png"));
await resizeSquare(512, path.join(brand, "pwa-512.png"));
await resizeSquare(192, path.join(brand, "pwa-192.png"));
await resizeSquare(180, path.join(brand, "apple-touch-icon.png"));
await resizeSquare(32, path.join(brand, "favicon-32.png"));

await resizeSquare(512, path.join(root, "app/icon.png"));
await resizeSquare(180, path.join(root, "app/apple-icon.png"));
await resizeSquare(180, path.join(root, "public/apple-touch-icon.png"));

// OG 1200×630 — dark plate, centered official mark (compose only)
const ogLogo = await sharp(officialPng)
  .resize(360, 360, { kernel: sharp.kernel.lanczos3 })
  .png()
  .toBuffer();
const og = await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 3,
    background: { r: 7, g: 5, b: 15 },
  },
})
  .composite([{ input: ogLogo, gravity: "centre" }])
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
fs.writeFileSync(path.join(brand, "og-image.png"), og);
console.log("wrote og-image.png", og.length);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" role="img" aria-label="SODA">
  <title>SODA</title>
  <image width="1024" height="1024" href="/brand/soda-logo-official.png" xlink:href="/brand/soda-logo-official.png" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
fs.writeFileSync(path.join(brand, "soda-logo.svg"), svg);

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6 + 16 * count;
  let offset = headerSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let o = 6;
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const png = pngBuffers[i];
    header[o] = size >= 256 ? 0 : size;
    header[o + 1] = size >= 256 ? 0 : size;
    header[o + 2] = 0;
    header[o + 3] = 0;
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(png.length, o + 8);
    header.writeUInt32LE(offset, o + 12);
    offset += png.length;
    o += 16;
  }
  return Buffer.concat([header, ...pngBuffers]);
}

const sizes = [16, 32, 48];
const icons = [];
for (const size of sizes) {
  icons.push(
    await sharp(officialPng)
      .resize(size, size, { kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer()
  );
}
const ico = buildIco(icons, sizes);
fs.writeFileSync(path.join(brand, "favicon.ico"), ico);
fs.writeFileSync(path.join(root, "public/favicon.ico"), ico);
console.log("wrote favicon.ico", ico.length);

const verify = await sharp(path.join(brand, "soda-logo-official.png")).metadata();
console.log("verify official", verify.format, verify.width, verify.hasAlpha);
