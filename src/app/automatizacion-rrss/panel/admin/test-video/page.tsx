'use client';

import { useState } from 'react';

export default function TestVideoPage() {
    const [postId, setPostId] = useState('test-post-123');
    const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1080&h=1920&q=80');
    const [prompt, setPrompt] = useState('Cinematic slow motion push-in shot for a modern coffee shop. Professional lighting, 4k resolution, high quality, photorealistic, depth of field.');
    const [rubro, setRubro] = useState('Cafetería de Especialidad');
    const [renderMode, setRenderMode] = useState<'raw' | 'remotion'>('raw');
    const [webhookUrl, setWebhookUrl] = useState('https://n8n.santisoft.cl/webhook-test/image-to-video');
    
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState('');

    const [statusWebhookUrl, setStatusWebhookUrl] = useState('https://n8n.santisoft.cl/webhook-test/image-to-video-status');
    const [jobId, setJobId] = useState('');
    const [statusResponse, setStatusResponse] = useState<any>(null);

    const handleTestInitiate = async () => {
        setLoading(true);
        setError('');
        setResponse(null);
        
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    imageUrl,
                    prompt,
                    rubro,
                    aspectRatio: '9:16',
                    renderMode,
                    motionStyle: 'cinematic_slow_push_in'
                })
            });
            
            const data = await res.json();
            setResponse(data);
            
            if (data.jobId) {
                setJobId(data.jobId);
            }
        } catch (err: any) {
            setError(`Error al conectar con n8n: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestStatus = async () => {
        if (!jobId) {
            setError('Necesitas un Job ID para consultar el estado.');
            return;
        }
        
        setLoading(true);
        setError('');
        setStatusResponse(null);
        
        try {
            const res = await fetch(`${statusWebhookUrl}?jobId=${encodeURIComponent(jobId)}`);
            const data = await res.json();
            setStatusResponse(data);
        } catch (err: any) {
            setError(`Error al consultar estado en n8n: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-2xl font-black text-slate-800 mb-6">🛠️ Testing de Webhooks: Image to Video (n8n)</h1>
            <p className="text-sm text-slate-500 mb-8">Usa esta página para enviar peticiones de prueba a tus flujos de n8n (Image-to-Video y Polling) y asegurar que devuelvan el formato correcto de JSON antes de probarlo en producción.</p>

            <div className="grid md:grid-cols-2 gap-8">
                {/* INITIATE SECTION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Paso 1: Iniciar Generación (POST)</h2>
                    
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Webhook URL</label>
                            <input type="text" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">URL de Imagen Base</label>
                            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 font-mono" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Switch de Renderizado</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRenderMode('raw')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${renderMode === 'raw' ? 'bg-amber-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    ⚡ Video Puro (raw)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRenderMode('remotion')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${renderMode === 'remotion' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    ✨ Remotion (remotion)
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Post ID</label>
                            <input type="text" value={postId} onChange={e => setPostId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rubro</label>
                            <input type="text" value={rubro} onChange={e => setRubro(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prompt Generado (Inglés)</label>
                            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-800 resize-none" />
                        </div>
                    </div>

                    <button 
                        onClick={handleTestInitiate}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Enviando...' : 'Test: Enviar POST a n8n'}
                    </button>

                    {response && (
                        <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-x-auto">
                            <p className="text-[10px] text-slate-400 mb-2">Respuesta de n8n (Debería traer "status" y "jobId"):</p>
                            <pre className="text-xs text-emerald-400 font-mono">{JSON.stringify(response, null, 2)}</pre>
                        </div>
                    )}
                </div>

                {/* STATUS SECTION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Paso 2: Consultar Estado (Polling GET)</h2>
                    
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Webhook de Estado URL</label>
                            <input type="text" value={statusWebhookUrl} onChange={e => setStatusWebhookUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Job ID a consultar</label>
                            <input type="text" value={jobId} onChange={e => setJobId(e.target.value)} placeholder="Ej: test-post-123" className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-800" />
                        </div>
                    </div>

                    <button 
                        onClick={handleTestStatus}
                        disabled={loading || !jobId}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Consultando...' : 'Test: Consultar Estado GET'}
                    </button>

                    {statusResponse && (
                        <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-x-auto">
                            <p className="text-[10px] text-slate-400 mb-2">Respuesta de n8n (Debería traer "status" y "videoUrl" si está done):</p>
                            <pre className="text-xs text-emerald-400 font-mono">{JSON.stringify(statusResponse, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-6 p-4 bg-rose-100 text-rose-700 rounded-xl font-medium border border-rose-200">
                    {error}
                </div>
            )}
        </div>
    );
}
