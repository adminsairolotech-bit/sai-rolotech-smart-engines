// Run: node public/icons/generate-icons.js
// Generates PNG icons from SVG for PWA
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const r = size * 0.2;
  const pad = size * 0.04;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#2563eb");
  grad.addColorStop(1, "#4f46e5");

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(r + pad, pad);
  ctx.lineTo(size - r - pad, pad);
  ctx.quadraticCurveTo(size - pad, pad, size - pad, r + pad);
  ctx.lineTo(size - pad, size - r - pad);
  ctx.quadraticCurveTo(size - pad, size - pad, size - r - pad, size - pad);
  ctx.lineTo(r + pad, size - pad);
  ctx.quadraticCurveTo(pad, size - pad, pad, size - r - pad);
  ctx.lineTo(pad, r + pad);
  ctx.quadraticCurveTo(pad, pad, r + pad, pad);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // SR text
  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.35}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SR", size / 2, size / 2);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(__dirname, `icon-${size}.png`), buffer);
  console.log(`Generated icon-${size}.png`);
}

sizes.forEach(generateIcon);
console.log("All icons generated!");
