"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import StatusModal from "../../../../../components/StatusModal";

type PlanConfig = {
    id: string;
    name: string;
    price: number;
    postsLimit: number;
    videosLimit: number;
    multiAccount: boolean;
    maxAccounts: number;
    features: string[];
};

export default function AdminPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
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
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.push("/automatizacion-rrss/panel");
                return;
            }
            // Simple admin check
            const userSnap = await getDoc(doc(db, "users", u.uid));
            if (userSnap.exists() && userSnap.data().role !== 'admin' && u.email !== 'diemoroy@gmail.com') {
                router.push("/automatizacion-rrss/panel");
                return;
            }
            loadPlans();
        });
        return () => unsub();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const snap = await getDoc(doc(db, "system_config", "plans"));
            if (snap.exists()) {
                setPlans(snap.data() as Record<string, PlanConfig>);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePlanValue = (planId: string, field: keyof PlanConfig, value: any) => {
        setPlans(prev => ({
            ...prev,
            [planId]: {
                ...prev[planId],
                [field]: value
            }
        }));
    };

    const handleUpdateFeature = (planId: string, index: number, value: string) => {
        setPlans(prev => {
            const newFeatures = [...prev[planId].features];
            newFeatures[index] = value;
            return {
                ...prev,
                [planId]: {
                    ...prev[planId],
                    features: newFeatures
                }
            };
        });
    };

    const handleAddFeature = (planId: string) => {
        setPlans(prev => ({
            ...prev,
            [planId]: {
                ...prev[planId],
                features: [...prev[planId].features, "Nuevo beneficio"]
            }
        }));
    };

    const handleRemoveFeature = (planId: string, index: number) => {
        setPlans(prev => ({
            ...prev,
            [planId]: {
                ...prev[planId],
                features: prev[planId].features.filter((_, i) => i !== index)
            }
        }));
    };

    const savePlans = async () => {
        setSaving(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/plans/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ plans })
            });

            if (!res.ok) throw new Error("Error al guardar cambios");
            showModal("success", "Guardado", "La configuración de los planes se ha actualizado correctamente.");
        } catch (e) {
            console.error(e);
            showModal("error", "Error", "No se pudo guardar la configuración.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center mt-20 font-black animate-pulse">Cargando Parámetros...</div>;

    return (
        <div className="max-w-7xl mx-auto lg:mx-0 pb-20">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Parametrización de <span className="text-indigo-600">Planes.</span></h1>
                    <p className="text-slate-500 mt-4 text-lg font-medium">Controla precios, límites y textos de beneficios en tiempo real.</p>
                </div>
                <button 
                  onClick={savePlans}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-4 px-10 rounded-[24px] shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-3 hover:-translate-y-1"
                >
                    {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {Object.values(plans).map((plan) => (
                    <div key={plan.id} className="bg-white rounded-[40px] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="bg-slate-900 p-8 text-white">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black">{plan.name}</h3>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">{plan.id}</span>
                            </div>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-xs font-bold text-slate-400">$</span>
                                <input 
                                  type="number" 
                                  value={plan.price} 
                                  onChange={(e) => handleUpdatePlanValue(plan.id, 'price', parseInt(e.target.value))}
                                  className="bg-transparent text-3xl font-black outline-none focus:text-indigo-400 w-32"
                                />
                                <span className="text-xs text-slate-400">/ mes</span>
                            </div>
                        </div>

                        <div className="p-8 space-y-8 flex-1">
                            {/* Límites */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Límite Posts/Mes</label>
                                    <input 
                                      type="number" 
                                      value={plan.postsLimit} 
                                      onChange={(e) => handleUpdatePlanValue(plan.id, 'postsLimit', parseInt(e.target.value))}
                                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Límite Videos/Mes</label>
                                    <input 
                                      type="number" 
                                      value={plan.videosLimit} 
                                      onChange={(e) => handleUpdatePlanValue(plan.id, 'videosLimit', parseInt(e.target.value))}
                                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Multi-cuenta */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-black text-slate-700">Modo Multi-cuenta</span>
                                    <button 
                                      onClick={() => handleUpdatePlanValue(plan.id, 'multiAccount', !plan.multiAccount)}
                                      className={`w-12 h-6 rounded-full transition-all relative ${plan.multiAccount ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${plan.multiAccount ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                {plan.multiAccount && (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Máximo de Cuentas</label>
                                        <input 
                                          type="number" 
                                          value={plan.maxAccounts} 
                                          onChange={(e) => handleUpdatePlanValue(plan.id, 'maxAccounts', parseInt(e.target.value))}
                                          className="w-full bg-white border-2 border-indigo-100 rounded-2xl p-4 font-black focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Beneficios (Textos) */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Características / Beneficios</h4>
                                    <button 
                                      onClick={() => handleAddFeature(plan.id)}
                                      className="text-indigo-600 font-black text-[10px] uppercase hover:bg-indigo-50 px-3 py-1 rounded-full transition-all"
                                    >
                                        + Agregar Fila
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <input 
                                              type="text" 
                                              value={feature} 
                                              onChange={(e) => handleUpdateFeature(plan.id, idx, e.target.value)}
                                              className="flex-1 bg-white border-2 border-slate-100 rounded-xl p-3 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                                            />
                                            <button 
                                              onClick={() => handleRemoveFeature(plan.id, idx)}
                                              className="text-rose-400 hover:text-rose-600 transition-colors px-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <StatusModal 
                {...modal} 
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
