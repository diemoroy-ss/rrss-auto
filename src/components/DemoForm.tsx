"use client";
import { useState } from "react";

export default function DemoForm() {
    const [step, setStep] = useState<"idea" | "loading" | "result">("idea");
    const [ideaData, setIdeaData] = useState({ rubro: "", idea: "" });
    const [leadData, setLeadData] = useState({ name: "", phone: "", email: "" });
    const [result, setResult] = useState<{ imageUrl?: string; videoUrl?: string; copy?: string } | null>(null);
    const [error, setError] = useState("");

    const handleIdeaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep("loading");
        setError("");

        try {
            const response = await fetch("/api/ai/demo-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ideaData)
            });

            if (!response.ok) throw new Error("Error en el servidor de IA");
            const data = await response.json();
            
            setResult({
                imageUrl: data.result?.imageUrl || data.result?.image,
                videoUrl: data.result?.videoUrl || data.result?.video,
                copy: data.copy
            });
            setStep("result");
        } catch (err) {
            console.error(err);
            setError("No pudimos generar la creatividad en este momento. Inténtalo más tarde.");
            setStep("idea");
        }
    };

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep("loading"); // Optional loading feedback while sending lead
        try {
            // Send the lead to the webhook including the generated copy/media links
            await fetch("https://n8n.santisoft.cl/webhook/demo-ia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    ...ideaData, 
                    ...leadData, 
                    isLead: true,
                    generatedCopy: result?.copy,
                    generatedImage: result?.imageUrl,
                    generatedVideo: result?.videoUrl
                })
            });
        } catch { /* best effort */ }
        window.location.href = "/automatizacion-rrss/panel"; // Send them to dashboard or login
    };

    const resetForm = () => {
        setStep("idea");
        setResult(null);
    }

    return (
        <>
            {/* The inline form or loading state */}
            {step === "loading" && !result ? (
                <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 min-h-[460px] justify-center">
                    <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-pink-100 border-b-pink-500 rounded-full animate-[spin_1.5s_reverse_infinite]"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">✨</div>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Creando Magia Pura…</h3>
                    <p className="text-slate-500 font-medium max-w-xs">Nuestros motores de IA están redactando, diseñando y renderizando tu nuevo post profesional en tiempo récord.</p>
                </div>
            ) : (
                <div id="demo-form" className="bg-white p-8 md:p-10 rounded-[32px] border border-slate-200 shadow-2xl relative overflow-hidden group min-h-[460px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" aria-hidden="true"></div>

                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-1">Ve la magia en acción</h3>
                        <p className="text-slate-500 mb-8 font-medium">Cuéntanos tu idea y la IA generará un post real para tu negocio — sin registro previo.</p>

                        {error && <p className="mb-4 text-rose-500 text-sm font-bold bg-rose-50 p-3 rounded-lg border border-rose-100" role="alert">{error}</p>}

                        <form onSubmit={handleIdeaSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="demo-rubro" className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 px-1">Tu Rubro o Tipo de Negocio</label>
                                <input
                                    id="demo-rubro"
                                    required
                                    type="text"
                                    placeholder="Ej: Sushi / Clínica Dental / Tienda de Ropa"
                                    value={ideaData.rubro}
                                    onChange={e => setIdeaData({...ideaData, rubro: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="demo-idea" className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 px-1">¿Qué quieres promocionar?</label>
                                <textarea
                                    id="demo-idea"
                                    required
                                    rows={3}
                                    placeholder="Ej: Lanzamiento de mi nuevo menú de verano con 20% de descuento este fin de semana"
                                    value={ideaData.idea}
                                    onChange={e => setIdeaData({...ideaData, idea: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                            >
                                <span>🪄</span> Generar mi post con IA
                            </button>
                            <p className="text-center text-xs text-slate-400 font-medium">No se requiere tarjeta de crédito · Es completamente gratis</p>
                        </form>
                    </div>
                </div>
            )}

            {/* FULL SCREEN WOW MODAL for Results */}
            {step === "result" && result && (
                <div className="fixed inset-0 z-[999] bg-slate-900/80 backdrop-blur-md overflow-y-auto w-full h-full flex items-start md:items-center justify-center animate-in fade-in duration-300 p-0 md:p-6 lg:p-10">
                    <div className="bg-slate-50 w-full min-h-screen md:min-h-0 md:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col md:max-w-7xl animate-in zoom-in-95 duration-500">
                        
                        {/* Header Area */}
                        <div className="bg-white p-6 md:px-12 md:py-8 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20">
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black font-display text-slate-900 tracking-tight leading-none mb-2 text-center md:text-left">
                                    ¡Wow! Aquí tienes tu contenido.
                                </h2>
                                <p className="text-slate-500 font-medium text-center md:text-left text-sm md:text-base">
                                    Generado 100% con Inteligencia Artificial. Listo para publicar en redes.
                                </p>
                            </div>
                            <button onClick={resetForm} className="hidden md:flex items-center justify-center w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors order-first md:order-last">
                                ✕
                            </button>
                        </div>

                        {/* Content Split */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 lg:flex gap-12 bg-slate-50">
                            
                            {/* Left Col: Media Gallery */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 lg:max-w-[60%]">
                                {result.imageUrl && (
                                    <div className="flex flex-col gap-3 group relative">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">1</span>
                                            <h4 className="font-black uppercase tracking-widest text-xs text-slate-600">Post de Imagen Generado</h4>
                                        </div>
                                        <div className="rounded-[24px] overflow-hidden border-[6px] border-white shadow-xl relative aspect-[4/5] bg-slate-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={result.imageUrl} alt="AI Generated Post" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full z-10">Imagen 4:5</div>
                                        </div>
                                    </div>
                                )}
                                
                                {result.videoUrl && (
                                    <div className="flex flex-col gap-3 group relative">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">2</span>
                                            <h4 className="font-black uppercase tracking-widest text-xs text-slate-600">Reel Animado Generado</h4>
                                        </div>
                                        <div className="rounded-[24px] overflow-hidden border-[6px] border-white shadow-xl relative aspect-[9/16] bg-black">
                                            <video src={result.videoUrl} autoPlay loop muted playsInline controls className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute top-4 left-4 bg-pink-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full z-10 shadow-lg">Reel Vertical</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Copy & Lead Capture */}
                            <div className="flex-1 flex flex-col mt-10 lg:mt-0 max-w-lg mx-auto lg:mx-0">
                                
                                {result.copy && (
                                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8 w-full relative">
                                        <div className="absolute top-0 right-8 -mt-4 bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm">
                                            Redacción Lista
                                        </div>
                                        <h4 className="text-slate-400 font-black tracking-widest uppercase text-[11px] mb-4">Caption para Instagram / Facebook</h4>
                                        <p className="text-slate-700 whitespace-pre-wrap font-medium leading-relaxed font-sans">{result.copy}</p>
                                    </div>
                                )}

                                {/* Sticky-like Lead Capture Block */}
                                <div className="bg-indigo-600 rounded-[32px] p-8 lg:p-10 shadow-2xl text-white relative overflow-hidden shrink-0 mt-auto">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-24 -mt-24 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black font-display leading-tight mb-2">
                                            Automatiza todo tu mes en 5 minutos.
                                        </h3>
                                        <p className="text-indigo-200 font-medium mb-8 text-sm md:text-base">
                                            Te regalamos acceso inmediato para que agendes este post y 14 más, 100% gratis.
                                        </p>
                                        
                                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                                            <div className="space-y-3">
                                                <input id="demo-phone" required type="tel" placeholder="Tu número de WhatsApp" value={leadData.phone}
                                                    onChange={e => setLeadData({...leadData, phone: e.target.value})}
                                                    className="w-full px-5 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 font-bold transition-all"
                                                />
                                                <input id="demo-email" required type="email" placeholder="Tu correo electrónico" value={leadData.email}
                                                    onChange={e => setLeadData({...leadData, email: e.target.value})}
                                                    className="w-full px-5 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 font-bold transition-all"
                                                />
                                            </div>
                                            <button type="submit" className="w-full py-4 mt-2 bg-white text-indigo-700 font-black text-lg rounded-2xl shadow-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                                Desbloquear mi cuenta
                                            </button>
                                        </form>
                                        
                                        <div className="mt-6 flex justify-center lg:hidden">
                                           <button onClick={resetForm} className="text-indigo-300 hover:text-white font-bold text-sm underline transition-colors">
                                               Probar otra idea distinta
                                           </button>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
