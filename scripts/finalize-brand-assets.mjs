import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const brand = path.join(ROOT, "public", "brand");
const purple = [0x29, 0x19, 0x4a];
const whiteSrc = path.join(brand, "soda-mark-white.png");

async function tile(size, markBuf, rounded = false) {
  const mark = await sharp(markBuf)
    .resize(Math.round(size * 0.72), Math.round(size * 0.72), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  let buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: purple[0], g: purple[1], b: purple[2], alpha: 1 },
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
  if (rounded) {
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="white"/></svg>`
    );
    buf = await sharp(buf)
      .composite([{ input: svg, blend: "dest-in" }])
      .png()
      .toBuffer();
  }
  return buf;
}

async function main() {
  const markWhite = fs.readFileSync(whiteSrc);
  const mark512 = await sharp(markWhite)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(brand, "soda-mark-white.png"), mark512);
  fs.writeFileSync(path.join(brand, "soda-logo.png"), mark512);

  // soda-mark.png = purple tile (sidebar chrome convention)
  fs.writeFileSync(path.join(brand, "soda-mark.png"), await tile(512, markWhite));
  fs.writeFileSync(
    path.join(brand, "soda-mark-tile.png"),
    await tile(64, markWhite)
  );

  const icon = await tile(512, markWhite, true);
  fs.writeFileSync(path.join(brand, "soda-icon.png"), icon);
  fs.writeFileSync(
    path.join(brand, "apple-touch-icon.png"),
    await sharp(icon).resize(180, 180).png().toBuffer()
  );
  fs.writeFileSync(
    path.join(brand, "favicon-32.png"),
    await tile(32, markWhite)
  );
  fs.writeFileSync(path.join(ROOT, "app", "icon.png"), icon);
  fs.writeFileSync(path.join(ROOT, "app", "apple-icon.png"), icon);
  fs.writeFileSync(
    path.join(brand, "sampled-colors.json"),
    JSON.stringify(
      { deepPurple: "#29194A", brandPink: "#D23B68", white: "#FFFFFF" },
      null,
      2
    )
  );
  console.log("assets:", fs.readdirSync(brand));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
