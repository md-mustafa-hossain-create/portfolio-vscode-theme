const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure Node PNG generator
function makePng(width, height, drawFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return ~c;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeBuf, data]);
    const crc = crc32(crcBuf);
    const crcField = Buffer.alloc(4);
    crcField.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcField]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Draw official VS Code Blue & Dark aesthetic icon
function drawVscodeIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = isMaskable ? w * 0.48 : w * 0.46;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep VS Code workbench dark #1E1E1E
  let r = 30;
  let g = 30;
  let b = 30;
  let a = 255;

  // Outer circular glow
  if (dist < radius) {
    // Gradient center
    const grad = 1 - dist / radius;
    r = Math.min(255, Math.floor(30 + grad * 15));
    g = Math.min(255, Math.floor(30 + grad * 25));
    b = Math.min(255, Math.floor(35 + grad * 45));

    // Draw stylized VS Code ribbon / brackets
    // Inner box normalized (-1 to 1)
    const nx = (x - cx) / (radius * 0.65);
    const ny = (y - cy) / (radius * 0.65);

    // Left bracket <
    const leftBracket = Math.abs(ny) - (nx + 0.35);
    // Right bracket >
    const rightBracket = Math.abs(ny) - (-nx + 0.35);

    if (
      (Math.abs(leftBracket) < 0.22 && nx < 0.2 && Math.abs(ny) < 0.75) ||
      (Math.abs(rightBracket) < 0.22 && nx > -0.2 && Math.abs(ny) < 0.75)
    ) {
      // VS Code Blue #0078D4 to Light Blue #4FC1FF
      r = 0;
      g = 120 + Math.floor((ny + 1) * 35);
      b = 212 + Math.floor((ny + 1) * 20);
    }

    // Center forward slash /
    const slash = Math.abs(ny + nx * 1.5);
    if (slash < 0.16 && Math.abs(ny) < 0.8) {
      // Emerald / Cyan accent
      r = 78;
      g = 201;
      b = 176;
    }
  } else if (!isMaskable) {
    a = 0; // Transparent outside circle for standard icons
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');
const icon192 = makePng(192, 192, (x, y, w, h) => drawVscodeIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = makePng(512, 512, (x, y, w, h) => drawVscodeIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable = makePng(512, 512, (x, y, w, h) => drawVscodeIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

const appleIcon = makePng(180, 180, (x, y, w, h) => drawVscodeIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

// Brand SVG Icon
const svgIconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#181818"/>
  <rect x="16" y="16" width="480" height="480" rx="84" fill="#1E1E1E" stroke="#0078D4" stroke-width="4"/>
  <!-- Left Bracket -->
  <path d="M190 140 L70 256 L190 372" fill="none" stroke="#0078D4" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Right Bracket -->
  <path d="M322 140 L442 256 L322 372" fill="none" stroke="#0078D4" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Center Slash -->
  <path d="M290 130 L222 382" fill="none" stroke="#4EC9B0" stroke-width="34" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIconContent.trim());

console.log('PWA icons successfully generated in /public!');
