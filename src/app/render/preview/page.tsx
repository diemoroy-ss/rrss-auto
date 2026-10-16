import { adminDb } from "../../../lib/firebase-admin";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

// Server Component - No "use client"
// Butterfly Social necesita el HTML renderizado desde el servidor.

async function getPreviewData(id: string) {
  try {
    if (adminDb) {
      const snap = await adminDb.collection("preview_renders").doc(id).get();
      if (snap.exists) {
        return snap.data();
      }
    }
    const docRef = doc(db, "preview_renders", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching preview data:", error);
    return null;
  }
}

export default async function RenderPreviewPage(props: {
  searchParams: Promise<{ id?: string }> | { id?: string };
}) {
  const resolvedParams = await Promise.resolve(props.searchParams);
  const id = resolvedParams?.id;

  if (!id) {
    return <div style={{ color: "red", padding: 20 }}>Falta el ID de previsualización.</div>;
  }

  const data = await getPreviewData(id);

  if (!data) {
    return <div style={{ color: "red", padding: 20 }}>No se encontró el diseño con ID: {id}</div>;
  }

  const isVertical = data.aspectRatio === "9:16";
  const isPortrait45 = data.aspectRatio === "4:5";
  const W = 1080;
  const H = isVertical ? 1920 : isPortrait45 ? 1350 : 1080;

  const FONTS_URL = "https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&family=Montserrat:wght@400;700;900&family=Outfit:wght@400;700&family=Pacifico&family=Playfair+Display:ital,wght@0,700;1,700&family=Roboto:wght@400;700&display=swap";

  const customFonts: Array<{ name: string; url: string; isCssUrl?: boolean }> = Array.isArray(data.customFonts) ? data.customFonts : [];
  const cssUrlFonts = customFonts.filter(f => f.isCssUrl || f.url?.includes("fonts.googleapis.com"));
  const directFileFonts = customFonts.filter(f => !f.isCssUrl && !f.url?.includes("fonts.googleapis.com"));

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONTS_URL} />
      {cssUrlFonts.map((f, i) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={i} rel="stylesheet" href={f.url} />
      ))}
      {directFileFonts.length > 0 && (
        <style
          dangerouslySetInnerHTML={{
            __html: directFileFonts
              .map(
                (f) => `
                @font-face {
                  font-family: '${f.name}';
                  src: url('${f.url}') format('${f.url.endsWith(".woff2") ? "woff2" : "truetype"}');
                  font-weight: normal;
                  font-style: normal;
                  font-display: block;
                }
              `
              )
              .join("\n"),
          }}
        />
      )}
      
      <div
        id="link-preview"
        style={{
          position: "relative",
          overflow: "hidden",
          width: `${W}px`,
          height: `${H}px`,
          backgroundColor: "#000",
        }}
      >
        {/* Imagen de Fondo */}
        {data.baseImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={data.baseImageUrl} 
            style={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              zIndex: 0 
            }} 
            alt="fondo" 
          />
        )}

        {/* Scrim / Degradados de Contraste para legibilidad de textos sobre la comida */}
        {data.useScrim !== false && (
          data.layoutPosition === "split_left" ? (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "65%",
                  height: "100%",
                  background: "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0) 100%)",
                  zIndex: 5,
                  pointerEvents: "none"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "25%",
                  background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
                  zIndex: 5,
                  pointerEvents: "none"
                }}
              />
            </>
          ) : (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: isVertical ? "40%" : "45%",
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0) 100%)",
                  zIndex: 5,
                  pointerEvents: "none"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: isVertical ? "35%" : "35%",
                  background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)",
                  zIndex: 5,
                  pointerEvents: "none"
                }}
              />
            </>
          )
        )}

        {/* Tira de Ingredientes para recetas */}
        {data.ingredients && data.ingredients.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? "160px" : "110px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 25,
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "12px 24px",
              borderRadius: "20px",
              backgroundColor: "rgba(0,0,0,0.70)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)"
            }}
          >
            {data.ingredients.slice(0, 5).map((ing: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "80px",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "28px", lineHeight: "1" }}>{ing.icon || "🥗"}</span>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#ffffff", marginTop: "4px" }}>
                  {ing.name}
                </span>
                {ing.amount && (
                  <span style={{ fontSize: "15px", color: "#fcd34d", fontWeight: "600" }}>
                    {ing.amount}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Capas de Texto */}
        {data.textLayers && data.textLayers.map((layer: any, idx: number) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10 + idx,
              color: layer.color,
              fontFamily: layer.fontFamily || layer.font || "'Montserrat', sans-serif",
              fontSize: `${layer.size}px`,
              fontWeight: layer.isBold === false ? "normal" : "bold",
              fontStyle: layer.isItalic ? "italic" : "normal",
              textShadow: layer.shadowLevel === "none" ? "none" : layer.shadowLevel === "soft" ? "1px 1px 3px rgba(0,0,0,0.5)" : "2px 2px 8px rgba(0,0,0,0.8)",
              backgroundColor: layer.backgroundColor && layer.backgroundColor !== "transparent" ? layer.backgroundColor : "transparent",
              borderRadius: layer.isPill ? "9999px" : "4px",
              padding: layer.backgroundColor && layer.backgroundColor !== "transparent" ? (layer.isPill ? "8px 24px" : "4px 12px") : "0",
              textTransform: layer.textTransform || "none",
              letterSpacing: layer.letterSpacing === "widest" ? "0.1em" : layer.letterSpacing === "wide" ? "0.05em" : "normal",
              WebkitTextStroke: layer.textStroke ? `1px ${layer.color === "#ffffff" ? "#000000" : "#ffffff"}` : "none",
              opacity: layer.opacity ?? 1,
              maxWidth: layer.maxWidth ? `${layer.maxWidth}px` : undefined,
              whiteSpace: layer.maxWidth ? "normal" : layer.whiteSpace || "nowrap",
              textAlign: layer.textAlign || "center"
            }}
          >
            {layer.text}
          </div>
        ))}

        {/* Logo Corporativo */}
        {data.useLogo && data.logoUrl && (
          <div
            style={{
              position: "absolute",
              left: `${data.logoX}%`,
              top: `${data.logoY}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 50,
              // Escala proporcional: logoWidth viene en px basados en un ancho de preview de aprox 450px.
              // Para el lienzo de 1080px en Butterfly, escalamos el logo correspondientemente (multiplicado por 2.4).
              width: data.logoWidth ? `${Math.round(data.logoWidth * 2.4)}px` : "160px",
              height: data.logoWidth ? `${Math.round(data.logoWidth * 2.4)}px` : "160px",
              backgroundColor: data.logoBg === "transparent" ? "transparent" : (data.logoBg || "white"),
              borderRadius: data.logoBg === "transparent" ? "0" : "16px",
              padding: data.logoBg === "transparent" ? "0" : "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: data.logoBg === "transparent" ? "none" : "0 8px 32px rgba(0,0,0,0.3)"
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={data.logoUrl} 
              style={{ 
                maxWidth: "100%", 
                maxHeight: "100%", 
                objectFit: "contain",
                filter: data.logoBg === "transparent" ? "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" : "none"
              }} 
              alt="logo" 
            />
          </div>
        )}

        {/* Marca de Agua Santisoft.cl */}
        {data.watermarkSantisoft !== false && (
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              right: "28px",
              zIndex: 70,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(10px)",
              padding: "8px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.20)",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.45)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#818cf8",
                display: "inline-block",
              }}
            />
            <span
              style={{
                color: "#ffffff",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              Creado por Santisoft.cl
            </span>
          </div>
        )}
      </div>
    </>
  );
}
