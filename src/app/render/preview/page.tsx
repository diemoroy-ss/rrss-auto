import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Server Component - No "use client"
// Butterfly IA necesita el HTML renderizado desde el servidor.

async function getPreviewData(id: string) {
  try {
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
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await props.searchParams;

  if (!id) {
    return <div style={{ color: "red", padding: 20 }}>Falta el ID de previsualización.</div>;
  }

  const data = await getPreviewData(id);

  if (!data) {
    return <div style={{ color: "red", padding: 20 }}>No se encontró el diseño con ID: {id}</div>;
  }

  const W = 1080;
  const H = 1080; // Podríamos hacerlo dinámico si soportamos historias

  const FONTS_URL = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Roboto:wght@400;700&family=Playfair+Display:wght@400;700&family=Bebas+Neue&family=Outfit:wght@400;700&display=swap";

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONTS_URL} />
      
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
              fontFamily: layer.font,
              fontSize: `${layer.size}px`,
              fontWeight: "bold",
              textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
              textAlign: "center"
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
              width: "120px",
              height: "120px",
              backgroundColor: "white",
              borderRadius: "15px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
          >
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={data.logoUrl} 
              style={{ 
                maxWidth: "100%", 
                maxHeight: "100%", 
                objectFit: "contain" 
              }} 
              alt="logo" 
            />
          </div>
        )}
      </div>
    </>
  );
}
