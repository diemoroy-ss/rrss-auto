"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

type UserData = {
  id: string;
  email: string;
  name: string;
  plan: string;
  role?: string;
  isDisabled: boolean;
  postsThisMonth: number;
  registeredApps: string[];
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
         router.push("/automatizacion-rrss/panel");
         return;
      }

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch("/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
           router.push("/automatizacion-rrss/panel");
           return;
        }

        const data = await res.json();
        setUsers(data.users);
      } catch (e: any) {
         console.error(e);
         setError(e.message || "Error al cargar la lista de usuarios.");
      } finally {
         setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro de que quieres ${currentStatus ? 'activar' : 'desactivar'} esta cuenta?`)) return;

    try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/admin/users/status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ userId, isDisabled: !currentStatus })
        });

        if (!res.ok) throw new Error("Error al cambiar estado");

        // Update local state
        setUsers(users.map(u => u.id === userId ? { ...u, isDisabled: !currentStatus } : u));

    } catch (e) {
        console.error(e);
        alert("Hubo un problema al actualizar el usuario.");
    }
  };

  const updateUserField = async (userId: string, field: string, value: string) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/admin/users/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ userId, field, value })
        });
        if (!res.ok) throw new Error("Error al modificar usuario");
        
        setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
    } catch (e) {
        alert("Hubo un problema al actualizar.");
    }
  };

  if (loading) return <div className="text-center font-bold text-slate-400 mt-20">Cargando usuarios...</div>;

  return (
    <div className="max-w-7xl mx-auto lg:mx-0">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Gestión de <span className="text-indigo-600">Usuarios.</span></h1>
        <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed italic">Panel de Control Maestro — Solo para Administradores de Santisoft.</p>
      </div>

      {error ? (
        <div className="p-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-sm border border-rose-100 animate-in fade-in slide-in-from-top-2">⚠️ {error}</div>
      ) : (
        <div className="premium-card !p-0 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                  <th className="p-6 px-8">Identidad</th>
                  <th className="p-6">Ecosistema</th>
                  <th className="p-6">Suscripción</th>
                  <th className="p-6">Rol</th>
                  <th className="p-6">Consumo</th>
                  <th className="p-6 text-center">Estado</th>
                  <th className="p-6 text-right px-8">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50/30 transition-colors">
                     <td className="p-6 px-8">
                        <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{u.name}</div>
                        <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{u.email}</div>
                     </td>
                     <td className="p-6">
                        <div className="flex flex-wrap gap-2">
                           {u.registeredApps.map(app => {
                             const isAutomation = app === 'rrss' || app === 'automatizacion';
                             return (
                               <span key={app} className={`text-[9px] font-black uppercase px-3 py-1 rounded-bl-lg rounded-tr-lg border ${
                                 isAutomation 
                                 ? 'bg-indigo-50 text-indigo-700 border-indigo-100/50' 
                                 : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                               }`}>
                                 {isAutomation ? '🤖 Automatización' : '🍔 Gastro'}
                               </span>
                             );
                           })}
                           {u.registeredApps.length === 0 && <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Sin Actividad</span>}
                        </div>
                     </td>
                     <td className="p-6">
                        <select 
                           value={u.plan || 'free'} 
                           onChange={(e) => updateUserField(u.id, 'plan', e.target.value)}
                           className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-indigo-500/20"
                        >
                           <option value="free">Free</option>
                           <option value="pro">Pro</option>
                           <option value="elite">Elite</option>
                           <option value="business">Business</option>
                        </select>
                     </td>
                     <td className="p-6">
                        <select 
                           value={u.role || 'user'} 
                           onChange={(e) => updateUserField(u.id, 'role', e.target.value)}
                           className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-indigo-500/20"
                        >
                           <option value="user">USER</option>
                           <option value="admin">ADMIN</option>
                        </select>
                     </td>
                     <td className="p-6">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900">{u.postsThisMonth}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Entregas</span>
                        </div>
                     </td>
                     <td className="p-6 text-center">
                        {u.isDisabled ? (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Suspendido
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Operativo
                            </span>
                        )}
                     </td>
                     <td className="p-6 text-right px-8">
                         <button 
                            onClick={() => toggleUserStatus(u.id, u.isDisabled)}
                            className={`text-[10px] font-black uppercase tracking-[0.15em] px-5 py-2.5 rounded-xl transition-all border ${
                                u.isDisabled 
                                ? 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm' 
                                : 'bg-white text-rose-500 border-rose-100 hover:bg-rose-50 hover:border-rose-200 shadow-sm'
                            }`}
                         >
                             {u.isDisabled ? "Habilitar Acceso" : "Revocar Acceso"}
                         </button>
                     </td>
                  </tr>
                ))}
                {users.length === 0 && (
                   <tr>
                       <td colSpan={6} className="p-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">No existen registros de usuarios activos.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
