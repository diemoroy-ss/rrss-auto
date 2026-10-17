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
  saveEditableInLibrary?: boolean;
  customBadgeText?: string;
}

export interface ComposedCommercialSlideResult {
  finalImageUrl: string;
  editDocId?: string;
  renderId?: string;
  textLayers?: any[];
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
 * Motor de Composición para Fotos Reales e Imagen Comercial:
 * Preserva 100% la foto o escena base limpia y estampa
 * tipografía publicitaria (cursivas, badges, precios y ofertas) usando
 * nuestro motor de renderizado con fallback resiliente a Sharp + SVG.
 */
export async function composeRealProductBanner(params: RealProductBannerParams): Promise<string> {
  const result = await composeCommercialSlideWithEditor(params);
  return result.finalImageUrl;
}

export async function composeCommercialSlideWithEditor(
  params: RealProductBannerParams
): Promise<ComposedCommercialSlideResult> {
  const {
    baseImageUrl,
    productName,
    productDescription = "",
    price = "",
    idea = "",
    rubro = "Gastronomía",
    businessName = "Mi Negocio",
    fontStyle = "bold_modern",
    layoutPosition = "top_banner",
    secondaryScript,
    ingredients,
    aspectRatio = "1:1",
    logoUrl,
    userId = "system",
    includeLogo = true,
    saveEditableInLibrary = false,
    customBadgeText = "",
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

  if (customBadgeText && customBadgeText.trim()) {
    bannerCopy.badgeText = customBadgeText.trim();
  }

  // 2. Intento Primario: Renderizado Tipográfico con Butterfly Social
  let savedEditDocId: string | undefined;
  let savedRenderId: string | undefined;
  let builtTextLayers: any[] = [];

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
          id: "layer_badge",
          x: 28,
          y: isVertical ? 28 : 26,
          text: secondaryScript || bannerCopy.badgeText || "Especial",
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
          id: "layer_headline",
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
          id: "layer_benefit",
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
                id: "layer_price",
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
          id: "layer_cta",
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
          id: "layer_badge",
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
          id: "layer_headline",
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
          id: "layer_benefit",
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
                id: "layer_cta",
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

    builtTextLayers = textLayers;

    if (adminDb) {
      // Registrar en Firestore para el endpoint /render/preview
      const renderDoc = await adminDb.collection("preview_renders").add({
        baseImageUrl,
        userId,
        layoutPosition: "commercial_custom",
        ingredients: ingredients && ingredients.length > 0 ? ingredients : null,
        useLogo: Boolean(includeLogo && logoUrl),
        logoUrl: logoUrl || null,
        logoX: isSplit ? 90 : 86,
        logoY: isVertical ? 8 : 12,
        logoWidth: 100,
        logoBg: "transparent",
        logoTransparent: true,
        textLayers,
        watermarkSantisoft: false,
        aspectRatio,
        useScrim: true,
        createdAt: new Date(),
      });

      savedRenderId = renderDoc.id;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
      const previewUrl = `${baseUrl}/render/preview?id=${renderDoc.id}`;
      const butterflyUrl = `https://butterfly.santisoft.cl/link-previews/v1?url=${encodeURIComponent(previewUrl)}`;

      console.log(`[RealProductCompositor] Render registrado (#${renderDoc.id}). Solicitando render a nuestro motor...`);

      // Descargar el render con timeout de 12s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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
          console.log(`[RealProductCompositor] ✅ Imagen guardada en Storage: ${storedUrl}`);

          if (saveEditableInLibrary && adminDb) {
            try {
              const libDoc = await adminDb.collection("generated_images").add({
                url: storedUrl,
                baseImageUrl,
                userId,
                source: "imagen_comercial",
                type: isVertical ? "Historia" : "Post",
                aspectRatio,
                prompt: `Imagen Comercial - ${productName} (${businessName})`,
                copy: textLayers.map((l) => l.text).filter(Boolean).join(" · "),
                commercialDesignId: savedRenderId,
                commercialDesignData: {
                  slides: [
                    {
                      baseImageUrl,
                      finalRenderUrl: storedUrl,
                      textLayers,
                      useLogo: Boolean(includeLogo && logoUrl),
                      logoUrl: logoUrl || null,
                      logoX: isSplit ? 90 : 86,
                      logoY: isVertical ? 8 : 12,
                      logoWidth: 100,
                      logoTransparent: true,
                      aspectRatio,
                    },
                  ],
                  isCarousel: false,
                  slideIndex: 0,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              savedEditDocId = libDoc.id;
            } catch (libErr) {
              console.warn("[RealProductCompositor] Error guardando documento editable en generated_images:", libErr);
            }
          }

          return {
            finalImageUrl: storedUrl,
            editDocId: savedEditDocId,
            renderId: savedRenderId,
            textLayers: builtTextLayers,
          };
        }
      }
    }
  } catch (bfErr: any) {
    console.warn("[RealProductCompositor] Motor de renderizado no disponible o timeout, ejecutando fallback local Sharp:", bfErr.message || bfErr);
  }

  // 3. Fallback Resiliente: Motor Sharp + SVG local en servidor
  console.log(`[RealProductCompositor] Ejecutando compositor Sharp de alta velocidad...`);
  const sharpUrl = await composeBannerOnImage({
    baseImageUrl,
    bannerCopy,
    logoUrl,
    userId,
    aspectRatio,
    includeLogo,
  });

  if (saveEditableInLibrary && adminDb) {
    try {
      const libDoc = await adminDb.collection("generated_images").add({
        url: sharpUrl,
        baseImageUrl,
        userId,
        source: "imagen_comercial",
        type: isVertical ? "Historia" : "Post",
        aspectRatio,
        prompt: `Imagen Comercial - ${productName} (${businessName})`,
        copy: builtTextLayers.map((l) => l.text).filter(Boolean).join(" · "),
        commercialDesignId: savedRenderId || null,
        commercialDesignData: {
          slides: [
            {
              baseImageUrl,
              finalRenderUrl: sharpUrl,
              textLayers: builtTextLayers,
              useLogo: Boolean(includeLogo && logoUrl),
              logoUrl: logoUrl || null,
              logoX: 86,
              logoY: isVertical ? 8 : 12,
              logoWidth: 100,
              logoTransparent: true,
              aspectRatio,
            },
          ],
          isCarousel: false,
          slideIndex: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      savedEditDocId = libDoc.id;
    } catch (libErr) {
      console.warn("[RealProductCompositor] Error guardando fallback en generated_images:", libErr);
    }
  }

  return {
    finalImageUrl: sharpUrl,
    editDocId: savedEditDocId,
    renderId: savedRenderId,
    textLayers: builtTextLayers,
  };
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
