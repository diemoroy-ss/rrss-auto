"use client";
import React from "react";

function getExpirationText(timestamp?: number) {
  if (!timestamp) return { text: "Vigencia Desconocida", color: "text-slate-500", bg: "bg-slate-100", isExpired: false };
  const now = Date.now();
  const diff = timestamp - now;
  if (diff <= 0) return { text: "Expirado", color: "text-rose-500", bg: "bg-rose-100", isExpired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return { text: `Expira en ${days} día${days !== 1 ? 's' : ''}`, color: days < 7 ? "text-amber-600" : "text-emerald-600", bg: days < 7 ? "bg-amber-100" : "bg-emerald-100", isExpired: false };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return { text: `Expira en ${hours} h`, color: "text-amber-600", bg: "bg-amber-100", isExpired: false };
  return { text: "Expira pronto", color: "text-amber-600", bg: "bg-amber-100", isExpired: false };
}

interface TabConexionesProps {
  activeProfile: any;
  fbStatus: boolean;
  ttStatus: boolean;
  gbpStatus: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  handleConnectMeta: () => void;
  handleDisconnectFb: () => void;
  handleConnectTikTok: () => void;
  handleDisconnectTt: () => void;
  handleConnectYouTube: () => void;
  handleDisconnectYouTube: () => void;
  handleConnectX: () => void;
  handleDisconnectX: () => void;
  handleConnectGBP: () => void;
  handleDisconnectGBP: () => void;
  setShowMetaModal: (v: boolean) => void;
  setShowTikTokModal?: (v: boolean) => void;
}

export default function TabConexiones({
  activeProfile, fbStatus, ttStatus, gbpStatus, isAdmin,
  handleConnectMeta, handleDisconnectFb,
  handleConnectTikTok, handleDisconnectTt,
  handleConnectYouTube, handleDisconnectYouTube,
  handleConnectX, handleDisconnectX,
  handleConnectGBP, handleDisconnectGBP,
  setShowMetaModal,
  setShowTikTokModal,
}: TabConexionesProps) {
  return (
    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
        <span className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">🔗</span>
        <div>
          <h3 className="text-xl font-black text-slate-900">Conexiones a Redes Sociales</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Conecta tus cuentas para publicar automáticamente en cada plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Meta */}
        <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">f</span>
                <h5 className="font-black text-slate-900">Meta (FB & IG)</h5>
              </div>
              <div className="relative">
                <button type="button" className="peer w-5 h-5 bg-slate-200 text-slate-500 hover:bg-amber-100 hover:text-amber-600 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors cursor-help">?</button>
                <div className="absolute right-0 top-7 w-56 bg-slate-800 text-white p-3 rounded-xl text-[10px] leading-relaxed shadow-xl opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all z-50 pointer-events-none font-medium">
                  ⚠️ Por reglas de Meta, la automatización solo está permitida para Páginas de Empresa y cuentas de Instagram Empresa/Creador. No funciona con perfiles personales.
                  <div className="absolute -top-1.5 right-1.5 w-3 h-3 bg-slate-800 rotate-45" />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Conecta tu cuenta para publicar automáticamente en Facebook e Instagram.</p>
          </div>
          {fbStatus ? (
            <div className="flex flex-col h-full justify-end">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600">Conectado</span>
                </div>
                {(() => { const e = getExpirationText(activeProfile?.metaTokenExpiresAt); return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${e.bg} ${e.color}`}>{e.text}</span>; })()}
              </div>
              {(activeProfile?.facebookPageName || activeProfile?.instagramUsername) && (
                <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-sm">
                  {activeProfile.facebookPageName && <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2"><span className="text-blue-500">👤</span><span className="text-slate-400 font-medium">Página:</span><span className="truncate">{activeProfile.facebookPageName}</span></div>}
                  {activeProfile.instagramUsername && <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2"><span className="text-pink-500">📸</span><span className="text-slate-400 font-medium">Insta:</span><span className="truncate">@{activeProfile.instagramUsername}</span></div>}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMetaModal(true)} className="flex-1 bg-white border-2 border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors">Cambiar</button>
                <button type="button" onClick={handleConnectMeta} className="flex-1 bg-blue-50 border-2 border-blue-100 hover:border-blue-300 text-blue-600 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors">Actualizar</button>
                <button type="button" onClick={handleDisconnectFb} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">X</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={handleConnectMeta} className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">Conectar con Meta</button>
          )}
        </div>

        {/* TikTok */}
        <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.61-.65v5.13c.04 2.11-.6 4.31-2.12 5.85-1.59 1.62-3.95 2.45-6.19 2.14-2.61-.31-4.99-2.22-5.74-4.79-.88-2.85-.02-6.22 2.19-8.15 1.72-1.53 4.12-2.11 6.36-1.57v4.18c-1.34-.37-2.89-.08-3.94.83-1.04.9-1.54 2.37-1.28 3.73.28 1.43 1.57 2.53 3.01 2.62 1.45.09 2.92-.85 3.39-2.22.25-.66.29-1.39.27-2.09V0z"/></svg>
              </span>
              <div className="flex items-center justify-between flex-1">
                <h5 className="font-black text-slate-900">TikTok</h5>
                {!ttStatus && !isAdmin && <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">Próximamente</span>}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Publica tus Reels y videos automáticamente en tu perfil de TikTok.</p>
          </div>
          {ttStatus ? (
            <div className="flex flex-col h-full justify-end">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-xs font-bold text-emerald-600">Conectado</span></div>
                {(() => { const e = getExpirationText(activeProfile?.tiktokTokenExpiresAt); return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${e.bg} ${e.color} whitespace-nowrap ml-2`}>{e.text}</span>; })()}
              </div>
              {activeProfile?.tiktokUsername && <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="text-[11px] font-bold text-slate-700 flex items-center gap-2"><span>🎵</span><span className="text-slate-400">Perfil:</span><span className="truncate">{activeProfile.tiktokUsername}</span></div></div>}
              <div className="flex flex-col gap-2">
                {setShowTikTokModal && (
                  <button 
                    type="button" 
                    onClick={() => setShowTikTokModal(true)} 
                    className="w-full bg-slate-900 hover:bg-black text-white text-[11px] font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-slate-900/10"
                  >
                    <span>⚙️</span> Preferencias Direct Post
                  </button>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={handleConnectTikTok} className="flex-1 bg-white border-2 border-slate-200 hover:border-black text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">Actualizar</button>
                  <button type="button" onClick={handleDisconnectTt} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">X</button>
                </div>
              </div>
            </div>
          ) : isAdmin ? (
            <div className="flex flex-col gap-2 mt-auto">
              <button type="button" onClick={handleConnectTikTok} className="w-full bg-black hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors">Conectar con TikTok</button>
              {setShowTikTokModal && (
                <button 
                  type="button" 
                  onClick={() => setShowTikTokModal(true)} 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span>⚙️</span> Preferencias por Defecto
                </button>
              )}
            </div>
          ) : (
            <button type="button" disabled className="w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl text-sm mt-auto cursor-not-allowed border border-slate-200">Próximamente</button>
          )}
        </div>

        {/* YouTube Shorts */}
        <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">▶</span>
              <h5 className="font-black text-slate-900">YouTube Shorts</h5>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Publica tus Shorts y Reels de video directamente en tu canal de YouTube.</p>
          </div>
          {Boolean(activeProfile?.accounts?.youtube?.connected || activeProfile?.youtubeConnected) ? (
            <div className="flex flex-col h-full justify-end">
              <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-xs font-bold text-emerald-600">Conectado</span></div>
              {(activeProfile?.accounts?.youtube?.channelName || activeProfile?.youtubeChannelName) && <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="text-[11px] font-bold text-slate-700 flex items-center gap-2"><span className="text-rose-600">📺</span><span className="text-slate-400">Canal:</span><span className="truncate">{activeProfile?.accounts?.youtube?.channelName || activeProfile?.youtubeChannelName}</span></div></div>}
              <div className="flex gap-2">
                <button type="button" onClick={handleConnectYouTube} className="flex-1 bg-white border-2 border-slate-200 hover:border-rose-500 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">Actualizar</button>
                <button type="button" onClick={handleDisconnectYouTube} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">X</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={handleConnectYouTube} className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">Conectar con YouTube</button>
          )}
        </div>

        {/* X (Twitter) */}
        <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xs">𝕏</span>
              <h5 className="font-black text-slate-900">X (Twitter)</h5>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Publica hilos, tweets y videos automáticamente en tu perfil de X.</p>
          </div>
          {Boolean(activeProfile?.accounts?.x?.connected || activeProfile?.xConnected) ? (
            <div className="flex flex-col h-full justify-end">
              <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-xs font-bold text-emerald-600">Conectado</span></div>
              {(activeProfile?.accounts?.x?.username || activeProfile?.xUsername) && <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="text-[11px] font-bold text-slate-700 flex items-center gap-2"><span>𝕏</span><span className="text-slate-400">Usuario:</span><span className="truncate">{activeProfile?.accounts?.x?.username || activeProfile?.xUsername}</span></div></div>}
              <div className="flex gap-2">
                <button type="button" onClick={handleConnectX} className="flex-1 bg-white border-2 border-slate-200 hover:border-black text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">Actualizar</button>
                <button type="button" onClick={handleDisconnectX} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">X</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={handleConnectX} className="w-full bg-black hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">Conectar con X (Twitter)</button>
          )}
        </div>

        {/* Google Business Profile */}
        <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">G</span>
              <h5 className="font-black text-slate-900">Google Business Profile</h5>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Publica actualizaciones y fotos directamente en tu ficha de Google Maps.</p>
          </div>
          {gbpStatus ? (
            <div className="flex flex-col h-full justify-end">
              <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-xs font-bold text-emerald-600">Conectado</span></div>
              {activeProfile?.googleBusinessName && <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="text-[11px] font-bold text-slate-700 flex items-center gap-2"><span className="text-amber-500">📍</span><span className="text-slate-400">Local:</span><span className="truncate">{activeProfile.googleBusinessName}</span></div></div>}
              <div className="flex gap-2">
                <button type="button" onClick={handleConnectGBP} className="flex-1 bg-white border-2 border-slate-200 hover:border-amber-500 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">Actualizar</button>
                <button type="button" onClick={handleDisconnectGBP} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">X</button>
              </div>
            </div>
          ) : isAdmin ? (
            <button type="button" onClick={handleConnectGBP} className="w-full bg-[#EA4335] hover:bg-[#d63022] text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">Conectar con Google</button>
          ) : (
            <button type="button" disabled className="w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl text-sm mt-auto cursor-not-allowed border border-slate-200">Próximamente</button>
          )}
        </div>
      </div>
    </div>
  );
}
