"use client";

import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, updatePassword } from "firebase/auth";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MiPerfil() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [plan, setPlan] = useState("free");
  const [planEndDate, setPlanEndDate] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setEmail(u.email || "");
        fetchHistory(u);
        try {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists()) {
            const data = d.data();
            setName(data.name || data.company || "");
            setWhatsapp(data.whatsapp || "");
            setPlan(data.plan || "free");
            setPlanEndDate(data.planEndDate || null);
            setAvatarUrl(data.avatarUrl || "");
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchHistory = async (u: any) => {
    try {
      const token = await u.getIdToken();
      const res = await fetch("/api/payments/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.payments);
      }
    } catch (e) {
      console.error("Error fetching payment history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg("");
    setSuccess(false);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        whatsapp
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
        setErrorMsg("El archivo debe ser una imagen.");
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("La imagen no debe pesar más de 2MB.");
        return;
    }

    setIsUploadingAvatar(true);
    setErrorMsg("");
    try {
        const storageRef = ref(storage, `users/${user.uid}/avatar/profile_pic.jpg`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        await updateDoc(doc(db, "users", user.uid), { avatarUrl: url });
        setAvatarUrl(url);
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
        console.error("Error uploading avatar:", error);
        setErrorMsg("Error al subir el avatar.");
    } finally {
        setIsUploadingAvatar(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!user) return;
    try {
      setSaving(true);
      await updatePassword(user, newPassword);
      setSuccess(true);
      setNewPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
         setErrorMsg("Por seguridad, debes cerrar sesión y volver a entrar antes de cambiar tu contraseña.");
      } else {
         setErrorMsg(e.message || "Error al cambiar contraseña.");
      }
    } finally {
      setSaving(false);
    }
  };

  const planTitles: { [key: string]: string } = {
    free: "Plan Free",
    pro: "Plan PRO",
    elite: "Plan Elite",
    business: "Plan Business"
  };

  if (loading) return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;

  return (
    <div className="max-w-4xl mx-auto lg:mx-0 pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Mi <span className="text-indigo-600">Perfil.</span></h1>
        <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed">Administra tus datos personales y credenciales de acceso a la plataforma.</p>
      </div>

      {errorMsg && <div className="mb-8 p-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-sm border border-rose-100 animate-in fade-in slide-in-from-top-2">⚠️ {errorMsg}</div>}
      {success && <div className="mb-8 p-5 bg-emerald-50 text-emerald-600 rounded-[24px] font-black text-sm border border-emerald-100 animate-in fade-in slide-in-from-top-2">✅ ¡Datos actualizados exitosamente!</div>}

      <div className="space-y-10">
        
        {/* PERSONAL DATA */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
             <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">👤</span>
             <h3 className="text-xl font-black text-slate-900">Datos Personales</h3>
          </div>

          <div className="mb-8 flex items-center gap-6">
              <div className="w-24 h-24 bg-slate-50 flex-shrink-0 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 relative hover:border-indigo-400 transition-colors shadow-inner">
                  {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-3xl opacity-50">📸</span>
                  )}
                  {isUploadingAvatar && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
              </div>
              <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 mb-3">Sube tu foto de perfil para identificarte en el panel superior. (Máx 2MB)</p>
                  <label className="cursor-pointer bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm inline-block">
                      {avatarUrl ? 'Cambiar Foto' : 'Subir Foto'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                  </label>
              </div>
          </div>

          <form onSubmit={handleSaveName} className="grid md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nombre Completo</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>

              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Número de WhatsApp (Opcional)</label>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Ej: +56912345678" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>
              
              <div className="flex items-end md:col-span-2">
                 <button type="submit" disabled={saving || !name} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-2">
                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Guardar Datos Personales'}
                 </button>
              </div>
          </form>
        </div>

        {/* SECURITY */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
             <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">🔒</span>
             <h3 className="text-xl font-black text-slate-900">Seguridad y Acceso</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Correo Electrónico</label>
                  <input type="text" value={email} readOnly className="w-full bg-slate-100 cursor-not-allowed border-2 border-slate-100 px-5 py-3 rounded-2xl outline-none text-sm font-bold transition-all text-slate-500" />
                  <p className="text-[10px] italic text-slate-400 mt-2">No puedes cambiar tu email directamente.</p>
              </div>
              
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cambiar Contraseña</label>
                  <div className="flex gap-2">
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nueva contraseña" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
                    <button type="button" onClick={handlePasswordReset} disabled={saving || !newPassword} className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md active:scale-95 whitespace-nowrap">
                       Actualizar
                    </button>
                  </div>
              </div>
          </div>
        </div>

        {/* CURRENT SUBSCRIPTION INFO */}
        <div className="bg-gradient-to-tr from-indigo-900 via-slate-900 to-slate-800 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-6">
            <div>
               <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Suscripción Actual</div>
               <h3 className="text-4xl font-black text-white tracking-tight">{planTitles[plan] || 'Desconocido'}</h3>
               
               {planEndDate ? (
                 <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-xl">
                   <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Vence el:</span>
                   <span className="text-white text-sm font-black">{format(new Date(planEndDate + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                 </div>
               ) : (
                 <div className="mt-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                   <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Estado:</span>
                   <span className="text-white text-sm font-black">Acceso Vitalicio / Recurrente</span>
                 </div>
               )}
               
               <p className="text-slate-400 text-sm mt-5 max-w-md font-medium leading-relaxed">Estás disfrutando de los beneficios y límites configurados de tu categoría. Puedes revisar qué incluye o hacer un upgrade desde la página de planes.</p>
            </div>
            
            <Link href="/automatizacion-rrss/panel/planes" className="shrink-0 bg-white hover:bg-indigo-50 text-indigo-600 font-black py-4 px-8 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2">
              Ver Mis Planes
            </Link>
          </div>
        </div>

        {/* PAYMENT HISTORY */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
             <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">📜</span>
             <h3 className="text-xl font-black text-slate-900">Historial de Transacciones</h3>
          </div>

          {loadingHistory ? (
              <div className="py-10 text-center text-slate-400 font-bold animate-pulse">Cargando historial...</div>
          ) : history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black border-b border-slate-50">
                      <th className="pb-4">Fecha</th>
                      <th className="pb-4">Concepto</th>
                      <th className="pb-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((p) => (
                      <tr key={p.id}>
                        <td className="py-4 text-xs font-bold text-slate-500">
                            {format(new Date(p.date), "dd/MM/yyyy", { locale: es })}
                        </td>
                        <td className="py-4">
                            <div className="text-xs font-black text-slate-800">{p.description}</div>
                            <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">{p.status === 'approved' || p.status === 'authorized' ? 'Pagado' : p.status}</div>
                        </td>
                        <td className="py-4 text-right">
                            <div className="text-sm font-black text-slate-900">${p.amount.toLocaleString('es-CL')}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <div className="py-10 bg-slate-50 rounded-2xl text-center">
                  <p className="text-slate-400 font-bold text-sm italic">No tienes pagos registrados todavía.</p>
              </div>
          )}
        </div>

      </div>
    </div>
  );
}
