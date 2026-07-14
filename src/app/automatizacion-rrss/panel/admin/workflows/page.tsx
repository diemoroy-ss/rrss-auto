"use client";

import { useState } from "react";
import { auth } from "../../../../../lib/firebase";

interface N8NWorkflow {
    id: string;
    name: string;
    description: string;
    url: string;
    method: 'POST' | 'GET';
    authStrategy: string;
    variablesSent: Record<string, string>;
    expectedReturn: string;
    nodeFlow: string[];
}

const WORKFLOWS: N8NWorkflow[] = [
    {
        id: 'demo-ia',
        name: 'Demo IA Generator',
        description: 'Genera contenido de prueba para la landing page (no requiere login).',
        url: 'https://n8n.santisoft.cl/webhook-test/demo-ia',
        method: 'POST',
        authStrategy: 'Ninguna (Público)',
        variablesSent: {
            business_type: 'String',
            objective: 'String',
            prompt: 'String',
            tone: 'String'
        },
        expectedReturn: 'JSON: { imageUrl: "...", videoUrl: "..." }',
        nodeFlow: ['Webhook', 'OpenAI (Texto)', 'OpenAI (DALL-E 3) / Replicate (Video)', 'Respond to Webhook']
    },
    {
        id: 'generar-imagen',
        name: 'Generar Imagen AI (Post)',
        description: 'Genera las imágenes de un post social luego de que la estrategia es aceptada.',
        url: 'https://n8n.santisoft.cl/webhook-test/generar-imagen',
        method: 'POST',
        authStrategy: 'Header: Authorization: Bearer {CRON_SECRET}',
        variablesSent: {
            callbackUrl: 'String (URL para devolver la imagen)',
            id: 'String (Post ID)',
            prompt: 'String',
            user: 'String (UID)',
            model: 'String',
            size: 'String'
        },
        expectedReturn: 'HTTP 200 OK (Asíncrono, N8N llama de vuelta a Firebase)',
        nodeFlow: ['Webhook POST', 'OpenAI (DALL-E 3)', 'HTTP Request (Callback Firebase Firebase API)']
    },
    {
        id: 'auto-rrss-ws',
        name: 'Enviar Reporte WhatsApp',
        description: 'Envía un PDF de métricas por WhatsApp al administrador del comercio.',
        url: 'https://n8n.santisoft.cl/webhook-test/auto-rrss-ws',
        method: 'POST',
        authStrategy: 'Header: X-Santisoft-Secret: {CRON_SECRET}',
        variablesSent: {
            targetValue: 'String (Teléfono)',
            message: 'String (Texto)',
            filename: 'String',
            pdfBase64: 'String (Base64 PDF)'
        },
        expectedReturn: 'HTTP 200 OK',
        nodeFlow: ['Webhook POST', 'Code (Buffer parse)', 'Evolution API (Send Document)', 'Respond to Webhook']
    },
    {
        id: 'auto-rrss-email',
        name: 'Enviar Reporte Email',
        description: 'Envía el PDF de métricas al correo del administrador.',
        url: 'https://n8n.santisoft.cl/webhook-test/auto-rrss-email',
        method: 'POST',
        authStrategy: 'Header: X-Santisoft-Secret: {CRON_SECRET}',
        variablesSent: {
            targetValue: 'String (Email)',
            message: 'String (HTML/Text)',
            filename: 'String',
            pdfBase64: 'String (Base64 PDF)'
        },
        expectedReturn: 'HTTP 200 OK',
        nodeFlow: ['Webhook POST', 'Send Email Node (SMTP/GMail)', 'Respond to Webhook']
    },
    {
        id: 'img-rrss-auto-test',
        name: 'Preview AI Generator (Dashboard)',
        description: 'Genera la vista previa (imagen/video) cuando el usuario crea un post manual.',
        url: 'https://n8n.santisoft.cl/webhook-test/img-rrss-auto',
        method: 'POST',
        authStrategy: 'Ninguna',
        variablesSent: {
            idea: 'String',
            businessType: 'String',
            type: 'String (Post/Reel/Carrusel)',
            prompts: 'Array[String]'
        },
        expectedReturn: 'JSON { imageUrl: "...", suggestedCopy: "..." }',
        nodeFlow: ['Webhook POST', 'AI Image Gen', 'Respond to Webhook']
    },
    {
        id: 'auto-rrss-post',
        name: 'Publicar Post Automatizado',
        description: 'Flujo que publica contenido real en Facebook/Instagram (GCP Tasks).',
        url: 'https://n8n.santisoft.cl/webhook-test/auto-rrss-post',
        method: 'POST',
        authStrategy: 'Header: X-Santisoft-Secret: {CRON_SECRET}',
        variablesSent: {
            postId: 'String',
            userId: 'String',
            copy: 'String',
            networks: 'Array[String]'
        },
        expectedReturn: 'HTTP 200 OK',
        nodeFlow: ['Webhook POST', 'Auth Check', 'Meta API Post', 'Firebase Update']
    }
];

