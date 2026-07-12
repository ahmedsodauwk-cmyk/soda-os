/**
 * Extract official SODA white mark from lockup PNG.
 * Source of truth — do not redraw/simplify the mark.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC =
  "C:/Users/ahmed/.cursor/projects/c-Users-ahmed-soda-os/assets/c__Users_ahmed_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_Jul_10__2026__01_56_03_PM-db853dcc-684e-41a0-92f6-13eeb63379ca.png";
const OUT = path.join(ROOT, "public", "brand");

const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

async function main() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;

  function sample(x, y) {
    const i = (y * w + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  }

  function medianColor(pts) {
    const rs = pts.map((p) => p[0]).sort((a, b) => a - b);
    const gs = pts.map((p) => p[1]).sort((a, b) => a - b);
    const bs = pts.map((p) => p[2]).sort((a, b) => a - b);
    const m = Math.floor(pts.length / 2);
    return [rs[m], gs[m], bs[m]];
  }

  const pinkPts = [];
  const purplePts = [];
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const [r, g, b] = sample(x, y);
      if (r > 160 && g < 100 && b > 70 && b < 160) pinkPts.push([r, g, b]);
      else if (r < 70 && g < 50 && b > 50 && b < 110) purplePts.push([r, g, b]);
    }
  }
  const exactPink = medianColor(pinkPts);
  const exactPurple = medianColor(purplePts);
  console.log("pink", hex(exactPink), "purple", hex(exactPurple));

  // White mark → transparent
  const out = Buffer.alloc(w * h * 4);
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const mn = Math.min(r, g, b);
      const mx = Math.max(r, g, b);
      const chroma = mx - mn;
      let alpha = 0;
      if (mn >= 245 && chroma <= 20) alpha = 255;
      else if (mn >= 200 && chroma <= 40)
        alpha = Math.round(Math.min(255, ((mn - 180) / 75) * 255));
      else if (mn >= 160 && chroma <= 55 && r > 180 && g > 160 && b > 160)
        alpha = Math.round(Math.min(255, ((mn - 150) / 100) * 180));
      if (alpha > 8) {
        out[i] = 255;
        out[i + 1] = 255;
        out[i + 2] = 255;
        out[i + 3] = alpha;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else {
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
        out[i + 3] = 0;
      }
    }
  }

  const pad = 24;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(w - 1, maxX + pad);
  const bottom = Math.min(h - 1, maxY + pad);
  const cw = right - left + 1;
  const chh = bottom - top + 1;
  const side = Math.max(cw, chh);
  const cx = Math.floor((left + right) / 2);
  const cy = Math.floor((top + bottom) / 2);
  let sqL = Math.max(0, cx - Math.floor(side / 2));
  let sqT = Math.max(0, cy - Math.floor(side / 2));
  if (sqL + side > w) sqL = w - side;
  if (sqT + side > h) sqT = h - side;

  fs.mkdirSync(OUT, { recursive: true });

  // Clean temp/preview junk from other extractors
  for (const f of fs.readdirSync(OUT)) {
    if (/preview|tight|soda-mark-256|soda-favicon/.test(f)) {
      fs.unlinkSync(path.join(OUT, f));
    }
  }

  const whitePath = path.join(OUT, "soda-mark-white.png");
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: sqL, top: sqT, width: side, height: side })
    .png()
    .toFile(whitePath);

  // Also alias transparent mark as soda-logo.png
  await sharp(whitePath).png().toFile(path.join(OUT, "soda-logo.png"));

  // Purple tile — sampled Deep Purple #29194A
  const pHex = exactPurple;
  const markWhite = await sharp(whitePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mw = markWhite.info.width;
  const mh = markWhite.info.height;
  const tile = Buffer.alloc(mw * mh * 4);
  for (let i = 0; i < mw * mh; i++) {
    const a = markWhite.data[i * 4 + 3] / 255;
    tile[i * 4] = Math.round(255 * a + pHex[0] * (1 - a));
    tile[i * 4 + 1] = Math.round(255 * a + pHex[1] * (1 - a));
    tile[i * 4 + 2] = Math.round(255 * a + pHex[2] * (1 - a));
    tile[i * 4 + 3] = 255;
  }
  const markPath = path.join(OUT, "soda-mark.png");
  await sharp(tile, { raw: { width: mw, height: mh, channels: 4 } })
    .png()
    .toFile(markPath);

  // Compact tile for chrome
  await sharp(markPath)
    .resize(64, 64)
    .png()
    .toFile(path.join(OUT, "soda-mark-tile.png"));

  await sharp(SRC).png().toFile(path.join(OUT, "soda-logo-master.png"));

  fs.writeFileSync(
    path.join(OUT, "sampled-colors.json"),
    JSON.stringify(
      {
        deepPurple: hex(exactPurple).toUpperCase(),
        brandPink: hex(exactPink).toUpperCase(),
        white: "#FFFFFF",
      },
      null,
      2
    )
  );

  const iconSize = 512;
  const iconBg = await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: pHex[0], g: pHex[1], b: pHex[2], alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  const markResized = await sharp(whitePath)
    .resize(Math.round(iconSize * 0.72), Math.round(iconSize * 0.72), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const iconPath = path.join(OUT, "soda-icon.png");
  await sharp(iconBg)
    .composite([{ input: markResized, gravity: "centre" }])
    .png()
    .toFile(iconPath);

  await sharp(iconPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(OUT, "favicon-32.png"));
  await sharp(iconPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(OUT, "apple-touch-icon.png"));

  // App router icons
  await sharp(iconPath).png().toFile(path.join(ROOT, "app", "icon.png"));
  await sharp(iconPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(ROOT, "app", "apple-icon.png"));

  const whiteStat = fs.statSync(whitePath).size;
  const markStat = fs.statSync(markPath).size;
  console.log({ whiteStat, markStat, same: whiteStat === markStat });
  console.log(
    "files",
    fs.readdirSync(OUT).map((f) => ({
      f,
      n: fs.statSync(path.join(OUT, f)).size,
    }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
