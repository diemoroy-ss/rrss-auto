import { adminDb, adminStorage } from "./firebase-admin";
import { generateBannerCopyWithAgent, BannerCopyResult } from "./agents/agent-banner-copy";
import { composeBannerOnImage } from "./banner-compositor";
import { LayoutPosition, IngredientItem } from "./text-templates";

export interface RealProductBannerParams {
  baseImageUrl: string;
  productName: string;
  productDescription?: string;
  price?: string;
  idea?: string;
  rubro?: string;
  businessName?: string;
  fontStyle?: "script_handwritten" | "bold_modern" | "elegant_serif" | "clean_minimal" | "serif_script_mix" | "bold_textured";
  layoutPosition?: LayoutPosition;
  secondaryScript?: string;
  ingredients?: IngredientItem[];
  aspectRatio?: "1:1" | "9:16";
  logoUrl?: string;
  userId?: string;
  includeLogo?: boolean;
}

/**
 * Mapeo de estilos tipográficos a fuentes de Google Fonts
 */
function mapFontFamily(style?: string): string {
  switch (style) {
    case "script_handwritten":
      return "'Dancing Script', cursive, sans-serif";
    case "bold_modern":
      return "'Bebas Neue', 'Anton', sans-serif";
    case "bold_textured":
      return "'Anton', 'Bebas Neue', sans-serif";
    case "elegant_serif":
    case "serif_script_mix":
      return "'Playfair Display', Georgia, serif";
    case "clean_minimal":
    default:
      return "Montserrat, sans-serif";
  }
}

/**
 * Motor de Composición para Fotos Reales (Sin retoque de comida):
 * Preserva 100% la foto original del plato o producto físico y estampa
 * tipografía publicitaria (cursivas, badges, precios y ofertas) usando
 * Butterfly Social (renderizado headless) con fallback resiliente a Sharp + SVG.
 */
