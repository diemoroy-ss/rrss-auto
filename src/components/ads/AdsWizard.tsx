"use client";

import React, { useState } from "react";
import { useProfile } from "../../contexts/ProfileContext";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function AdsWizard({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const { activeProfile } = useProfile();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetchingPosts, setFetchingPosts] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    
    // Form State
    const [campaignName, setCampaignName] = useState("");
    const [objective, setObjective] = useState("OUTCOME_TRAFFIC"); // or OUTCOME_ENGAGEMENT
    
    const [dailyBudget, setDailyBudget] = useState(1); // USD
    const [durationDays, setDurationDays] = useState(7);
    
    const [country, setCountry] = useState("AR"); // Argentina Default
    const [minAge, setMinAge] = useState(18);
    const [maxAge, setMaxAge] = useState(65);

    const [creativeImageUrl, setCreativeImageUrl] = useState("");
    const [creativeMessage, setCreativeMessage] = useState("");
    const [creativeLink, setCreativeLink] = useState("");

    // Fetch posts if step 4 is reached and not loaded yet
    React.useEffect(() => {
        const loadPosts = async () => {
            if (step === 4 && posts.length === 0 && auth.currentUser && activeProfile) {
                setFetchingPosts(true);
                try {
                    const q = query(
                        collection(db, "social_posts"),
                        where("userId", "==", auth.currentUser.uid),
                        where("profileId", "==", activeProfile.id),
                        orderBy("scheduledFor", "desc"),
                        limit(20)
                    );
                    const snapshot = await getDocs(q);
                    setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (e) {
                    console.error("Error fetching posts for ads", e);
                } finally {
                    setFetchingPosts(false);
                }
            }
        };
        loadPosts();
    }, [step, activeProfile]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!auth.currentUser || !activeProfile) return;
        setLoading(true);
        setErrorMsg("");

        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch("/api/meta-ads/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    profileId: activeProfile.id,
                    campaignName,
                    objective,
                    dailyBudget,
                    durationDays,
                    country,
                    age: { min: minAge, max: maxAge },
                    creative: {
                        imageUrl: creativeImageUrl,
                        message: creativeMessage,
                        link: creativeLink
                    }
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al crear campaña");
            
            onSuccess();
            // Reset state
            setStep(1);
            setCampaignName("");
            
        } catch (error: any) {
            console.error("AdsWizard Error:", error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre de Campaña</label>
                            <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ej. Promo Meseta" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Objetivo</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div onClick={() => setObjective("OUTCOME_TRAFFIC")} className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${objective === 'OUTCOME_TRAFFIC' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}>
                                    <div className="text-2xl mb-2">🖱️</div>
                                    <h4 className="font-black text-slate-900 text-sm">Visitas al Sitio Web</h4>
                                    <p className="text-xs text-slate-500 font-medium">Atrae personas propensas a hacer clic en tu enlace.</p>
                                </div>
                                <div onClick={() => setObjective("OUTCOME_ENGAGEMENT")} className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${objective === 'OUTCOME_ENGAGEMENT' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}>
                                    <div className="text-2xl mb-2">❤️</div>
                                    <h4 className="font-black text-slate-900 text-sm">Interacción y Mensajes</h4>
                                    <p className="text-xs text-slate-500 font-medium">Consigue likes, comentarios o mensajes a tu fanpage.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Presupuesto Diario (USD)</label>
                            <div className="flex items-center gap-4">
                                <input type="number" min="1" step="1" value={dailyBudget} onChange={e => setDailyBudget(Number(e.target.value))} className="w-32 bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none font-black text-slate-700 text-xl text-center" />
                                <span className="text-slate-500 font-medium">Dólares por día.</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Duración (Días)</label>
                            <div className="flex items-center gap-4">
                                <input type="number" min="1" step="1" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="w-32 bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none font-black text-slate-700 text-xl text-center" />
                                <span className="text-slate-500 font-medium">Gasto total aprox: ${(dailyBudget * durationDays).toFixed(2)} USD</span>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">País (Código ISO)</label>
                            <input type="text" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} maxLength={2} placeholder="Ej. AR, CL, MX" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 uppercase" />
                            <p className="text-xs text-slate-400 mt-2">Usa el código de dos letras. Ej: AR (Argentina), MX (México), ES (España), CO (Colombia).</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Edad Mínima</label>
                                <input type="number" min="13" max="65" value={minAge} onChange={e => setMinAge(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Edad Máxima</label>
                                <input type="number" min="13" max="65" value={maxAge} onChange={e => setMaxAge(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
                            <label className="block text-xs font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2"><span>🔄</span> Usar un Post Programado / Publicado</label>
                            <select 
                                onChange={(e) => {
                                    const p = posts.find(x => x.id === e.target.value);
                                    if (p) {
                                        setCreativeImageUrl(p.imageUrl || p.imageUrls?.[0] || "");
                                        setCreativeMessage(p.copy || p.text || "");
                                    }
                                }} 
                                disabled={fetchingPosts}
                                className="w-full bg-white border border-indigo-200 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium text-slate-700"
                            >
                                <option value="">Selecciona un post existente (Opcional)</option>
                                {posts.map(p => (
                                    <option key={p.id} value={p.id}>{p.idea || p.copy?.substring(0, 30)}... ({p.status})</option>
                                ))}
                            </select>
                            {fetchingPosts && <p className="text-[10px] text-indigo-400 mt-2 font-bold animate-pulse">Cargando posts de Santisoft...</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">URL de la Imagen (Creativo)</label>
                            <input type="text" value={creativeImageUrl} onChange={e => setCreativeImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium text-slate-700" />
                            <p className="text-xs text-slate-400 mt-2">Puedes seleccionar un post arriba para autocompletar esto.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Texto Principal (Copy)</label>
                            <textarea value={creativeMessage} onChange={e => setCreativeMessage(e.target.value)} rows={3} placeholder="¡Descubre nuestros nuevos productos!" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium text-slate-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Enlace de Destino</label>
                            <input type="text" value={creativeLink} onChange={e => setCreativeLink(e.target.value)} placeholder="https://tu-sitio.com/promocion" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium text-slate-700" />
                        </div>

                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                            <h4 className="text-amber-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-1">💳 Pagos en Meta Ads</h4>
                            <p className="text-amber-700/80 text-[11px] font-medium leading-relaxed">
                                Para que tu campaña se genere y active exitosamente, <strong>debes tener una tarjeta de crédito/débito configurada</strong> previamente en tu cuenta de Meta (Facebook Business Manager). Santisoft no procesa cobros ni almacena información de pagos de publicidad.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg text-sm">⚡</span>
                        Crear Campaña Rápida
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-300 font-bold transition-colors text-sm">✕</button>
                </div>

                <div className="p-8 overflow-y-auto flex-1">
                    {/* Stepper */}
                    <div className="flex items-center gap-2 mb-8">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`h-2 flex-1 rounded-full transition-colors ${s <= step ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                        ))}
                    </div>

                    {errorMsg && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm border border-rose-100">⚠️ {errorMsg}</div>}

                    {renderStep()}
                </div>

                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <button 
                        onClick={() => setStep(prev => prev - 1)} 
                        disabled={step === 1 || loading}
                        className="font-bold text-slate-400 hover:text-slate-700 disabled:opacity-0 transition-colors"
                    >
                        ← Atrás
                    </button>
                    {step < 4 ? (
                        <button 
                            onClick={() => {
                                if (step === 1 && !campaignName) { setErrorMsg("Usa un nombre para la campaña"); return; }
                                setErrorMsg("");
                                setStep(prev => prev + 1);
                            }}
                            className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                        >
                            Siguiente →
                        </button>
                    ) : (
                        <button 
                            onClick={handleCreate}
                            disabled={loading || !campaignName || !creativeImageUrl}
                            className={`bg-emerald-500 text-white font-black px-8 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '🚀 Lanzar Campaña'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
