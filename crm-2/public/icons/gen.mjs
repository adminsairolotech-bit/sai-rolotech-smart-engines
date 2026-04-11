/**
 * Pure Node.js PWA icon generator — no external packages needed
 * Uses zlib (built-in) for PNG compression
 * Run: node public/icons/gen.mjs
 */
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ─── CRC32 ─────────────────────────────────────────────── */
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ─── PNG chunk builder ──────────────────────────────────── */
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const tp  = Buffer.from(type);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tp, data])));
  return Buffer.concat([len, tp, data, crc]);
}

/* ─── Full PNG from RGBA pixel array ────────────────────── */
function makePNG(w, h, rgba) {
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0); ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; ihdrData[9] = 6; // RGBA

  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 4);
    row[0] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      row[1 + x * 4] = rgba[i];
      row[2 + x * 4] = rgba[i + 1];
      row[3 + x * 4] = rgba[i + 2];
      row[4 + x * 4] = rgba[i + 3];
    }
    rows.push(row);
  }
  const compressed = deflateSync(Buffer.concat(rows));

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ─── Draw helpers ───────────────────────────────────────── */
function inRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const d = (ax, ay, bx, by) => Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
  if (px < x + r && py < y + r && d(px, py, x + r, y + r) > r) return false;
  if (px > x + w - r && py < y + r && d(px, py, x + w - r, y + r) > r) return false;
  if (px < x + r && py > y + h - r && d(px, py, x + r, y + h - r) > r) return false;
  if (px > x + w - r && py > y + h - r && d(px, py, x + w - r, y + h - r) > r) return false;
  return true;
}

/* ─── Simple bitmap font for "SR" ─────────────────────────
   Each char is 5×7 pixels (1=filled)                       */
const FONT = {
  S: [
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,1,1,0,0],
    [0,0,0,1,0],
    [0,0,0,1,0],
    [1,0,0,1,0],
    [0,1,1,0,0],
  ],
  R: [
    [1,1,1,0,0],
    [1,0,0,1,0],
    [1,0,0,1,0],
    [1,1,1,0,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,1,0],
  ],
};

function drawChar(rgba, w, char, cx, cy, scale, r, g, b) {
  const bitmap = FONT[char];
  if (!bitmap) return;
  for (let fy = 0; fy < bitmap.length; fy++) {
    for (let fx = 0; fx < bitmap[fy].length; fx++) {
      if (!bitmap[fy][fx]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = cx + fx * scale + dx;
          const py = cy + fy * scale + dy;
          if (px < 0 || py < 0 || px >= w || py >= w) continue;
          const idx = (py * w + px) * 4;
          rgba[idx] = r; rgba[idx+1] = g; rgba[idx+2] = b; rgba[idx+3] = 255;
        }
      }
    }
  }
}

/* ─── Generate one icon ──────────────────────────────────── */
function genIcon(size) {
  const rgba = new Uint8Array(size * size * 4);
  const pad = Math.max(2, Math.round(size * 0.04));
  const r   = Math.round(size * 0.22);
  const iw  = size - pad * 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (inRoundedRect(x, y, pad, pad, iw, iw, r)) {
        const t = x / size;
        rgba[idx]   = Math.round(0x25 + (0x4f - 0x25) * t); // R
        rgba[idx+1] = Math.round(0x63 + (0x46 - 0x63) * t); // G
        rgba[idx+2] = Math.round(0xeb + (0xe5 - 0xeb) * t); // B
        rgba[idx+3] = 255;
      } else {
        rgba[idx]   = 240; rgba[idx+1] = 247; rgba[idx+2] = 255; rgba[idx+3] = 0;
      }
    }
  }

  // Draw "SR" text
  const charW = 5, charH = 7, gap = 1;
  const scale = Math.max(1, Math.floor(size / 20));
  const totalW = (charW * 2 + gap) * scale;
  const totalH = charH * scale;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - totalH) / 2);

  drawChar(rgba, size, 'S', startX, startY, scale, 255, 255, 255);
  drawChar(rgba, size, 'R', startX + (charW + gap) * scale, startY, scale, 255, 255, 255);

  return makePNG(size, size, rgba);
}

/* ─── Run ────────────────────────────────────────────────── */
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
for (const sz of SIZES) {
  const buf = genIcon(sz);
  const out = join(__dirname, `icon-${sz}.png`);
  writeFileSync(out, buf);
  console.log(`✓ icon-${sz}.png  (${buf.length} bytes)`);
}
console.log('\n✅ All PWA icons generated!');