export default function WorkflowsAdminPage() {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [resultsMap, setResultsMap] = useState<Record<string, any>>({});

    const handleTestTrigger = async (workflowId: string) => {
        setLoadingMap(prev => ({ ...prev, [workflowId]: true }));
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin/n8n-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ webhookId: workflowId })
            });
            const data = await res.json();
            setResultsMap(prev => ({ ...prev, [workflowId]: data }));
        } catch (e: any) {
            setResultsMap(prev => ({ ...prev, [workflowId]: { success: false, error: e.message } }));
        } finally {
            setLoadingMap(prev => ({ ...prev, [workflowId]: false }));
            setExpandedId(workflowId); // auto expand to show result
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-2">
                    <span className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-slate-900/30 text-white">⚙️</span>
                    Dashboard N8N - Sistema de Orquestación
                </h1>
                <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                    Monitorea y prueba manualmente la orquestación entre la plataforma web y las automatizaciones en N8N (Make-alike).
                </p>
            </div>

            <div className="space-y-6">
                {WORKFLOWS.map((wf) => {
                    const isExpanded = expandedId === wf.id;
                    const isLoading = loadingMap[wf.id];
                    const result = resultsMap[wf.id];

                    return (
                        <div key={wf.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                            {/* Card Header */}
                            <div className="p-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : wf.id)}>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                                        {wf.name}
                                        {result && (
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${result.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {result.success ? 'OK' : 'ERROR'}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-slate-500 text-sm font-medium mt-1">{wf.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                     <button 
                                        disabled={isLoading}
                                        onClick={(e) => { e.stopPropagation(); handleTestTrigger(wf.id); }}
                                        className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs py-2 px-6 rounded-xl transition-all flex items-center gap-2"
                                     >
                                         {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '⚡ Probar Flujo'}
                                     </button>
                                     <button className="text-slate-400 hover:text-slate-900 transition-colors w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
                                         <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                         </svg>
                                     </button>
                                </div>
                            </div>

                            {/* Card Details (Collapsible) */}
                            {isExpanded && (
                                <div className="px-6 pb-8 md:px-8 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-4 fade-in duration-300 pt-6">
                                    {/* Test Results Banner */}
                                    {result && (
                                        <div className={`mb-8 p-6 rounded-2xl border ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                            <h4 className={`text-sm font-black uppercase tracking-widest mb-2 ${result.success ? 'text-emerald-800' : 'text-rose-800'}`}>
                                                Resultado de Prueba: {result.status} {result.statusText}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-bold mb-4 font-mono select-all">Test URL: {result.url}</p>
                                            <div className={`text-xs font-mono p-4 rounded-xl overflow-x-auto max-h-60 ${result.success ? 'bg-emerald-900 text-emerald-100' : 'bg-rose-900 text-rose-100'}`}>
                                                <pre>{JSON.stringify(result.data || result.error, null, 2)}</pre>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Column 1: Config */}
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase bg-blue-100 text-blue-700`}>{wf.method}</span>
                                                    <code className="text-xs font-mono text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex-1 overflow-hidden text-ellipsis">{wf.url}</code>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Autenticación</h4>
                                                <p className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl">{wf.authStrategy}</p>
                                            </div>

                                            <div>
                                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Variables Enviadas (JSON Body)</h4>
                                                 <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto">
                                                    <pre className="text-xs text-slate-600 font-mono">
{JSON.stringify(wf.variablesSent, null, 2)}
                                                    </pre>
                                                 </div>
                                            </div>
                                        </div>

                                        {/* Column 2: Behavior */}
                                        <div className="space-y-6 lg:border-l border-slate-200 lg:pl-8">
                                            <div>
                                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Respuesta Esperada Front</h4>
                                                 <p className="text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl font-mono">{wf.expectedReturn}</p>
                                            </div>

                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Mapeo de Nodos N8N (Estimado)</h4>
                                                <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6">
                                                    {wf.nodeFlow.map((node, idx) => (
                                                        <div key={idx} className="relative pl-6">
                                                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-white" />
                                                            <p className="text-sm font-bold text-slate-700">{node}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
