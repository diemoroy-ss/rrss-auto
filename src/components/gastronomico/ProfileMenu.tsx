"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

interface ProfileMenuProps {
  user: any;
  userDoc?: any;
}

export default function ProfileMenu({ user, userDoc }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const initial = userDoc?.name ? userDoc.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");
  const isAdmin = userDoc?.role === "admin" || user?.email === "admin@santisoft.cl" || user?.email === "diemoroy@gmail.com";

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/80 backdrop-blur-md pl-3 pr-1.5 py-1.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all group"
      >
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-bold text-slate-800 leading-tight">Hola, {userDoc?.name || user?.email?.split('@')[0]}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isAdmin ? "Administrador" : "Usuario Pro"}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 text-white flex items-center justify-center font-black text-sm shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
          {userDoc?.avatarUrl ? (
             <img src={userDoc.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
             initial
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-800 truncate">{userDoc?.name || "Usuario"}</p>
            <p className="text-xs font-medium text-slate-500 truncate">{user?.email}</p>
          </div>
          <div className="p-2 space-y-1">
            <Link 
              href="/automatizacion-rrss/panel/mi-perfil" 
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors mb-1"
            >
              <span>👤</span> Mis Datos Personales
            </Link>
            <Link 
              href="/automatizacion-rrss/panel/planes" 
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors mb-1"
            >
              <span>💳</span> Mi Plan actual
            </Link>
          </div>
          <div className="p-2 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <span>🚪</span> Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