export async function composeRealProductBanner(params: RealProductBannerParams): Promise<string> {
  const {
    baseImageUrl,
    productName,
    productDescription = "",
    price = "",
    idea = "",
    rubro = "Gastronomía",
    businessName = "Mi Negocio",
    fontStyle = "script_handwritten",
    layoutPosition = "top_banner",
    secondaryScript,
    ingredients,
    aspectRatio = "1:1",
    logoUrl,
    userId = "system",
    includeLogo = true,
  } = params;

  const isVertical = aspectRatio === "9:16";

  console.log(`[RealProductCompositor] Procesando foto real de "${productName}" para ${businessName} (Layout: ${layoutPosition}, Font: ${fontStyle})...`);

  // 1. Invocación de nuestro Agente de Textos Publicitarios
  let bannerCopy: BannerCopyResult;
  try {
    bannerCopy = await generateBannerCopyWithAgent({
      idea: idea || `Promoción del producto ${productName}: ${productDescription}`,
      rubro,
      businessName,
      businessDescription: productDescription,
      customOffer: price ? `Precio: ${price}` : "",
      aspectRatio,
    });
  } catch (err: any) {
    console.warn("[RealProductCompositor] Warning generando micro-copy con agente, usando defaults:", err);
    bannerCopy = {
      badgeText: price ? `🔥 ${price}` : "⭐ DESTACADO",
      mainHeadline: productName.toUpperCase(),
      benefitText: productDescription.slice(0, 45) || "Elaboración propia con ingredientes frescos",
      ctaText: `📍 ${businessName}`,
      visualTheme: "food_bold",
      badgeBgColor: "#fbbf24",
      badgeTextColor: "#0f172a",
      headlineColor: "#ffffff",
      benefitBgColor: "rgba(15, 23, 42, 0.85)",
      benefitTextColor: "#ffffff",
      accentColor: "#fbbf24",
    };
  }

  // 2. Intento Primario: Renderizado Tipográfico con Butterfly Social
  try {
    const selectedFont = mapFontFamily(fontStyle);
    const isScript = fontStyle === "script_handwritten";
    const isSplit = layoutPosition === "split_left";
    const isRecipe = layoutPosition === "recipe_ingredients";

    let textLayers: any[];

    if (isSplit) {
      textLayers = [
        // Kicker / Cursiva superior al costado
        {
          x: 28,
          y: isVertical ? 28 : 26,
          text: secondaryScript || bannerCopy.badgeText || "Especial del Chef",
          color: "#fcd34d",
          font: "'Dancing Script', cursive, sans-serif",
          size: isVertical ? 32 : 26,
          isBold: true,
          isItalic: true,
          backgroundColor: "transparent",
          shadowLevel: "hard",
          textAlign: "left",
        },
        // Titular Principal al Costado
        {
          x: 28,
          y: isVertical ? 38 : 36,
          text: isScript ? capitalizeWords(bannerCopy.mainHeadline) : bannerCopy.mainHeadline,
          color: bannerCopy.headlineColor || "#ffffff",
          font: selectedFont,
          size: isScript ? (isVertical ? 68 : 52) : (isVertical ? 60 : 46),
          isBold: true,
          isItalic: fontStyle === "elegant_serif" || fontStyle === "serif_script_mix",
          backgroundColor: "transparent",
          shadowLevel: "hard",
          letterSpacing: "tight",
          textAlign: "left",
        },
        // Beneficio / Detalle
        {
          x: 28,
          y: isVertical ? 48 : 46,
          text: bannerCopy.benefitText,
          color: "#ffffff",
          font: "Montserrat, sans-serif",
          size: isVertical ? 20 : 16,
          isBold: false,
          backgroundColor: "transparent",
          shadowLevel: "soft",
          textAlign: "left",
        },
        // Precio Destacado
        ...(price
          ? [
              {
                x: 28,
                y: isVertical ? 56 : 54,
                text: price,
                color: "#0f172a",
                font: "Montserrat, sans-serif",
                size: isVertical ? 24 : 20,
                isBold: true,
                backgroundColor: "#fbbf24",
                isPill: true,
                shadowLevel: "soft",
                textAlign: "left",
              },
            ]
          : []),
        // Botón CTA al Costado
        {
          x: 28,
          y: isVertical ? 66 : 64,
          text: bannerCopy.ctaText,
          color: "#0f172a",
          font: "Montserrat, sans-serif",
          size: isVertical ? 20 : 16,
          isBold: true,
          backgroundColor: "#fbbf24",
          isPill: true,
          shadowLevel: "hard",
          textAlign: "left",
        },
      ];
    } else {
      textLayers = [
        // 1. Badge Superior
        {
          x: 50,
          y: isVertical ? 12 : 10,
          text: bannerCopy.badgeText,
          color: bannerCopy.badgeTextColor,
          font: "Montserrat, sans-serif",
          size: isVertical ? 24 : 20,
          isBold: true,
          backgroundColor: bannerCopy.badgeBgColor || "#fbbf24",
          isPill: true,
          shadowLevel: "soft",
          letterSpacing: "wide",
        },
        // 2. Titular Principal
        {
          x: 50,
          y: isVertical ? 21 : 19,
          text: isScript
            ? capitalizeWords(bannerCopy.mainHeadline)
            : bannerCopy.mainHeadline,
          color: isScript ? "#ffffff" : bannerCopy.headlineColor,
          font: selectedFont,
          size: isScript ? (isVertical ? 72 : 56) : (isVertical ? 64 : 52),
          isBold: true,
          isItalic: fontStyle === "elegant_serif" || fontStyle === "serif_script_mix",
          backgroundColor: "transparent",
          shadowLevel: "hard",
          letterSpacing: isScript ? "normal" : "wide",
        },
        // 3. Beneficio / Detalle del Plato o Precio
        {
          x: 50,
          y: isVertical ? 29 : 27,
          text: bannerCopy.benefitText,
          color: bannerCopy.benefitTextColor,
          font: "Montserrat, sans-serif",
          size: isVertical ? 22 : 18,
          isBold: true,
          backgroundColor: bannerCopy.benefitBgColor || "rgba(15, 23, 42, 0.85)",
          isPill: true,
          shadowLevel: "soft",
        },
        // 4. Barra Inferior de Ubicación / CTA (si no es receta con tira de ingredientes)
        ...(!isRecipe
          ? [
              {
                x: 50,
                y: isVertical ? 93 : 93,
                text: bannerCopy.ctaText,
                color: "#ffffff",
                font: "Montserrat, sans-serif",
                size: isVertical ? 22 : 18,
                isBold: true,
                backgroundColor: "rgba(15, 23, 42, 0.88)",
                isPill: true,
                shadowLevel: "hard",
              },
            ]
          : []),
      ];
    }

    // Registrar en Firestore para el endpoint /render/preview
    const renderDoc = await adminDb.collection("preview_renders").add({
      baseImageUrl,
      userId,
      layoutPosition,
      ingredients: ingredients && ingredients.length > 0 ? ingredients : null,
      useLogo: Boolean(includeLogo && logoUrl),
      logoUrl: logoUrl || null,
      logoX: isSplit ? 90 : 14,
      logoY: isVertical ? 8 : 10,
      logoWidth: 100,
      logoBg: "transparent",
      textLayers,
      watermarkSantisoft: false,
      aspectRatio,
      useScrim: true,
      createdAt: new Date(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
    const previewUrl = `${baseUrl}/render/preview?id=${renderDoc.id}`;
    const butterflyUrl = `https://butterfly.santisoft.cl/link-previews/v1?url=${encodeURIComponent(previewUrl)}`;

    console.log(`[RealProductCompositor] Render registrado (#${renderDoc.id}). Solicitando render a Butterfly Social...`);

    // Descargar el render de Butterfly con timeout de 9s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const bfRes = await fetch(butterflyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (bfRes.ok) {
      const buffer = Buffer.from(await bfRes.arrayBuffer());
      if (buffer.length > 5000 && adminStorage) {
        const bucket = adminStorage.bucket();
        const dest = `users/${userId}/real_product_banners/${Date.now()}.jpg`;
        const file = bucket.file(dest);

        await file.save(buffer, {
          metadata: {
            contentType: "image/jpeg",
            cacheControl: "public, max-age=31536000",
          },
        });
        await file.makePublic();

        const storedUrl = `https://storage.googleapis.com/${bucket.name}/${dest}`;
        console.log(`[RealProductCompositor] ✅ Imagen Butterfly guardada en Storage: ${storedUrl}`);
        return storedUrl;
      }
    }
  } catch (bfErr: any) {
    console.warn("[RealProductCompositor] Butterfly no disponible o timeout, ejecutando fallback local Sharp:", bfErr.message || bfErr);
  }

  // 3. Fallback Resiliente: Motor Sharp + SVG local en servidor
  console.log(`[RealProductCompositor] Ejecutando compositor Sharp de alta velocidad...`);
  return await composeBannerOnImage({
    baseImageUrl,
    bannerCopy,
    logoUrl,
    userId,
    aspectRatio,
    includeLogo,
  });
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
