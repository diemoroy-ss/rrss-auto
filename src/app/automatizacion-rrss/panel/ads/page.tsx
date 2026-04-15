"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useProfile } from "../../../../contexts/ProfileContext";
import AdsWizard from "../../../../components/ads/AdsWizard";

interface Campaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
}

export default function AdsDashboard() {
    const { activeProfile } = useProfile();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u);
            if (!u) setLoading(false);
        });
        return () => unsub();
    }, []);

    const fetchCampaigns = async () => {
        if (!user || !activeProfile) return;
        setLoading(true);
        setErrorMsg("");
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/meta-ads/campaigns?profileId=${activeProfile.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Error al obtener campañas");
            
            setCampaigns(data.campaigns || []);
        } catch (error: any) {
            console.error("Fetch Campaigns Error:", error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && activeProfile) {
            fetchCampaigns();
        }
    }, [user, activeProfile]);

    const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
    const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

    if (loading) return <div className="animate-pulse space-y-4 max-w-4xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;

    if (!activeProfile?.facebookToken_enc) {
        return (
            <div className="w-full max-w-7xl mx-auto pb-20">
                <div className="bg-white p-12 rounded-[32px] text-center border-2 border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="text-6xl mb-6">⚙️</div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">No has conectado Meta Ads</h2>
                    <p className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">Para ver tus métricas y poder crear nuevas campañas desde aquí, necesitas configurar tu Ad Account ID y Token en la sección de Configuración.</p>
                    <a href="/automatizacion-rrss/panel/configuracion" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-indigo-500/30">
                        Ir a Configuración
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto pb-20 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Panel de <span className="text-indigo-600">Anuncios.</span></h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium leading-relaxed">Monitorea tus campañas activas y lanza nuevas pautas fácilmente.</p>
                </div>
                <button 
                  onClick={() => setIsWizardOpen(true)} 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-lg py-4 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3 shrink-0"
                >
                    <span>⚡</span> Crear Nueva Campaña
                </button>
            </div>

            {errorMsg && <div className="mb-8 p-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-sm border border-rose-100">⚠️ {errorMsg}</div>}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Gasto en 30 días</h3>
                    <div className="text-3xl font-black text-slate-900">${totalSpend.toFixed(2)}</div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Impresiones Totales</h3>
                    <div className="text-3xl font-black text-slate-900">{totalImpressions.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Clics Totales</h3>
                    <div className="text-3xl font-black text-slate-900">{totalClicks.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Costo Por Clic (CPC) Promedio</h3>
                    <div className="text-3xl font-black text-slate-900">${avgCpc.toFixed(2)}</div>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 border-t-4 border-t-indigo-500">
                    <h3 className="text-lg font-black text-slate-900">Campañas en la Cuenta</h3>
                    <button onClick={fetchCampaigns} className="text-xs font-bold text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                        <span>🔄</span>
                        Actualizar
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de Campaña</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gasto</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Impresiones</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Clics</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">CPC</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                                        No se encontraron campañas.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map(camp => (
                                    <tr key={camp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5 font-bold text-sm text-slate-700">{camp.name}</td>
                                        <td className="p-5 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${camp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {camp.status}
                                            </span>
                                        </td>
                                        <td className="p-5 font-medium text-sm text-slate-600 text-right">${camp.spend.toFixed(2)}</td>
                                        <td className="p-5 font-medium text-sm text-slate-600 text-right">{camp.impressions.toLocaleString()}</td>
                                        <td className="p-5 font-medium text-sm text-indigo-600 text-right">{camp.clicks.toLocaleString()}</td>
                                        <td className="p-5 font-medium text-sm text-slate-600 text-right">${camp.cpc.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdsWizard 
                isOpen={isWizardOpen} 
                onClose={() => setIsWizardOpen(false)}
                onSuccess={() => {
                    setIsWizardOpen(false);
                    fetchCampaigns();
                }}
            />
        </div>
    );
}
