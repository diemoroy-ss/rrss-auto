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
      <aside className="w-72 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 shadow-2xl shadow-slate-900/40 print:hidden">
        <div className="p-8 border-b border-slate-800 bg-slate-950/30">
          <Link href="/automatizacion-rrss/panel">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 hover:text-indigo-400 transition-all">
              <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">🤖</span> 
              <span>RRSS Bot</span>
            </h2>
          </Link>
          <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">Automación Inteligente</p>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-3">
          {links.map(link => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
                  isActive 
                  ? 'active-nav-item' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'opacity-70'}`}>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
          
          {(user?.email === "diemoroy@gmail.com" || userDoc?.role === "admin") && (
            <details className="pt-4 border-t border-slate-800 group" open={pathname.includes('/admin')}>
               <summary className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                 <div className="flex items-center gap-3">
                   <span className="text-xl opacity-70">👑</span>
                   Administración
                 </div>
                 <span className="group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-800 ml-4">
                 <Link href="/automatizacion-rrss/panel/admin" className={`block px-4 py-2 rounded-xl text-xs font-bold transition-all ${pathname === '/automatizacion-rrss/panel/admin' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Usuarios Admin</Link>
                 <Link href="/automatizacion-rrss/panel/admin/pagos" className={`block px-4 py-2 rounded-xl text-xs font-bold transition-all ${pathname.includes('/admin/pagos') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Historial de Pagos</Link>
                 <Link href="/automatizacion-rrss/panel/admin/whatsapp" className={`block px-4 py-2 rounded-xl text-xs font-bold transition-all ${pathname.includes('/whatsapp') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Chats WhatsApp</Link>
                 <Link href="/automatizacion-rrss/panel/admin/estrategias" className={`block px-4 py-2 rounded-xl text-xs font-bold transition-all ${pathname.includes('/admin/estrategias') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Config Estrategias</Link>
               </div>
            </details>
          )}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/20">
          <Link href="/" className="flex items-center justify-center gap-3 px-4 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-slate-700/50">
            <span>←</span> Volver al Sitio
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
                <div className="scale-75 origin-right">
                  <NetworkSwitcher />
                </div>
                <ProfileMenu user={user} userDoc={userDoc} />
             </div>
          </div>
          <div className="flex overflow-x-auto bg-slate-950 px-4 py-4 gap-2 hide-scrollbar border-b border-white/5">
            {links.map(link => {
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>
                  {link.icon} {link.label}
                </Link>
              )
            })}
            
            {(user?.email === "diemoroy@gmail.com" || userDoc?.role === "admin") && (
                <>
                  <div className="w-px h-6 bg-white/10 mx-2 self-center shrink-0"></div>
                  <Link href="/automatizacion-rrss/panel/admin" className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname === '/automatizacion-rrss/panel/admin' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>👑 Usuarios</Link>
                  <Link href="/automatizacion-rrss/panel/admin/whatsapp" className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname.includes('/whatsapp') ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>💬 Chats</Link>
                  <Link href="/automatizacion-rrss/panel/admin/estrategias" className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname.includes('/admin/estrategias') ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>🧠 Estrategias</Link>
                </>
            )}
          </div>
        </div>

        <div className="p-6 md:p-12 pt-8 md:pt-24 max-w-[1400px] mx-auto print:p-0 print:m-0 print:max-w-none">
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
