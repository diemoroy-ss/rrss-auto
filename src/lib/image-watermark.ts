import sharp from 'sharp';
import { adminStorage } from './firebase-admin';

export interface WatermarkOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  padding?: number;
  logoWidthPercent?: number; // Porcentaje del ancho total de la imagen (ej: 0.18 para 18%)
}

/**
 * Superpone el logo PNG original del cliente sobre una imagen generada por IA
 * y sube la imagen final con marca a Firebase Storage.
 */
export async function overlayLogoOnImage(
  imageUrl: string,
  logoUrl: string,
  userId: string = 'system',
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    position = 'bottom-right',
    padding = 36,
    logoWidthPercent = 0.18
  } = options;

  console.log(`[ImageWatermark] Iniciando superposición de logo para usuario ${userId}...`);

  try {
    // 1. Descargar los buffers de la imagen principal y del logo
    const [imageRes, logoRes] = await Promise.all([
      fetch(imageUrl),
      fetch(logoUrl)
    ]);

    if (!imageRes.ok) {
      throw new Error(`Fallo al descargar la imagen base (${imageRes.status})`);
    }
    if (!logoRes.ok) {
      throw new Error(`Fallo al descargar el logo PNG (${logoRes.status})`);
    }

    const imageArrayBuffer = await imageRes.arrayBuffer();
    const logoArrayBuffer = await logoRes.arrayBuffer();

    const mainImageBuffer = Buffer.from(imageArrayBuffer);
    const logoBuffer = Buffer.from(logoArrayBuffer);

    // 2. Obtener dimensiones de la imagen principal
    const mainSharp = sharp(mainImageBuffer);
    const metadata = await mainSharp.metadata();
    const mainWidth = metadata.width || 1080;
    const mainHeight = metadata.height || 1080;

    // 3. Calcular ancho proporcional del logo (entre 120px y 320px)
    const targetLogoWidth = Math.max(120, Math.min(320, Math.round(mainWidth * logoWidthPercent)));

    // Redimensionar el logo manteniendo transparencia PNG y formato
    const resizedLogoBuffer = await sharp(logoBuffer)
      .resize({
        width: targetLogoWidth,
        withoutEnlargement: false,
        fit: 'inside'
      })
      .png()
      .toBuffer();

    const logoMetadata = await sharp(resizedLogoBuffer).metadata();
    const finalLogoWidth = logoMetadata.width || targetLogoWidth;
    const finalLogoHeight = logoMetadata.height || 60;

    // 4. Calcular coordenadas según la posición elegida
    let left = padding;
    let top = padding;

    if (position === 'bottom-right') {
      left = mainWidth - finalLogoWidth - padding;
      top = mainHeight - finalLogoHeight - padding;
    } else if (position === 'bottom-left') {
      left = padding;
      top = mainHeight - finalLogoHeight - padding;
    } else if (position === 'top-right') {
      left = mainWidth - finalLogoWidth - padding;
      top = padding;
    } else if (position === 'top-left') {
      left = padding;
      top = padding;
    }

    // 5. Crear la composición con Sharp
    const watermarkedBuffer = await mainSharp
      .composite([
        {
          input: resizedLogoBuffer,
          top: Math.max(0, top),
          left: Math.max(0, left)
        }
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    console.log(`[ImageWatermark] ✅ Composición de logo finalizada (${mainWidth}x${mainHeight}). Subiendo a Storage...`);

    // 6. Subir la imagen estampada a Firebase Storage
    if (!adminStorage) {
      console.warn('[ImageWatermark] adminStorage no disponible, devolviendo imagen original como fallback.');
      return imageUrl;
    }

    const bucket = adminStorage.bucket();
    const timestamp = Date.now();
    const destination = `users/${userId}/branded_posts/${timestamp}.jpg`;

    const file = bucket.file(destination);
    await file.save(watermarkedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    console.log(`[ImageWatermark] ✅ Imagen con logo original disponible en: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.error(`[ImageWatermark] ⚠️ Error al estampar logo:`, err.message || err);
    // En caso de fallo, devolver la imagen original sin romper el flujo de publicación
    return imageUrl;
  }
}
