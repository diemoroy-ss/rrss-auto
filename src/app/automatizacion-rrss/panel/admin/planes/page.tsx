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
    tagline: string;
    price: number;
    annualPrice: number;
    postsLimit: number;
    videosLimit: number;
    aiImagesLimit: number;
    aiVideosLimit: number;
    seoBlogsLimit: number;
    multiAccount: boolean;
    maxAccounts: number;
    isPopular: boolean;
    ctaText: string;
    features: string[];
};

const PLAN_ORDER = ["esencial", "crecimiento", "piloto_automatico", "free", "starter", "growth", "pro", "business", "agency"];

function PlanPreviewCard({ plan }: { plan: PlanConfig }) {
    const isUnlimited = plan.postsLimit >= 999999;
    return (
        <div className={`relative rounded-3xl border-2 overflow-hidden flex flex-col h-full transition-all ${plan.isPopular ? 'bg-slate-900 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.02]' : 'bg-white border-slate-200'}`}>
            {plan.isPopular && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full">Más Popular</span>
                </div>
            )}
            <div className={`pt-10 pb-6 px-6 ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                <h3 className={`text-xl font-black ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-3xl font-black ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                        ${plan.price === 0 ? '0' : plan.price.toLocaleString('es-CL')}
                    </span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${plan.isPopular ? 'text-indigo-300' : 'text-slate-400'}`}>{plan.tagline}</p>
            </div>
            <div className={`px-6 pb-6 flex-1 space-y-2`}>
                {plan.features.map((f, i) => (
                    <div key={i} className={`flex items-start gap-2 text-sm ${plan.isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className={`mt-0.5 text-[10px] ${plan.isPopular ? 'text-indigo-400' : 'text-slate-400'}`}>—</span>
                        {f}
                    </div>
                ))}
            </div>
            <div className="px-6 pb-6">
                <button className={`w-full py-3 rounded-xl font-black text-sm transition-all border-2 ${plan.isPopular ? 'border-indigo-500 text-white hover:bg-indigo-600' : 'border-slate-200 text-slate-700 hover:border-slate-400'}`}>
                    {plan.ctaText}
                </button>
                {plan.multiAccount && (
                    <p className="text-center text-[10px] text-slate-400 mt-2 font-bold">Hasta {plan.maxAccounts} cuentas/marcas</p>
                )}
                <p className={`text-center text-[10px] mt-1 font-bold ${plan.isPopular ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {isUnlimited ? '∞ posts/mes' : `${plan.postsLimit} posts/mes`}
                </p>
            </div>
        </div>
    );
}

export default function AdminPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("crecimiento");

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
            if (!u) { router.push("/automatizacion-rrss/panel"); return; }
            const adminEmails = ['diemoroy@gmail.com', 'spalezcom@gmail.com', 'santisoftai@gmail.com', 'admin@santisoft.cl'];
            const email = (u.email || '').toLowerCase();
            const userSnap = await getDoc(doc(db, "users", u.uid));
            const isAdmin = adminEmails.includes(email) || (userSnap.exists() && userSnap.data().role === 'admin');
            if (!isAdmin) {
                router.push("/automatizacion-rrss/panel"); return;
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
        setPlans(prev => {
            let updatedPlan = { ...prev[planId], [field]: value };
            
            if (field === 'postsLimit') {
                const limitNum = parseInt(value as string) || 0;
                const newText = limitNum >= 999999 ? "Posts ilimitados al mes" : `${limitNum} Posts automáticos al mes`;
                
                updatedPlan.features = updatedPlan.features.map(f => {
                    if (/posts?.*mes/i.test(f)) {
                        return newText;
                    }
                    return f;
                });
            }

            return { ...prev, [planId]: updatedPlan };
        });
    };

    const handleUpdateFeature = (planId: string, index: number, value: string) => {
        setPlans(prev => {
            const newFeatures = [...prev[planId].features];
            newFeatures[index] = value;
            return { ...prev, [planId]: { ...prev[planId], features: newFeatures } };
        });
    };

    const handleAddFeature = (planId: string) => {
        setPlans(prev => ({ ...prev, [planId]: { ...prev[planId], features: [...prev[planId].features, "Nuevo beneficio"] } }));
    };

    const handleRemoveFeature = (planId: string, index: number) => {
        setPlans(prev => ({ ...prev, [planId]: { ...prev[planId], features: prev[planId].features.filter((_, i) => i !== index) } }));
    };

    const handleAddPlan = () => {
        const newId = `plan_${Date.now()}`;
        setPlans(prev => ({
            ...prev,
            [newId]: {
                id: newId,
                name: "Nuevo Plan",
                tagline: "AL MES",
                price: 0,
                annualPrice: 0,
                postsLimit: 10,
                videosLimit: 0,
                aiImagesLimit: 10,
                aiVideosLimit: 0,
                seoBlogsLimit: 0,
                multiAccount: false,
                maxAccounts: 1,
                isPopular: false,
                ctaText: "Contratar",
                features: ["Beneficio 1"]
            }
        }));
        setSelectedPlanId(newId);
    };

    const handleDeletePlan = (planId: string) => {
        showModal("confirm", "Eliminar Plan", `¿Estás seguro de eliminar el plan "${plans[planId]?.name}"? Esta acción es irreversible.`, () => {
            setPlans(prev => {
                const updated = { ...prev };
                delete updated[planId];
                return updated;
            });
            const remaining = Object.keys(plans).filter(k => k !== planId);
            setSelectedPlanId(remaining[0] || "");
            setModal(prev => ({ ...prev, isOpen: false }));
        });
    };

    const savePlans = async () => {
        setSaving(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/plans/update", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ plans })
            });
            if (!res.ok) throw new Error("Error al guardar cambios");
            showModal("success", "¡Guardado!", "La configuración de los planes se ha actualizado correctamente.");
        } catch (e) {
            showModal("error", "Error", "No se pudo guardar la configuración.");
        } finally {
            setSaving(false);
        }
    };

    const seedPlans = async () => {
        setSeeding(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/plans/seed", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al inicializar planes");
            await loadPlans();
            showModal("success", "¡Planes inicializados!", "Los planes por defecto han sido cargados en la base de datos.");
        } catch (e) {
            showModal("error", "Error", "No se pudieron inicializar los planes.");
        } finally {
            setSeeding(false);
        }
    };

    const sortedPlanIds = Object.keys(plans).sort((a, b) => {
        const ai = PLAN_ORDER.indexOf(a);
        const bi = PLAN_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    const activePlan = plans[selectedPlanId];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Cargando planes...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto lg:mx-0 pb-20">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Parametrización de <span className="text-indigo-600">Planes.</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-base font-medium">Controla precios, límites y textos en tiempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={seedPlans}
                        disabled={seeding}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-3 px-6 rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 text-sm flex items-center gap-2"
                    >
                        {seeding ? '⏳ Inicializando...' : '🌱 Inicializar Planes'}
                    </button>
                    <button
                        onClick={handleAddPlan}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-6 rounded-2xl transition-all hover:-translate-y-0.5 text-sm flex items-center gap-2"
                    >
                        + Nuevo Plan
                    </button>
                    <button
                        onClick={savePlans}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3 px-8 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                    </button>
                </div>
            </div>

            {Object.keys(plans).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-black text-slate-700 mb-2">Sin planes configurados</h3>
                    <p className="text-slate-400 mb-6">Haz clic en "Inicializar Planes" para cargar los planes por defecto.</p>
                    <button onClick={seedPlans} disabled={seeding} className="bg-indigo-600 text-white font-black py-3 px-8 rounded-2xl hover:bg-indigo-700 transition-all">
                        {seeding ? '⏳ Inicializando...' : '🌱 Inicializar Planes por Defecto'}
                    </button>
                </div>
            ) : (
                <div className="grid xl:grid-cols-5 gap-6">
                    {/* Plan Selector Sidebar */}
                    <div className="xl:col-span-1 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Planes</p>
                        {sortedPlanIds.map(planId => (
                            <button
                                key={planId}
                                onClick={() => setSelectedPlanId(planId)}
                                className={`w-full text-left px-4 py-3 rounded-2xl font-black text-sm transition-all ${selectedPlanId === planId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border-2 border-slate-100 text-slate-700 hover:border-indigo-200'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{plans[planId]?.name}</span>
                                    {plans[planId]?.isPopular && <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">★ POP</span>}
                                </div>
                                <div className={`text-[10px] mt-0.5 font-medium ${selectedPlanId === planId ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    ${(plans[planId]?.price || 0).toLocaleString('es-CL')}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Editor */}
                    {activePlan && (
                        <div className="xl:col-span-2 bg-white rounded-3xl border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col">
                            {/* Editor Header */}
                            <div className="bg-slate-900 p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre del Plan</p>
                                        <input
                                            type="text"
                                            value={activePlan.name}
                                            onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'name', e.target.value)}
                                            className="bg-transparent text-2xl font-black outline-none border-b-2 border-transparent focus:border-indigo-400 transition-all w-full"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full">{selectedPlanId}</span>
                                </div>
                                <div className="flex flex-col gap-4 mt-2">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Pago Mensual (Recurrente)</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-slate-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                value={activePlan.price}
                                                onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'price', parseInt(e.target.value) || 0)}
                                                className="bg-transparent text-3xl font-black outline-none focus:text-indigo-400 transition-all w-40"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Pago Anual (Único)</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-slate-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                value={activePlan.annualPrice || 0}
                                                onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'annualPrice', parseInt(e.target.value) || 0)}
                                                className="bg-transparent text-2xl font-black outline-none focus:text-emerald-400 transition-all w-40 text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={activePlan.tagline}
                                    onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'tagline', e.target.value)}
                                    className="bg-transparent text-[10px] text-slate-400 font-black uppercase tracking-widest outline-none border-b border-transparent focus:border-slate-600 mt-1 w-full"
                                    placeholder="Ej: AL MES"
                                />
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {/* Limits */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Posts/Mes</label>
                                        <input type="number" value={activePlan.postsLimit}
                                            onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'postsLimit', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-xl p-3 font-black focus:border-indigo-400 outline-none transition-all" />
                                        <p className="text-[9px] text-slate-400 mt-1 font-bold">999999 = ilimitado</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Videos/Mes</label>
                                        <input type="number" value={activePlan.videosLimit}
                                            onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'videosLimit', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-xl p-3 font-black focus:border-indigo-400 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Imágenes IA/Mes</label>
                                        <input type="number" value={activePlan.aiImagesLimit || 0}
                                            onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'aiImagesLimit', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-xl p-3 font-black focus:border-indigo-400 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Videos IA/Mes</label>
                                        <input type="number" value={activePlan.aiVideosLimit || 0}
                                            onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'aiVideosLimit', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-xl p-3 font-black focus:border-indigo-400 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Blogs SEO/Mes</label>
                                        <input type="number" value={activePlan.seoBlogsLimit || 0}
                                            onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'seoBlogsLimit', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-xl p-3 font-black focus:border-indigo-400 outline-none transition-all" />
                                    </div>
                                </div>

                                {/* CTA Text */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Texto Botón CTA</label>
                                    <input type="text" value={activePlan.ctaText}
                                        onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'ctaText', e.target.value)}
                                        className="w-full bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-xl p-3 font-bold text-sm focus:border-indigo-400 outline-none transition-all" />
                                </div>

                                {/* Toggles */}
                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700">¿Más Popular?</span>
                                            <button
                                                onClick={() => handleUpdatePlanValue(selectedPlanId, 'isPopular', !activePlan.isPopular)}
                                                className={`w-10 h-5 rounded-full transition-all relative ${activePlan.isPopular ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${activePlan.isPopular ? 'left-5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700">Multi-cuenta</span>
                                            <button
                                                onClick={() => handleUpdatePlanValue(selectedPlanId, 'multiAccount', !activePlan.multiAccount)}
                                                className={`w-10 h-5 rounded-full transition-all relative ${activePlan.multiAccount ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${activePlan.multiAccount ? 'left-5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                        {activePlan.multiAccount && (
                                            <div className="mt-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Máx. Cuentas</label>
                                                <input type="number" value={activePlan.maxAccounts}
                                                    onChange={(e) => handleUpdatePlanValue(selectedPlanId, 'maxAccounts', parseInt(e.target.value) || 1)}
                                                    className="w-full bg-white text-slate-900 border border-indigo-100 rounded-xl p-2 font-black text-sm focus:border-indigo-400 outline-none" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Características</h4>
                                        <button onClick={() => handleAddFeature(selectedPlanId)}
                                            className="text-indigo-600 font-black text-[10px] uppercase hover:bg-indigo-50 px-3 py-1 rounded-full transition-all">
                                            + Agregar
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {activePlan.features.map((feature, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input type="text" value={feature}
                                                    onChange={(e) => handleUpdateFeature(selectedPlanId, idx, e.target.value)}
                                                    className="flex-1 bg-white text-slate-900 border-2 border-slate-100 rounded-xl p-2.5 text-sm font-medium focus:border-indigo-400 outline-none transition-all" />
                                                <button onClick={() => handleRemoveFeature(selectedPlanId, idx)}
                                                    className="text-rose-400 hover:text-rose-600 transition-colors px-2 text-lg">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delete Plan */}
                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => handleDeletePlan(selectedPlanId)}
                                        className="w-full py-3 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-sm hover:bg-rose-50 transition-all"
                                    >
                                        🗑️ Eliminar este Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Preview */}
                    {activePlan && (
                        <div className="xl:col-span-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vista Previa en Vivo</p>
                            <div className="grid grid-cols-1 gap-4">
                                <PlanPreviewCard plan={activePlan} />
                                {/* Mini preview of all plans */}
                                <div className="bg-white rounded-3xl border-2 border-slate-100 p-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Todos los Planes (comparativa)</p>
                                    <p className="text-xs text-slate-500 mb-4 font-medium">Precios en pesos chilenos (CLP) — IVA incluido</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {sortedPlanIds.map(planId => (
                                            <div
                                                key={planId}
                                                onClick={() => setSelectedPlanId(planId)}
                                                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${planId === selectedPlanId ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}
                                            >
                                                <div className="font-black text-slate-800 text-sm">{plans[planId]?.name}</div>
                                                <div className="text-indigo-600 font-black text-lg">${(plans[planId]?.price || 0).toLocaleString('es-CL')}</div>
                                                <div className="text-slate-400 text-[10px] font-bold">{plans[planId]?.postsLimit >= 999999 ? '∞' : plans[planId]?.postsLimit} posts/mes</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <StatusModal
                {...modal}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
