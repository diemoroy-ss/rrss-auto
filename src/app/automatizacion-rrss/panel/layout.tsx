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
import { ProfileProvider } from "../../../contexts/ProfileContext";

export default function RrssPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
            setUserDoc(d.data());
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

  const baseLinks = [
    { href: "/automatizacion-rrss/panel", label: "Próximos Posts", icon: "📅", exact: true },
    { href: "/automatizacion-rrss/panel/metricas", label: "Estadísticas", icon: "📊", exact: false },
    { href: "/automatizacion-rrss/panel/crear", label: "Nuevo Post", icon: "✍️", exact: false },
    { href: "/automatizacion-rrss/panel/biblioteca", label: "Biblioteca", icon: "🖼️", exact: false },
    { href: "/automatizacion-rrss/panel/estrategia", label: "Estrategia", icon: "🚀", exact: false },
    { href: "/automatizacion-rrss/panel/ads", label: "Meta Ads", icon: "🎯", exact: true },
    { href: "/automatizacion-rrss/panel/configuracion", label: "Configuración de Marca", icon: "🏪", exact: false },
  ];

  const adminLinks = [
    { href: "/automatizacion-rrss/panel/admin", label: "Usuarios", icon: "👥", exact: true },
    { href: "/automatizacion-rrss/panel/admin/agenda", label: "Agenda & Demos", icon: "📅", exact: false },
    { href: "/automatizacion-rrss/panel/admin/pagos", label: "Pagos", icon: "💰", exact: false },
    { href: "/automatizacion-rrss/panel/admin/planes", label: "Planes", icon: "💳", exact: false },
    { href: "/automatizacion-rrss/panel/admin/whatsapp", label: "WhatsApp", icon: "💬", exact: false },
    { href: "/automatizacion-rrss/panel/admin/estrategias", label: "Estrategias", icon: "🚀", exact: false },
    { href: "/automatizacion-rrss/panel/admin/workflows", label: "Workflows N8N", icon: "⚙️", exact: false },
    { href: "/automatizacion-rrss/panel/admin/monitoreo", label: "Monitoreo Posts", icon: "📡", exact: false },
    { href: "/automatizacion-rrss/panel/admin/analitica", label: "Analítica", icon: "📈", exact: false },
  ];

  const links = [...baseLinks];
  const userEmail = (user?.email || "").toLowerCase();
  const isAdminUser = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"].includes(userEmail) || userDoc?.role === "admin";
  
  if (isAdminUser || userDoc?.hasSeoAutopilot) {
    links.splice(5, 0, { href: "/automatizacion-rrss/panel/blog", label: "Blog IA", icon: "📝", exact: false });
  }

  const isAdminRoute = pathname.includes("/automatizacion-rrss/panel/admin");

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

  return (
    <ProfileProvider>
      <div className="min-h-screen panel-grid-bg flex flex-col md:flex-row print:bg-white">
        
        {/* ================= SIDEBAR DESKTOP ================= */}
        {isAdminRoute ? (
          /* Sidebar Exclusivo de Administración */
          <aside className="w-60 bg-slate-950 text-white hidden md:flex flex-col border-r border-indigo-900/40 shadow-2xl print:hidden">
            <div className="px-5 py-5 border-b border-indigo-900/40 bg-indigo-950/40">
              <Link href="/automatizacion-rrss/panel/admin">
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2.5">
                  <img src="/favicon.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain shadow-md shadow-indigo-500/20" />
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
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all font-bold text-xs ${
                      isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={`text-base transition-transform ${isActive ? 'scale-110' : 'opacity-70'}`}>{link.icon}</span>
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 py-4 border-t border-indigo-900/40 space-y-2 bg-slate-950">
              <Link href="/automatizacion-rrss/panel" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 hover:text-white text-[11px] font-bold rounded-xl transition-all border border-indigo-800/40 shadow-sm">
                <span>←</span> Volver a App Cliente
              </Link>
            </div>
          </aside>
        ) : (
          /* Sidebar Estándar Cliente */
          <aside className="w-56 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 shadow-xl shadow-slate-900/30 print:hidden">
            <div className="px-5 py-5 border-b border-slate-800 bg-slate-950/30">
              <Link href="/automatizacion-rrss/panel">
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2.5 hover:text-indigo-400 transition-all">
                  <img src="/favicon.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain shadow-md shadow-indigo-600/10" />
                  <span>Santisoft AI</span>
                </h2>
              </Link>
              <p className="text-slate-600 text-[9px] mt-1.5 font-black uppercase tracking-[0.2em]">Automatización IA</p>
            </div>
            
            <nav className="flex-1 py-4 px-3 space-y-1">
              {links.map(link => {
                const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all font-bold text-xs ${
                      isActive 
                      ? 'active-nav-item' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={`text-base transition-transform ${isActive ? 'scale-110' : 'opacity-60'}`}>{link.icon}</span>
                    {link.label}
                  </Link>
                )
              })}
              
              {isAdminUser && (
                <div className="pt-3 border-t border-slate-800">
                  <Link 
                    href="/automatizacion-rrss/panel/admin"
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
              <Link 
                href="/terminos" 
                target="_blank"
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

        {/* ================= MAIN CONTENT AREA ================= */}
        <main className="flex-1 overflow-y-auto w-full relative print:overflow-visible print:w-full print:border-none">
          {/* Top Header Desktop */}
          <div className="hidden md:flex items-center justify-end p-8 absolute top-0 right-0 z-50 w-full pointer-events-none print:hidden">
             <div className="pointer-events-auto flex items-center">
               <NetworkSwitcher />
               <div className="scale-110 ml-2 border-l pl-6 border-slate-200 flex items-center h-12">
                  <ProfileMenu user={user} userDoc={userDoc} />
               </div>
             </div>
          </div>

          {/* Mobile Header & Navigation */}
          {isAdminRoute ? (
            /* Mobile Admin Header & Tabs */
            <div className="md:hidden relative z-[90] print:hidden">
              <div className="bg-slate-950 border-b border-indigo-900/40 text-white p-4 flex items-center justify-between shadow-lg">
                  <Link href="/automatizacion-rrss/panel/admin" className="shrink-0">
                    <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <img src="/favicon.png" alt="Logo" className="w-6 h-6 rounded-md object-contain" />
                      <span className="text-indigo-400">Santisoft</span> <span className="text-amber-400 text-xs">👑 ADMIN</span>
                    </h2>
                  </Link>
                 <div className="flex items-center gap-2">
                    <Link href="/automatizacion-rrss/panel" className="px-2.5 py-1 text-[11px] font-bold bg-indigo-950 border border-indigo-800/50 text-indigo-300 rounded-lg">
                      ← App
                    </Link>
                    <ProfileMenu user={user} userDoc={userDoc} />
                 </div>
              </div>
              <div className="relative bg-slate-950 border-b border-indigo-900/30">
                <div className="flex overflow-x-auto px-3 py-3 gap-2 hide-scrollbar">
                  {adminLinks.map(link => {
                    const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                    return (
                      <Link key={link.href} href={link.href} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>
                        {link.icon} {link.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Mobile Standard Header & Tabs */
            <div className="md:hidden relative z-[90] print:hidden">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shadow-lg">
                  <Link href="/automatizacion-rrss/panel" className="shrink-0 mr-4">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      <img src="/favicon.png" alt="Logo" className="w-6 h-6 rounded-md object-contain" />
                      <span className="text-indigo-400">Santisoft</span> AI
                    </h2>
                  </Link>
                 <div className="flex items-center">
                    <NetworkSwitcher />
                    <ProfileMenu user={user} userDoc={userDoc} />
                 </div>
              </div>
              <div className="relative bg-slate-950 border-b border-white/5">
                <div className="flex overflow-x-auto px-4 py-4 gap-2 hide-scrollbar">
                  {links.map(link => {
                    const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                    return (
                      <Link key={link.href} href={link.href} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>
                        {link.icon} {link.label}
                      </Link>
                    )
                  })}
                  
                  {isAdminUser && (
                    <Link href="/automatizacion-rrss/panel/admin" className="whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/40 shrink-0">
                      👑 Consola Admin
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`p-4 sm:p-6 md:p-12 pt-6 md:pt-24 mx-auto print:p-0 print:m-0 print:max-w-none ${isAdminRoute ? 'w-full max-w-none' : 'max-w-[1400px]'}`}>
            {children}
          </div>
        </main>

      </div>
    </ProfileProvider>
  );
}
