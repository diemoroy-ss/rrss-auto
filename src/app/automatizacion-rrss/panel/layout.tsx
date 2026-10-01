"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import InternalTour from "../../../components/InternalTour";
import { doc, getDoc } from "firebase/firestore";
import ProfileMenu from "../../../components/gastronomico/ProfileMenu";
import NetworkSwitcher from "../../../components/NetworkSwitcher";
import { ProfileProvider, useProfile } from "../../../contexts/ProfileContext";
import LogoMark from "../../../components/LogoMark";

export default function RrssPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        router.replace("/login");
        return;
      }
      if (u) {
        try {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists()) {
            const data = d.data();
            setUserDoc(data);
            if (data?.role === "vendedor") {
              router.replace("/vendedores");
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching user", error);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Cargando Panel...</div>;
  }

  if (userDoc?.isDisabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">Cuenta Suspendida</h1>
        <p className="text-slate-500 max-w-md font-medium mb-8">
          Tu acceso ha sido revocado por un administrador. Si crees que esto es un error, por favor contacta a soporte.
        </p>
        <ProfileMenu user={user} userDoc={userDoc} />
      </div>
    );
  }

  const userEmail = (user?.email || "").toLowerCase();
  const isAdminUser = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"].includes(userEmail) || userDoc?.role === "admin";

  return (
    <ProfileProvider>
      <PanelLayoutContent user={user} userDoc={userDoc} isAdminUser={isAdminUser}>
        {children}
      </PanelLayoutContent>
    </ProfileProvider>
  );
}

