import { adminDb, adminStorage } from "./firebase-admin";
import { generateBannerCopyWithAgent, BannerCopyResult } from "./agents/agent-banner-copy";
import { composeBannerOnImage, resolveTextTemplate } from "./banner-compositor";
import { LayoutPosition, IngredientItem } from "./text-templates";

export interface RealProductBannerParams {
  baseImageUrl: string;
  fallbackImageUrl?: string;
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
  skipAgentCopy?: boolean;
  templateId?: string;
}

export interface ComposedCommercialSlideResult {
  finalImageUrl: string;
  editDocId?: string;
  renderId?: string;
  textLayers?: any[];
  templateId?: string;
  templateName?: string;
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
    fallbackImageUrl,
    productName,
    productDescription = "",
    price = "",
    idea = "",
    rubro = "Gastronomía",
    businessName = "Mi Negocio",
    fontStyle,
    layoutPosition,
    secondaryScript,
    ingredients,
    aspectRatio = "1:1",
    logoUrl,
    userId = "system",
    includeLogo = true,
    saveEditableInLibrary = false,
    customBadgeText = "",
    skipAgentCopy = false,
    templateId,
  } = params;

  const isVertical = aspectRatio === "9:16";
  const resolvedTpl = resolveTextTemplate(templateId);
  const effectiveFontStyle = fontStyle || resolvedTpl.headlineFont || "bold_modern";
  const effectiveLayoutPosition = layoutPosition || resolvedTpl.layoutPosition || "top_banner";

  console.log(`[RealProductCompositor] Procesando "${productName}" para ${businessName} | Plantilla: "${resolvedTpl.name}" (${resolvedTpl.id})...`);

  // 1. Textos Publicitarios alimentados por la plantilla seleccionada y los datos del producto
  let bannerCopy: BannerCopyResult;
  if (skipAgentCopy || productName || customBadgeText || price) {
    bannerCopy = {
      badgeText: (customBadgeText && customBadgeText.trim())
        ? customBadgeText.trim().toUpperCase()
        : (resolvedTpl.badgeText || "⭐ ESPECIALIDAD"),
      mainHeadline: productName && productName.trim() ? productName.trim().toUpperCase() : "OFERTA EXCLUSIVA",
      benefitText: (productDescription && productDescription.trim())
        ? productDescription.trim()
        : (resolvedTpl.subheadlinePattern || "Elaboración propia con ingredientes seleccionados"),
      ctaText: businessName && businessName.trim()
        ? `${resolvedTpl.ctaText || "¡ORDENA HOY!"} · ${businessName.trim()}`
        : (resolvedTpl.ctaText || "¡ORDENA HOY!"),
      visualTheme: "food_bold",
      badgeBgColor: resolvedTpl.badgeBgColor || "#fbbf24",
      badgeTextColor: resolvedTpl.badgeTextColor || "#0f172a",
      headlineColor: resolvedTpl.headlineColor || "#ffffff",
      benefitBgColor: "rgba(15, 23, 42, 0.85)",
      benefitTextColor: "#ffffff",
      accentColor: resolvedTpl.ctaBgColor || "#fbbf24",
    };
  } else {
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
        badgeText: resolvedTpl.badgeText || "⭐ DESTACADO",
        mainHeadline: productName.toUpperCase(),
        benefitText: productDescription.slice(0, 45) || resolvedTpl.subheadlinePattern || "Calidad garantizada",
        ctaText: resolvedTpl.ctaText || `📍 ${businessName}`,
        visualTheme: "food_bold",
        badgeBgColor: resolvedTpl.badgeBgColor || "#fbbf24",
        badgeTextColor: resolvedTpl.badgeTextColor || "#0f172a",
        headlineColor: resolvedTpl.headlineColor || "#ffffff",
        benefitBgColor: "rgba(15, 23, 42, 0.85)",
        benefitTextColor: "#ffffff",
        accentColor: resolvedTpl.ctaBgColor || "#fbbf24",
      };
    }
  }

  if (customBadgeText && customBadgeText.trim()) {
    bannerCopy.badgeText = customBadgeText.trim().toUpperCase();
  }

  if (productName && productName.trim()) {
    bannerCopy.mainHeadline = productName.trim().toUpperCase();
  }

  if (productDescription && productDescription.trim()) {
    bannerCopy.benefitText = productDescription.trim();
  }

  // 2. Intento Primario: Renderizado Tipográfico con Butterfly Social
  let savedEditDocId: string | undefined;
  let savedRenderId: string | undefined;
  let builtTextLayers: any[] = [];

  try {
    const selectedFont = mapFontFamily(effectiveFontStyle);
    const isScript = effectiveFontStyle === "script_handwritten";
    const isSplit = effectiveLayoutPosition === "split_left";
    const isRecipe = effectiveLayoutPosition === "recipe_ingredients";

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

    }
  } catch (err: any) {
    console.warn("[RealProductCompositor] Error registrando capas, continuando:", err?.message || err);
  }

  // Composición inmediata con motor Sharp de alta velocidad y plantilla limpia
  console.log(`[RealProductCompositor] Ejecutando compositor Sharp con plantilla "${resolvedTpl.name}"...`);
  const sharpUrl = await composeBannerOnImage({
    baseImageUrl,
    fallbackImageUrl,
    bannerCopy,
    price,
    logoUrl,
    userId,
    aspectRatio,
    includeLogo,
    templateId: resolvedTpl.id,
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
      console.warn("[RealProductCompositor] Error guardando en generated_images:", libErr);
    }
  }

  return {
    finalImageUrl: sharpUrl,
    editDocId: savedEditDocId,
    renderId: savedRenderId,
    textLayers: builtTextLayers,
    templateId: resolvedTpl.id,
    templateName: resolvedTpl.name,
  };
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
