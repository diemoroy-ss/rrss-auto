/**
 * Utilidad de alta precisión para eliminar el fondo de logos (PNG/JPG).
 * Detecta el color de fondo en los bordes y esquinas, y aplica un algoritmo
 * de flood-fill contiguo con suavizado de bordes (antialiasing) para conservar
 * intactos los elementos internos del logo (ej: textos blancos o detalles claros interiores).
 */

export interface RemoveBgOptions {
  /** Tolerancia de color (0 a 100). Valor recomendado: 38 */
  tolerance?: number;
  /**
   * 'contiguous' (por defecto): solo elimina el fondo conectado a los bordes exteriores.
   * 'global': elimina todo píxel del color detectado en toda la imagen.
   */
  mode?: "contiguous" | "global";
  /** Rango de suavizado de bordes en píxeles */
  feather?: boolean;
}

export async function removeLogoBackground(
  imageSource: string | File | Blob,
  options: RemoveBgOptions = {}
): Promise<string> {
  const { tolerance = 38, mode = "contiguous", feather = true } = options;

  return new Promise((resolve, reject) => {
    // 1. Obtener URL de la imagen
    let srcUrl = "";
    let isObjectUrl = false;

    if (typeof imageSource === "string") {
      srcUrl = imageSource;
    } else {
      srcUrl = URL.createObjectURL(imageSource);
      isObjectUrl = true;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          throw new Error("No se pudo inicializar el contexto 2D de Canvas");
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 2. Muestrear los 4 bordes y esquinas para determinar el color de fondo predominante
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

        let totalR = 0,
          totalG = 0,
          totalB = 0,
          count = 0;

        for (const [x, y] of sampleCoords) {
          const idx = (y * width + x) * 4;
          const a = data[idx + 3];
          if (a > 30) {
            // Solo píxeles no transparentes
            totalR += data[idx];
            totalG += data[idx + 1];
            totalB += data[idx + 2];
            count++;
          }
        }

        const bgR = count > 0 ? Math.round(totalR / count) : 255;
        const bgG = count > 0 ? Math.round(totalG / count) : 255;
        const bgB = count > 0 ? Math.round(totalB / count) : 255;

        const tolDist = (tolerance / 100) * 441.67; // 441.67 es max dist sqrt(255^2*3)
        const featherDist = tolDist + (feather ? 18 : 0);

        function colorDist(r: number, g: number, b: number): number {
          const dr = r - bgR;
          const dg = g - bgG;
          const db = b - bgB;
          return Math.sqrt(dr * dr + dg * dg + db * db);
        }

        if (mode === "contiguous") {
          // Algoritmo BFS Flood-Fill desde el perímetro exterior
          const visited = new Uint8Array(width * height);
          const queue: number[] = [];

          // Encolar todos los píxeles perimetrales
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
              // Fondo puro -> 100% transparente
              data[idx + 3] = 0;

              // Expandir vecinos
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
            } else if (dist <= featherDist && feather) {
              // Borde difuminado suave (antialiasing)
              const factor = (dist - tolDist) / (featherDist - tolDist);
              data[idx + 3] = Math.round(data[idx + 3] * factor);
            }
          }
        } else {
          // Modo global: elimina en toda la imagen
          for (let i = 0; i < data.length; i += 4) {
            const dist = colorDist(data[i], data[i + 1], data[i + 2]);
            if (dist <= tolDist) {
              data[i + 3] = 0;
            } else if (dist <= featherDist && feather) {
              const factor = (dist - tolDist) / (featherDist - tolDist);
              data[i + 3] = Math.round(data[i + 3] * factor);
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        if (isObjectUrl) {
          URL.revokeObjectURL(srcUrl);
        }

        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        if (isObjectUrl) {
          URL.revokeObjectURL(srcUrl);
        }
        reject(err);
      }
    };

    img.onerror = (e) => {
      if (isObjectUrl) {
        URL.revokeObjectURL(srcUrl);
      }
      reject(new Error("No se pudo cargar la imagen del logo para procesar"));
    };

    img.src = srcUrl;
  });
}