function PanelLayoutContent({
  children,
  user,
  userDoc,
  isAdminUser,
}: {
  children: React.ReactNode;
  user: any;
  userDoc: any;
  isAdminUser: boolean;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { activeProfile } = useProfile();

  // Close mobile nav when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const isMenuDigitalEnabled = activeProfile?.menuDigitalEnabled === true;

  const adminLinks = [
    { href: "/automatizacion-rrss/panel/admin", label: "Usuarios", icon: "👥", exact: true },
    { href: "/automatizacion-rrss/panel/admin/muestras", label: "Muestras Prospectos", icon: "🎨", exact: false },
    { href: "/automatizacion-rrss/panel/admin/vendedores", label: "Equipo Vendedores", icon: "💼", exact: false },
    { href: "/automatizacion-rrss/panel/admin/agenda", label: "Agenda & Demos", icon: "📅", exact: false },
    { href: "/automatizacion-rrss/panel/admin/pagos", label: "Pagos", icon: "💰", exact: false },
    { href: "/automatizacion-rrss/panel/admin/planes", label: "Planes", icon: "💳", exact: false },
    { href: "/automatizacion-rrss/panel/admin/whatsapp", label: "WhatsApp", icon: "💬", exact: false },
    { href: "/automatizacion-rrss/panel/admin/estrategias", label: "Estrategias", icon: "🚀", exact: false },
    { href: "/automatizacion-rrss/panel/admin/workflows", label: "Workflows N8N", icon: "⚙️", exact: false },
    { href: "/automatizacion-rrss/panel/admin/agentes", label: "Agentes", icon: "🤖", exact: false },
    { href: "/automatizacion-rrss/panel/admin/modelos-ia", label: "Modelos IA", icon: "🧠", exact: false },
    { href: "/automatizacion-rrss/panel/admin/monitoreo", label: "Monitoreo Posts", icon: "📡", exact: false },
    { href: "/automatizacion-rrss/panel/admin/logs", label: "Logs de Sistema", icon: "📝", exact: false },
    { href: "/automatizacion-rrss/panel/admin/analitica", label: "Analítica", icon: "📈", exact: false },
    { href: "/automatizacion-rrss/panel/admin/docs", label: "Documentación", icon: "📚", exact: false },
  ];

  const navSections = [
    {
      title: "PUBLICACIONES",
      items: [
        { href: "/automatizacion-rrss/panel", label: "Próximos Posts", icon: "📅", exact: true },
        { href: "/automatizacion-rrss/panel/publicados", label: "Posts Publicados", icon: "✅", exact: true },
        { href: "/automatizacion-rrss/panel/metricas", label: "Estadísticas", icon: "📊", exact: false },
      ]
    },
    {
      title: "CREACIÓN",
      items: [
        { href: "/automatizacion-rrss/panel/crear", label: "Nuevo Post", icon: "✍️", exact: false },
        { href: "/automatizacion-rrss/panel/poc-video", label: "Generar Video", icon: "🎬", exact: false },
        ...(isAdminUser ? [{ href: "/automatizacion-rrss/panel/ads", label: "Meta Ads", icon: "🎯", exact: true }] : []),
      ]
    },
    {
      title: "ESTRATEGIA",
      items: [
        { href: "/automatizacion-rrss/panel/radar", label: "Radar de Nicho", icon: "📡", exact: false },
        { href: "/automatizacion-rrss/panel/estrategia", label: "Estrategia", icon: "🚀", exact: false },
        { href: "/automatizacion-rrss/panel/blog", label: "SEO / GEO", icon: "🌐", exact: false },
        { href: "/automatizacion-rrss/panel/prompts", label: "Comandos de Agentes", icon: "✨", exact: false },
      ]
    },
    {
      title: "RECURSOS Y MARCA",
      items: [
        { href: "/automatizacion-rrss/panel/catalogo", label: "Productos / Servicios", icon: "🛍️", exact: false },
        ...(isMenuDigitalEnabled ? [{ href: "/automatizacion-rrss/panel/menu-qr", label: "Carta Menú & QR", icon: "📱", exact: false }] : []),
        { href: "/automatizacion-rrss/panel/biblioteca", label: "Biblioteca", icon: "🖼️", exact: false },
        { href: "/automatizacion-rrss/panel/configuracion", label: "Configuración de Marca", icon: "🏪", exact: false },
      ]
    }
  ];

  const allLinks = navSections.flatMap(s => s.items);

  const isAdminRoute = pathname.includes("/automatizacion-rrss/panel/admin");
  const activeLinks = isAdminRoute ? adminLinks : allLinks;
  const currentLink = activeLinks.find(l => l.exact ? pathname === l.href : pathname.startsWith(l.href));

  return (
    <div className="min-h-screen panel-grid-bg flex flex-col md:flex-row print:bg-white">

        {/* ========== SIDEBAR DESKTOP ========== */}
        {isAdminRoute ? (
          <aside className="w-60 bg-slate-950 text-white hidden md:flex flex-col border-r border-indigo-900/40 shadow-2xl print:hidden">
            <div className="px-5 py-5 border-b border-indigo-900/40 bg-indigo-950/40">
              <Link href="/automatizacion-rrss/panel/admin">
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2.5">
                  <LogoMark size={32} />
                  <div className="flex flex-col">
                    <span className="text-indigo-300 font-extrabold text-sm leading-none">Santisoft AI</span>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider mt-1 flex items-center gap-1">
                      👑 Panel Admin
                    </span>
                  </div>
                </h2>
              </Link>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-2">Gestión Global</p>
              {adminLinks.map(link => {
                const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all font-bold text-xs ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className={`text-base transition-transform ${isActive ? 'scale-110' : 'opacity-70'}`}>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-indigo-900/40 space-y-2 bg-slate-950">
              <Link href="/automatizacion-rrss/panel" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 hover:text-white text-[11px] font-bold rounded-xl transition-all border border-indigo-800/40 shadow-sm">
                <span>←</span> Volver a App Cliente
              </Link>
            </div>
          </aside>
        ) : (
          <aside className="w-56 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 shadow-xl shadow-slate-900/30 print:hidden">
            <div className="px-5 py-5 border-b border-slate-800 bg-slate-950/30">
              <Link href="/automatizacion-rrss/panel">
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2.5 hover:text-indigo-400 transition-all">
                  <LogoMark size={32} />
                  <span>Santisoft AI</span>
                </h2>
              </Link>
              <p className="text-slate-600 text-[9px] mt-1.5 font-black uppercase tracking-[0.2em]">Automatización IA</p>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
              {navSections.map(section => (
                <div key={section.title} className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 mb-1.5">{section.title}</p>
                  {section.items.map(link => {
                    const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                    return (
                      <Link key={link.href} href={link.href} prefetch={false}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-bold text-xs ${isActive ? 'active-nav-item' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <span className={`text-base transition-transform ${isActive ? 'scale-110' : 'opacity-60'}`}>{link.icon}</span>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
              {isAdminUser && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <Link
                    href="/automatizacion-rrss/panel/laboratorio"
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-xs border ${
                      pathname === "/automatizacion-rrss/panel/laboratorio"
                        ? "bg-purple-900/60 text-white border-purple-500 shadow-md shadow-purple-950/40"
                        : "bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 hover:text-white border-purple-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧪</span>
                      <div className="flex flex-col text-left">
                        <span className="leading-tight font-black">Laboratorio Demo</span>
                        <span className="text-[9px] text-purple-400 font-medium">Empresas de Prueba</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-black border border-purple-500/30">
                      ADMIN
                    </span>
                  </Link>

                  <Link href="/automatizacion-rrss/panel/admin"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-xs bg-indigo-950/50 text-indigo-400 hover:bg-indigo-900/50 hover:text-white border border-indigo-800/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">👑</span>
                      Ir a Consola Admin
                    </div>
                    <span className="text-xs">→</span>
                  </Link>
                </div>
              )}
            </nav>
            <div className="px-4 py-4 border-t border-slate-800 space-y-3">
              <Link href="/terminos" target="_blank"
                className="flex items-center gap-2 px-3 text-slate-500 hover:text-slate-300 text-[9px] font-bold uppercase tracking-widest transition-all"
              >
                ⚖️ Términos y Privacidad
              </Link>
              <Link href="/" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700/30">
                <span>←</span> Salir
              </Link>
            </div>
          </aside>
        )}

        {/* ========== MAIN CONTENT ========== */}
        <main className="flex-1 overflow-y-auto w-full relative print:overflow-visible print:w-full print:border-none">

          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-end p-8 absolute top-0 right-0 z-50 w-full pointer-events-none print:hidden">
            <div className="pointer-events-auto flex items-center">
              <NetworkSwitcher />
              <div className="scale-110 ml-2 border-l pl-6 border-slate-200 flex items-center h-12">
                <ProfileMenu user={user} userDoc={userDoc} />
              </div>
            </div>
          </div>

          {/* ===== MOBILE HEADER — HAMBURGER ===== */}
          <div className="md:hidden relative z-[90] print:hidden">
            {/* Top bar */}
            <div className={`text-white border-b flex items-center justify-between px-4 py-3 shadow-lg ${isAdminRoute ? 'bg-slate-950 border-indigo-900/40' : 'bg-slate-900 border-slate-800'}`}>
              {/* Logo + current page — flex-1 with overflow hidden so it never pushes right side */}
              <Link
                href={isAdminRoute ? "/automatizacion-rrss/panel/admin" : "/automatizacion-rrss/panel"}
                className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden mr-2"
              >
                <LogoMark size={28} />
                <div className="flex flex-col leading-none overflow-hidden">
                  <span className={`text-xs font-black ${isAdminRoute ? 'text-indigo-300' : 'text-indigo-400'}`}>Santisoft</span>
                  {currentLink && (
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{currentLink.icon} {currentLink.label}</span>
                  )}
                </div>
              </Link>

              {/* Right side: network switcher + profile + hamburger */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <NetworkSwitcher />
                <ProfileMenu user={user} userDoc={userDoc} />
                <button
                  onClick={() => setMobileNavOpen(o => !o)}
                  aria-label="Menú de navegación"
                  aria-expanded={mobileNavOpen}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${
                    mobileNavOpen
                      ? 'bg-indigo-600 border-indigo-500'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  {mobileNavOpen ? (
                    <span className="text-white font-bold text-xl leading-none select-none">✕</span>
                  ) : (
                    <div className="flex flex-col gap-[5px] items-center">
                      <span className="block w-[16px] h-[2px] bg-white rounded-full" />
                      <span className="block w-[16px] h-[2px] bg-white rounded-full" />
                      <span className="block w-[16px] h-[2px] bg-white rounded-full" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Dropdown navigation drawer */}
            {mobileNavOpen && (
              <div className={`shadow-2xl border-b ${isAdminRoute ? 'bg-slate-950 border-indigo-900/30' : 'bg-slate-900 border-slate-800'}`}>
                <div className="px-3 py-3 flex flex-col gap-3">
                  {isAdminRoute ? (
                    adminLinks.map(link => {
                      const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="text-lg">{link.icon}</span>
                          <span className="flex-1">{link.label}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />}
                        </Link>
                      );
                    })
                  ) : (
                    navSections.map(section => (
                      <div key={section.title} className="flex flex-col gap-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3">{section.title}</p>
                        {section.items.map(link => {
                          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`flex items-center gap-3 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="text-lg">{link.icon}</span>
                              <span className="flex-1">{link.label}</span>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />}
                            </Link>
                          );
                        })}
                      </div>
                    ))
                  )}

                  {!isAdminRoute && isAdminUser && (
                    <div className="flex flex-col gap-2 mt-1">
                      <Link
                        href="/automatizacion-rrss/panel/laboratorio"
                        className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm bg-purple-950/80 text-purple-300 border border-purple-800/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧪</span>
                          <span>Laboratorio Demo (Empresas de Prueba)</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                          ADMIN
                        </span>
                      </Link>
                      <Link
                        href="/automatizacion-rrss/panel/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-indigo-950/80 text-indigo-300 border border-indigo-800/40"
                      >
                        <span className="text-lg">👑</span>
                        <span>Consola Admin</span>
                      </Link>
                    </div>
                  )}

                  {isAdminRoute && (
                    <Link
                      href="/automatizacion-rrss/panel"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 border-t border-slate-800 mt-1 pt-3"
                    >
                      <span>←</span>
                      <span>Volver a App Cliente</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-800 mt-1 pt-2 pb-1">
                    <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-wider">
                      <span>←</span> Salir de la App
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overlay to close when clicking outside the drawer */}
          {mobileNavOpen && (
            <div
              className="md:hidden fixed inset-0 z-[89] bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          {/* Page content */}
          <div className={`p-4 sm:p-6 md:p-12 pt-6 md:pt-24 mx-auto print:p-0 print:m-0 print:max-w-none ${isAdminRoute ? 'w-full max-w-none' : 'max-w-[1400px]'}`}>
            {children}
          </div>
        </main>

      </div>
  );
}
