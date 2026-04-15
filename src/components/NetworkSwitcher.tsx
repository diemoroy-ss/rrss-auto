"use client";

import { useState } from "react";
import { useProfile } from "../contexts/ProfileContext";

export default function NetworkSwitcher() {
  const { activeProfile, profiles, setActiveProfile, addProfile, isBusiness, loading } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🏢");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojis = ['🏢', '💇‍♀️', '🍽️', '🏋️‍♂️', '🐾', '📸', '☕', '👗', '🏠', '🚗'];

  if (loading || !activeProfile) return null;

  const handleAdd = async () => {
     if (!newName.trim()) return;
     setIsSubmitting(true);
     try {
        await addProfile(newName, newIcon);
        setIsCreating(false);
        setNewName("");
     } catch (e) {
        alert("Error al crear la cuenta");
     } finally {
        setIsSubmitting(false);
     }
  };

  // ... (Navbar button remains same)

  return (
    <>
      {/* 🚀 EL BOTÓN DEL NAVBAR 🚀 */}
      <button 
         onClick={() => setIsOpen(true)}
         className="mr-6 flex items-center gap-3 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md px-4 py-2 rounded-xl transition-all group"
      >
         <span className="text-xl group-hover:scale-110 transition-transform">{activeProfile.icon || '🏢'}</span>
         <div className="text-left hidden md:block">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cuenta Activa</div>
            <div className="text-sm font-bold text-slate-800 leading-tight">{activeProfile.name}</div>
         </div>
         <span className="text-slate-300 ml-2 group-hover:text-indigo-400">▼</span>
      </button>

      {/* 🎬 EL MODAL NETFLIX STYLE 🎬 */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
           <div className="absolute top-8 right-8 text-white/50 hover:text-white cursor-pointer text-5xl font-light transition-colors" onClick={() => { setIsOpen(false); setIsCreating(false); }}>×</div>
           
           <div className="text-center w-full max-w-6xl px-4 mt-8">
              {!isCreating ? (
                <>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">¿Quién está gestionando?</h2>
                  <p className="text-indigo-200 text-lg mb-16 font-medium">Selecciona una cuenta para cargar su estrategia, calendario y estadísticas.</p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                    {profiles.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => { setActiveProfile(p.id); setIsOpen(false); }}
                          className="group flex flex-col items-center gap-6 transition-all hover:-translate-y-2"
                        >
                          <div className={`w-32 h-32 md:w-44 md:h-44 rounded-[2rem] flex items-center justify-center text-6xl md:text-7xl shadow-2xl transition-all border-4 relative overflow-hidden ${
                            activeProfile.id === p.id 
                            ? 'bg-indigo-600 border-indigo-400 shadow-indigo-600/50 scale-105' 
                            : 'bg-slate-800 border-slate-700/50 group-hover:border-slate-500 shadow-xl opacity-80 group-hover:opacity-100'
                          }`}>
                            {/* Glow effect for active profile */}
                            {activeProfile.id === p.id && <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay"></div>}
                            <span className="relative z-10">{p.icon || '🏢'}</span>
                          </div>
                          <span className={`text-xl font-bold tracking-tight transition-colors ${activeProfile.id === p.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                            {p.name}
                          </span>
                        </button>
                    ))}

                    {/* Botón de Agregar (limitado a 10 por el Business plan) */}
                    {profiles.length < 10 && (
                        <button 
                          onClick={() => setIsCreating(true)}
                          className="group flex flex-col items-center gap-6 transition-all hover:-translate-y-2 opacity-60 hover:opacity-100"
                        >
                          <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] flex items-center justify-center text-5xl md:text-6xl bg-slate-800/30 border-4 border-dashed border-slate-700 group-hover:border-indigo-500 group-hover:text-indigo-400 text-slate-600 transition-all font-light">
                            +
                          </div>
                          <span className="text-xl font-bold tracking-tight text-slate-500 group-hover:text-slate-300 transition-colors">
                            Añadir Cuenta
                          </span>
                        </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
                    <h2 className="text-4xl font-black text-white tracking-tight mb-8">Nueva Cuenta Business</h2>
                    <div className="bg-slate-800/50 p-8 rounded-[32px] border border-slate-700 shadow-2xl space-y-8">
                        <div className="flex justify-center mb-4">
                           <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-5xl shadow-lg border-2 border-indigo-400">
                              {newIcon}
                           </div>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-3">Nombre de la Marca / Local</label>
                           <input 
                              type="text"
                              value={newName}
                              onChange={e => setNewName(e.target.value)}
                              placeholder="Ej: Peluquería Brillo"
                              className="w-full bg-slate-900 border border-slate-700 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-white font-bold transition-all"
                              autoFocus
                           />
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-3">Elige un ícono</label>
                           <div className="grid grid-cols-5 gap-3">
                              {emojis.map(e => (
                                 <button 
                                    key={e}
                                    onClick={() => setNewIcon(e)}
                                    className={`text-2xl p-3 rounded-xl transition-all ${newIcon === e ? 'bg-indigo-600 scale-110 shadow-lg shadow-indigo-600/30' : 'bg-slate-900 hover:bg-slate-700'}`}
                                 >
                                    {e}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                           <button 
                              onClick={() => setIsCreating(false)}
                              className="flex-1 py-4 font-bold text-slate-400 hover:text-white transition-colors"
                           >
                              Cancelar
                           </button>
                           <button 
                              onClick={handleAdd}
                              disabled={isSubmitting || !newName.trim()}
                              className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                           >
                              {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Crear Cuenta'}
                           </button>
                        </div>
                    </div>
                </div>
              )}
           </div>
        </div>
      )}
    </>
  );
}
