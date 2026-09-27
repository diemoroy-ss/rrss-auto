import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { adminAuth } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com", "admin@santisoft.cl"];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    if (adminAuth) {
      const decoded = await adminAuth.verifyIdToken(token);
      const email = (decoded.email || "").toLowerCase();
      if (!ADMIN_EMAILS.includes(email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { imageUrl, imageBase64, tolerance = 38 } = body;

    let inputBuffer: Buffer;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      inputBuffer = Buffer.from(cleanBase64, "base64");
    } else if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("http")) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("No se pudo descargar la imagen");
      inputBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return NextResponse.json({ error: "Se requiere imageUrl o imageBase64" }, { status: 400 });
    }

    // Procesar con sharp: obtener canales RGBA en raw
    const image = sharp(inputBuffer).ensureAlpha();
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (!width || !height) {
      return NextResponse.json({ error: "Dimensiones inválidas de imagen" }, { status: 400 });
    }

    const { data: rawBuffer } = await image.raw().toBuffer({ resolveWithObject: true });
    const data = new Uint8Array(rawBuffer);

    // Muestrear esquinas para color de fondo
    const sampleCoords = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
      [Math.floor(width / 2), 0],
      [Math.floor(width / 2), height - 1],
      [0, Math.floor(height / 2)],
      [width - 1, Math.floor(height / 2)],
    ];

    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    for (const [x, y] of sampleCoords) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 30) {
        totalR += data[idx];
        totalG += data[idx + 1];
        totalB += data[idx + 2];
        count++;
      }
    }

    const bgR = count > 0 ? Math.round(totalR / count) : 255;
    const bgG = count > 0 ? Math.round(totalG / count) : 255;
    const bgB = count > 0 ? Math.round(totalB / count) : 255;

    const tolDist = (tolerance / 100) * 441.67;
    const featherDist = tolDist + 16;

    function colorDist(r: number, g: number, b: number): number {
      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    // BFS Flood-fill desde el borde exterior
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    for (let x = 0; x < width; x++) {
      queue.push(x, 0);
      visited[x] = 1;
      const btmY = height - 1;
      queue.push(x, btmY);
      visited[btmY * width + x] = 1;
    }
    for (let y = 1; y < height - 1; y++) {
      queue.push(0, y);
      visited[y * width] = 1;
      const rightX = width - 1;
      queue.push(rightX, y);
      visited[y * width + rightX] = 1;
    }

    let head = 0;
    while (head < queue.length) {
      const x = queue[head++];
      const y = queue[head++];
      const idx = (y * width + x) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = colorDist(r, g, b);

      if (dist <= tolDist) {
        data[idx + 3] = 0; // Transparente

        const neighbors = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nPos = ny * width + nx;
            if (!visited[nPos]) {
              visited[nPos] = 1;
              queue.push(nx, ny);
            }
          }
        }
      } else if (dist <= featherDist) {
        const factor = (dist - tolDist) / (featherDist - tolDist);
        data[idx + 3] = Math.round(data[idx + 3] * factor);
      }
    }

    const outputPngBuffer = await sharp(data, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png({ compressionLevel: 8 })
      .toBuffer();

    const outputBase64 = `data:image/png;base64,${outputPngBuffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      transparentPngBase64: outputBase64,
    });
  } catch (err: any) {
    console.error("[API Remove BG Error]:", err);
    return NextResponse.json({ error: err.message || "Error al eliminar fondo" }, { status: 500 });
  }
}
