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

  const links = [
    { href: "/automatizacion-rrss/panel", label: "Próximos Posts", icon: "📅", exact: true },
    { href: "/automatizacion-rrss/panel/metricas", label: "Estadísticas", icon: "📊", exact: false },
    { href: "/automatizacion-rrss/panel/crear", label: "Nuevo Post", icon: "✍️", exact: false },
    { href: "/automatizacion-rrss/panel/estrategia", label: "Estrategia", icon: "🚀", exact: false },
    { href: "/automatizacion-rrss/panel/ads", label: "Meta Ads", icon: "🎯", exact: true },
    { href: "/automatizacion-rrss/panel/configuracion", label: "Configuración de Marca", icon: "🏪", exact: false },
  ];



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
        {/* Sidebar Desktop */}
      <aside className="w-56 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 shadow-xl shadow-slate-900/30 print:hidden">
        <div className="px-5 py-5 border-b border-slate-800 bg-slate-950/30">
          <Link href="/automatizacion-rrss/panel">
            <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2.5 hover:text-indigo-400 transition-all">
              <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30 text-base">🤖</span>
              <span>RRSS Bot</span>
            </h2>
          </Link>
          <p className="text-slate-600 text-[9px] mt-1.5 font-black uppercase tracking-[0.2em]">Automación IA</p>
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
          
          {(["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"].includes(user?.email) || userDoc?.role === "admin") && (
            <details className="pt-3 border-t border-slate-800 group" open={pathname.includes('/admin')}>
               <summary className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-xs text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                 <div className="flex items-center gap-2.5">
                   <span className="text-base opacity-60">👑</span>
                   Administración
                 </div>
                 <span className="group-open:rotate-180 transition-transform text-[10px]">▼</span>
               </summary>
               <div className="mt-1.5 space-y-1 pl-3 border-l border-slate-800 ml-3">
                 <Link href="/automatizacion-rrss/panel/admin" className={`block px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${pathname === '/automatizacion-rrss/panel/admin' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Usuarios</Link>
                 <Link href="/automatizacion-rrss/panel/admin/pagos" className={`block px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${pathname.includes('/admin/pagos') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Pagos</Link>
                 <Link href="/automatizacion-rrss/panel/admin/whatsapp" className={`block px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${pathname.includes('/whatsapp') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>WhatsApp</Link>
                 <Link href="/automatizacion-rrss/panel/admin/estrategias" className={`block px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${pathname.includes('/admin/estrategias') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Estrategias</Link>
                 <Link href="/automatizacion-rrss/panel/admin/workflows" className={`block px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${pathname.includes('/admin/workflows') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Workflows N8N</Link>
                 <Link href="/automatizacion-rrss/panel/admin/monitoreo" className={`block px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${pathname.includes('/admin/monitoreo') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Monitoreo Posts</Link>
               </div>
            </details>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800">
          <Link href="/" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700/30">
            <span>←</span> Salir
          </Link>
        </div>
      </aside>

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

        {/* Mobile Header & Tabs */}
        <div className="md:hidden relative z-[90] print:hidden">
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between shadow-lg">
             <Link href="/automatizacion-rrss/panel" className="shrink-0 mr-4">
               <h2 className="text-xl font-black tracking-tight flex items-center gap-2">🤖 <span className="text-indigo-400">RRSS</span> Bot</h2>
             </Link>
             <div className="flex items-center">
                <NetworkSwitcher />
                <ProfileMenu user={user} userDoc={userDoc} />
             </div>
          </div>
          <div className="relative bg-slate-950 border-b border-white/5">
            {/* Scroll Fade Left */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex overflow-x-auto px-4 py-4 gap-2 hide-scrollbar">
              {links.map(link => {
                const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>
                    {link.icon} {link.label}
                  </Link>
                )
              })}
              
              {(["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"].includes(user?.email) || userDoc?.role === "admin") && (
                  <>
                    <div className="w-px h-6 bg-white/10 mx-2 self-center shrink-0"></div>
                    <details className="relative shrink-0 group/admin">
                      <summary className="list-none cursor-pointer whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-slate-400 border border-white/5 flex items-center gap-2 group-open/admin:bg-indigo-600 group-open/admin:text-white transition-all">
                        👑 Admin <span className="text-[10px] group-open/admin:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="absolute left-0 bottom-full mb-2 bg-slate-900 border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 min-w-[160px] animate-in slide-in-from-bottom-2 fade-in">
                        <Link href="/automatizacion-rrss/panel/admin" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Usuarios</Link>
                        <Link href="/automatizacion-rrss/panel/admin/whatsapp" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Chats</Link>
                        <Link href="/automatizacion-rrss/panel/admin/estrategias" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Estrategias</Link>
                        <Link href="/automatizacion-rrss/panel/admin/workflows" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Workflows</Link>
                        <Link href="/automatizacion-rrss/panel/admin/monitoreo" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Monitoreo</Link>
                      </div>
                    </details>
                  </>
              )}
            </div>

            {/* Scroll Fade Right */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-12 pt-6 md:pt-24 max-w-[1400px] mx-auto print:p-0 print:m-0 print:max-w-none">
          {children}
        </div>
        <div className="print:hidden">
           <InternalTour />
        </div>
      </main>
    </div>
    </ProfileProvider>
  );
}
