import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "Santisoft Muestras Comerciales",
    short_name: "Muestras",
    description: "Generador de propuestas y muestras comerciales para prospectos",
    start_url: "/vendedores",
    scope: "/vendedores",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
