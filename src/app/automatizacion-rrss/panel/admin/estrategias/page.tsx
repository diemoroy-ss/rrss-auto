"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

interface StrategyGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function AdminEstrategiasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<StrategyGoal[]>([]);
  
  const [newId, setNewId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("🎯");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            router.replace("/automatizacion-rrss/panel");
            return;
        }

        try {
            // Check role in Firestore
            const uDoc = await getDoc(doc(db, "users", user.uid));
            const userData = uDoc.data();
            const isAdmin = user.email === "diemoroy@gmail.com" || userData?.role === "admin";

            if (!isAdmin) {
                router.replace("/automatizacion-rrss/panel");
                return;
            }

            const docRef = doc(db, "settings", "strategy_config");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().goals) {
                setGoals(docSnap.data().goals);
            } else {
                // Default setup if nothing exists
                setGoals([
                    { id: 'sales', title: 'Crecer en Clientes / Ventas', description: 'Enfocado en conversiones directas.', icon: '💰' },
                    { id: 'visibility', title: 'Mayor Visibilidad', description: 'Alcance masivo y reconocimiento de marca.', icon: '👁️' },
                    { id: 'engagement', title: 'Generar Comunidad', description: 'Mejorar interacciones y engagement.', icon: '🤝' },
                    { id: 'calls', title: 'Más Llamadas', description: 'Atraer clientes interesados en agendar.', icon: '📞' }
                ]);
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        } finally {
            setLoading(false);
        }
    });
    
    return () => unsub();
  }, [router]);

  const handleSave = async (updatedGoals: StrategyGoal[]) => {
      setSaving(true);
      try {
          await setDoc(doc(db, "settings", "strategy_config"), { goals: updatedGoals }, { merge: true });
          setGoals(updatedGoals);
          alert("Configuración guardada exitosamente.");
      } catch (e) {
          console.error("Error saving:", e);
          alert("Hubo un error al guardar.");
      } finally {
          setSaving(false);
      }
  };

  const handleAddGoal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newId || !newTitle || !newDesc) return;
      
      const exists = goals.find(g => g.id === newId);
      if (exists) {
          alert("Ya existe un objetivo con ese ID.");
          return;
      }

      const newGoal = { id: newId, title: newTitle, description: newDesc, icon: newIcon };
      const updated = [...goals, newGoal];
      handleSave(updated);
      
      // Reset form
      setNewId(""); setNewTitle(""); setNewDesc(""); setNewIcon("🎯");
  };

  const handleRemoveGoal = (id: string) => {
      if(!confirm("¿Seguro que quieres eliminar este objetivo?")) return;
      const updated = goals.filter(g => g.id !== id);
      handleSave(updated);
  };

  if (loading) return <div className="text-center font-bold text-slate-400 mt-20">Cargando Panel...</div>;

  return (
    <div className="max-w-7xl mx-auto lg:mx-0">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Configuración de <span className="text-indigo-600">Estrategias IA.</span></h1>
        <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed italic">Administra los objetivos que ven los usuarios premium en el generador de estrategias.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Goals */}
          <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-black text-slate-900 mb-6">Objetivos Activos</h3>
              {goals.map(g => (
                  <div key={g.id} className="bg-white p-6 rounded-[24px] border-2 border-slate-100 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                          <div className="text-4xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                              {g.icon}
                          </div>
                          <div>
                              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                  {g.title} 
                                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md tracking-widest uppercase font-black">ID: {g.id}</span>
                              </h4>
                              <p className="text-sm font-medium text-slate-500 mt-1">{g.description}</p>
                          </div>
                      </div>
                      <button 
                         onClick={() => handleRemoveGoal(g.id)}
                         disabled={saving}
                         className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-4 py-2 rounded-xl text-sm"
                      >
                         Eliminar
                      </button>
                  </div>
              ))}
              {goals.length === 0 && (
                  <div className="p-10 text-center text-slate-400 font-black italic border-2 border-dashed border-slate-200 rounded-[24px]">No hay objetivos configurados.</div>
              )}
          </div>

          {/* Add Goal Form */}
          <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>➕</span> Nuevo Objetivo</h3>
                  <form onSubmit={handleAddGoal} className="space-y-5">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ID Único (sin espacios)</label>
                          <input required type="text" value={newId} onChange={e => setNewId(e.target.value.toLowerCase().replace(/\s+/g, '_'))} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors" placeholder="ej: mas_ventas" />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Icono (Emoji)</label>
                          <input required type="text" value={newIcon} onChange={e => setNewIcon(e.target.value)} className="w-20 bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors text-center text-2xl" placeholder="🎯" />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título Visible</label>
                          <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors" placeholder="Ej: Crecer en Ventas" />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Breve</label>
                          <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="Lo que el usuario leerá sobre este objetivo..." />
                      </div>
                      <button disabled={saving} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center justify-center gap-2">
                          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Añadir a la Lista'}
                      </button>
                  </form>
              </div>
          </div>
      </div>
    </div>
  );
}
