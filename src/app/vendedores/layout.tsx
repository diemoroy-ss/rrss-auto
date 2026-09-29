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
  manifest: "/manifest-vendedores.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Muestras",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon.png",
  },
};

export default function VendedoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {children}
    </div>
  );
}
