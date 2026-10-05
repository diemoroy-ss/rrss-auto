import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "Santisoft Muestras | Vendedores",
  description: "Mini app para vendedores: generación de muestras comerciales y demos exclusivas con nuestros agentes.",
  manifest: "/manifest-vendedores.json?v=2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Muestras",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    apple: "/apple-touch-icon-vendedores.png",
    icon: [
      { url: "/icon-vendedores-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-vendedores-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function VendedoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white antialiased">
      {children}
    </div>
  );
}
