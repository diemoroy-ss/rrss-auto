const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPngBuffer(width, height, drawFn) {
  // Simple PNG encoder
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Pixel data (RGBA)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x / width, y / height, x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  // CRC32
  const crc = crc32(Buffer.concat([Buffer.from(type), data]));
  chunk.writeUInt32BE(crc, 8 + len);

  return chunk;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    for (let j = 0; j < 8; j++) {
      const bit = (byte ^ crc) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

// Draw official Santisoft Isotype (4 vertical rounded bars in #E5300A)
function drawIsotype(normX, normY, pxX, pxY, w, h) {
  // 4 bars relative positions (0..1)
  // Bar 1: x: 0.08..0.22, y: 0.44..0.88
  // Bar 2: x: 0.30..0.44, y: 0.125..0.88
  // Bar 3: x: 0.52..0.66, y: 0.31..0.88
  // Bar 4: x: 0.74..0.88, y: 0.187..0.88

  const bars = [
    { xMin: 0.08, xMax: 0.22, yMin: 0.44, yMax: 0.88 },
    { xMin: 0.30, xMax: 0.44, yMin: 0.125, yMax: 0.88 },
    { xMin: 0.52, xMax: 0.66, yMin: 0.31, yMax: 0.88 },
    { xMin: 0.74, xMax: 0.88, yMin: 0.187, yMax: 0.88 },
  ];

  const r = 229, g = 48, b = 10; // #E5300A

  for (const bar of bars) {
    if (normX >= bar.xMin && normX <= bar.xMax && normY >= bar.yMin && normY <= bar.yMax) {
      // Rounded corner distance check
      const radius = (bar.xMax - bar.xMin) / 2;
      const topCapY = bar.yMin + radius;
      const botCapY = bar.yMax - radius;

      if (normY < topCapY) {
        const dx = normX - (bar.xMin + radius);
        const dy = normY - topCapY;
        if (dx * dx + dy * dy > radius * radius) continue;
      } else if (normY > botCapY) {
        const dx = normX - (bar.xMin + radius);
        const dy = normY - botCapY;
        if (dx * dx + dy * dy > radius * radius) continue;
      }
      return [r, g, b, 255];
    }
  }

  return [0, 0, 0, 0];
}

const publicDir = path.join(__dirname, '..', 'public');

// Generate 32x32 favicon.png
const favicon32 = createPngBuffer(32, 32, drawIsotype);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon32);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), favicon32);

// Generate 16x16 favicon-16x16.png
const favicon16 = createPngBuffer(16, 16, drawIsotype);
fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), favicon16);

// Generate 180x180 apple-touch-icon.png
const appleIcon = createPngBuffer(180, 180, drawIsotype);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

// Generate 512x512 icon-512.png
const pwaIcon = createPngBuffer(512, 512, drawIsotype);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pwaIcon);

console.log('Successfully generated official orange Santisoft Isotype favicons!');
