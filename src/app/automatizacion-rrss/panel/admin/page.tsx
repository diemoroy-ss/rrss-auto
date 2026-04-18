"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import StatusModal from "../../../../components/StatusModal";

type UserData = {
  id: string;
  email: string;
  name: string;
  plan: string;
  role?: string;
  planEndDate?: string | null;
  isDisabled: boolean;
  postsThisMonth: number;
  registeredApps: string[];
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showModal = (type: any, title: string, message: string, onConfirm?: () => void) => {
    setModal({
        isOpen: true,
        type,
        title,
        message,
        onConfirm: onConfirm || (() => setModal(prev => ({ ...prev, isOpen: false })))
    });
  };

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
           const errData = await res.json().catch(() => ({}));
           setError(`Error ${res.status}: ${errData.error || 'No tienes permisos suficientes o la sesión expiró.'}`);
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
    showModal("confirm", "Cambiar Estado", `¿Estás seguro de que quieres ${currentStatus ? 'activar' : 'desactivar'} esta cuenta?`, async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
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

            const updatedUsers = users.map(u => u.id === userId ? { ...u, isDisabled: !currentStatus } : u);
            setUsers(updatedUsers);
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, isDisabled: !currentStatus });
            }
            showModal("success", "Actualizado", `La cuenta ha sido ${!currentStatus ? 'suspendida' : 'activada'} correctamente.`);

        } catch (e: any) {
            console.error(e);
            showModal("error", "Error", "Hubo un problema al actualizar el estado del usuario.");
        }
    });
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
        
        const updatedUsers = users.map(u => u.id === userId ? { ...u, [field]: value } : u);
        setUsers(updatedUsers);
        if (selectedUser?.id === userId) {
            setSelectedUser({ ...selectedUser, [field]: value });
        }
        // No alert here for silent updates unless we want it. 
        // Let's add a small confirmation for role/plan changes.
        if (field === 'role' || field === 'plan') {
            showModal("success", "Guardado", `Se ha actualizado el ${field} del usuario.`);
        }
    } catch (e) {
        showModal("error", "Error", "Hubo un problema al guardar los cambios.");
    }
  };

  if (loading) return <div className="text-center font-bold text-slate-400 mt-20">Cargando Panel de Control...</div>;

  return (
    <div className="max-w-7xl mx-auto lg:mx-0">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Admin <span className="text-indigo-600">Usuarios.</span></h1>
           <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed italic">Gestión inteligente de acceso y métricas de consumo.</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-[24px] border-2 border-slate-100 shadow-sm flex items-center gap-4">
            <span className="text-2xl">👥</span>
            <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Usuarios</div>
                <div className="text-xl font-black text-slate-900">{users.length}</div>
            </div>
        </div>
      </div>

      {error ? (
        <div className="p-10 bg-rose-50 border-2 border-rose-100 rounded-[32px] text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p className="text-rose-600 font-black text-lg">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-6 bg-rose-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-rose-500 transition-all">Reintentar</button>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500">
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
                         <div className="flex items-center justify-end gap-2">
                             <button 
                                onClick={() => setSelectedUser(u)}
                                className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
                             >
                                Detalle
                             </button>
                             <button 
                                onClick={() => toggleUserStatus(u.id, u.isDisabled)}
                                className={`text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2.5 rounded-xl transition-all border ${
                                    u.isDisabled 
                                    ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-500 shadow-md' 
                                    : 'bg-white text-rose-500 border-rose-100 hover:bg-rose-50 hover:border-rose-200'
                                }`}
                             >
                                 {u.isDisabled ? "Habilitar" : "Revocar"}
                             </button>
                         </div>
                     </td>
                  </tr>
                ))}
                {users.length === 0 && (
                   <tr>
                       <td colSpan={7} className="p-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">No existen registros de usuarios activos.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETALLE DE USUARIO MODAL */}
      {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
              <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setSelectedUser(null)}
              ></div>
              
              <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-300">
                  {/* Header */}
                  <div className="bg-slate-900 p-8 text-white relative">
                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="absolute top-6 right-8 text-slate-400 hover:text-white transition-colors"
                      >
                        <span className="text-2xl font-light">✕</span>
                      </button>
                      
                      <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-indigo-500 rounded-[28px] flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-500/20">
                              {selectedUser.name[0].toUpperCase()}
                          </div>
                          <div>
                              <h3 className="text-2xl font-black tracking-tight">{selectedUser.name}</h3>
                              <p className="text-slate-400 font-bold text-sm tracking-wide">{selectedUser.email}</p>
                              <div className="flex gap-2 mt-3">
                                  <span className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                                      UID: {selectedUser.id}
                                  </span>
                                  {selectedUser.role === 'admin' && (
                                      <span className="bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                          Administrador
                                      </span>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Body */}
                  <div className="p-10 space-y-10">
                      {/* Stats Section */}
                      <div className="grid grid-cols-2 gap-6">
                          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Posts del Mes</div>
                              <div className="flex items-end gap-2">
                                  <span className="text-4xl font-black text-slate-900">{selectedUser.postsThisMonth}</span>
                                  <span className="text-xs text-slate-400 font-bold mb-1.5">Generados</span>
                              </div>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus Cuenta</div>
                              <div className="flex items-center gap-2 mt-2">
                                  <span className={`w-3 h-3 rounded-full ${selectedUser.isDisabled ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                  <span className="text-lg font-black text-slate-900">{selectedUser.isDisabled ? 'Suspendido' : 'Activo'}</span>
                              </div>
                          </div>
                      </div>

                      {/* Apps Section */}
                      <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span>💼</span> Ecosistema Santisoft
                          </h4>
                          <div className="space-y-3">
                              {['rrss', 'gastronomico'].map(appKey => {
                                  const hasApp = selectedUser.registeredApps.includes(appKey) || (appKey === 'rrss' && selectedUser.registeredApps.includes('automatizacion'));
                                  return (
                                      <div key={appKey} className={`flex items-center justify-between p-4 rounded-2xl border ${hasApp ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100 opacity-60'}`}>
                                          <div className="flex items-center gap-4">
                                              <span className="text-xl">{appKey === 'rrss' ? '🤖' : '🍔'}</span>
                                              <div>
                                                  <div className="text-sm font-black text-slate-900 capitalize">{appKey === 'rrss' ? 'Automatización RRSS' : 'Gestión Gastronómica'}</div>
                                                  <div className="text-[10px] font-bold text-slate-500 italic">{hasApp ? 'Licencia Activa' : 'Sin Licencia'}</div>
                                              </div>
                                          </div>
                                          {hasApp && <span className="text-indigo-600 text-sm font-black">✓</span>}
                                      </div>
                                  )
                              })}
                          </div>
                      </div>

                      {/* Settings Section */}
                      <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Modificar Suscripción</label>
                              <select 
                                value={selectedUser.plan || 'free'} 
                                onChange={(e) => updateUserField(selectedUser.id, 'plan', e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                              >
                                <option value="free">FREE Tier</option>
                                <option value="pro">PRO Professional</option>
                                <option value="elite">ELITE Analytics+</option>
                                <option value="business">BUSINESS Enterprise</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Rango Jerárquico</label>
                              <select 
                                value={selectedUser.role || 'user'} 
                                onChange={(e) => updateUserField(selectedUser.id, 'role', e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                              >
                                <option value="user">Usuario Regular (USER)</option>
                                <option value="admin">Administrador (ADMIN)</option>
                              </select>
                          </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Vencimiento Suscripción</label>
                          <div className="flex gap-4 items-center">
                              <input 
                                type="date" 
                                value={selectedUser.planEndDate || ""} 
                                onChange={(e) => updateUserField(selectedUser.id, 'planEndDate', e.target.value)}
                                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                              />
                              {selectedUser.planEndDate && (
                                  <button 
                                    onClick={() => updateUserField(selectedUser.id, 'planEndDate', "")}
                                    className="bg-rose-50 text-rose-600 font-black text-[10px] uppercase px-4 py-4 rounded-2xl hover:bg-rose-100"
                                  >
                                    Remover
                                  </button>
                              )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">El usuario podrá ver esta fecha en su sección "Mi Perfil". Dejar en blanco para acceso vitalicio.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
      <StatusModal 
        {...modal} 
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
