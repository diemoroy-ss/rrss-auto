"use client";
import React from "react";

interface TabContactoProps {
  website: string; includeWebsiteInCopy: boolean;
  email: string; includeEmailInCopy: boolean;
  phone: string; includePhoneInCopy: boolean;
  promotions: string;
  bannerStyle: 'banner' | 'clean';
  setWebsite: (v: string) => void;
  setIncludeWebsiteInCopy: (v: boolean) => void;
  setEmail: (v: string) => void;
  setIncludeEmailInCopy: (v: boolean) => void;
  setPhone: (v: string) => void;
  setIncludePhoneInCopy: (v: boolean) => void;
  setPromotions: (v: string) => void;
  setBannerStyle: (v: 'banner' | 'clean') => void;
}

export default function TabContacto({
  website, includeWebsiteInCopy, email, includeEmailInCopy,
  phone, includePhoneInCopy, promotions, bannerStyle,
  setWebsite, setIncludeWebsiteInCopy, setEmail, setIncludeEmailInCopy,
  setPhone, setIncludePhoneInCopy, setPromotions, setBannerStyle,
}: TabContactoProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">📋</span>
          <h3 className="text-xl font-black text-slate-900">Datos de Contacto</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🌐 Sitio Web o Enlace de Acceso</label>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://tu-sitio-web.com" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
            <label className="flex items-start gap-3 mt-3 cursor-pointer group p-3.5 bg-indigo-50/70 hover:bg-indigo-50 rounded-2xl border border-indigo-100 transition-all">
              <input type="checkbox" checked={includeWebsiteInCopy} onChange={(e) => setIncludeWebsiteInCopy(e.target.checked)} className="mt-0.5 w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 focus:ring-2" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Adjuntar enlace web por defecto en cada nuevo post</span>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  En <strong>Facebook</strong> se inserta como enlace directo cliqueable y en <strong>Instagram</strong> como llamada al link en bio. Podrás activar/desactivar o cambiar la URL para cada post individualmente.
                </p>
              </div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📧 Correo Contacto</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hola@marca.cl" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              <label className="flex items-center gap-2 mt-2 cursor-pointer group">
                <input type="checkbox" checked={includeEmailInCopy} onChange={(e) => setIncludeEmailInCopy(e.target.checked)} className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2" />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Incluir en posts</span>
              </label>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📞 Teléfono (WhatsApp)</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 ..." className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              <label className="flex items-center gap-2 mt-2 cursor-pointer group">
                <input type="checkbox" checked={includePhoneInCopy} onChange={(e) => setIncludePhoneInCopy(e.target.checked)} className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2" />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Incluir en posts</span>
              </label>
            </div>
          </div>

          {/* Tarjeta de Vinculación y Protección Anti-Baneo */}
          <div className="md:col-span-2 mt-4 p-6 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-emerald-600/20">
                  📱
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-base font-black text-slate-900">
                      Asistente Oficial de WhatsApp
                    </h4>
                    <span className="whitespace-nowrap font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
                      +56 9 6590 9543
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                    Gestiona, aprueba publicaciones y consulta el Radar de Nicho de esta marca directamente desde tu chat de WhatsApp.
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/56965909543?text=Hola%20Santisoft!%20Quiero%20activar%20mi%20asistente%20para%20esta%20marca"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto text-center px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <span>💬</span>
                <span>Guardar y Chatear</span>
              </a>
            </div>

            {/* Aviso de seguridad anti-baneo a lo largo de todo el ancho */}
            <div className="mt-4 p-3.5 rounded-xl bg-white/80 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
              <span className="text-base shrink-0">🛡️</span>
              <div>
                <strong className="text-emerald-900 font-black">Paso clave de seguridad:</strong>{" "}
                <span>Guarda este número (<strong>+56 9 6590 9543</strong>) en tu agenda como <strong>&quot;Santisoft Agentes&quot;</strong>. Así WhatsApp lo identificará como un contacto de confianza y recibirás tus alertas y aprobaciones sin bloqueos ni retrasos.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <span className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">🏷️</span>
          <div>
            <h3 className="text-xl font-black text-slate-900">Promociones y Estilo Visual</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Nuestros agentes usarán estas ofertas para diseñar los titulares y badges de tus carteles automáticos.</p>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🎯 Ofertas, Combos y Servicios Estrella</label>
          <textarea value={promotions} onChange={(e) => setPromotions(e.target.value)} placeholder={"Ejemplo:\n• Jueves 2x1 en hamburguesas\n• Combo Burger + Bebida a $8.990\n• 20% descuento primera visita por WhatsApp"} rows={4} className="w-full bg-slate-50 border-2 border-amber-200/60 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/60 outline-none text-sm font-bold transition-all text-slate-700 resize-none shadow-sm" />
          <p className="text-[11px] text-slate-500 font-medium mt-2">💡 <strong>Tip:</strong> Incluye días de la semana, precios, combos o regalos para incentivar la venta directa.</p>
        </div>
        <div className="pt-6 border-t border-amber-200/40">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">🎨 Formato Visual de tus Publicaciones:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label onClick={() => setBannerStyle('banner')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${bannerStyle === 'banner' ? 'bg-white border-amber-500 shadow-md shadow-amber-500/10' : 'bg-white/60 border-slate-200/70 hover:bg-white'}`}>
              <input type="radio" name="bannerStyle" checked={bannerStyle === 'banner'} onChange={() => setBannerStyle('banner')} className="mt-1 accent-amber-600" />
              <div>
                <p className="text-xs font-black text-slate-900">🏷️ Cartel Publicitario Comercial (Recomendado)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Estampa titulares llamativos, badges de oferta y tu logo sobre la foto para vender más rápido.</p>
              </div>
            </label>
            <label onClick={() => setBannerStyle('clean')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${bannerStyle === 'clean' ? 'bg-white border-amber-500 shadow-md shadow-amber-500/10' : 'bg-white/60 border-slate-200/70 hover:bg-white'}`}>
              <input type="radio" name="bannerStyle" checked={bannerStyle === 'clean'} onChange={() => setBannerStyle('clean')} className="mt-1 accent-amber-600" />
              <div>
                <p className="text-xs font-black text-slate-900">🖼️ Solo Fotografía Limpia</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Genera únicamente la foto realista del producto o servicio sin textos encima.</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
