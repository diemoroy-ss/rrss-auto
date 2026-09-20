"use client";

import { useState } from "react";
import Link from "next/link";

interface Scenario {
  id: string;
  tabLabel: string;
  userText: string;
  userTime: string;
  botTime: string;
  botReply: React.ReactNode;
}

const SCENARIOS: Scenario[] = [
  {
    id: "aprobar",
    tabLabel: "1. Ver y aprobar posts",
    userText: "1",
    userTime: "09:41",
    botTime: "09:41",
    botReply: (
      <div className="space-y-2">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          📅 <strong>Tus próximos posts en fila:</strong>
        </p>
        <div className="bg-slate-100/80 dark:bg-slate-800/70 p-2.5 rounded-lg text-xs space-y-1.5 border border-slate-200/50 dark:border-slate-700/50 font-mono">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>• Mié 18:00 · IG/FB</span>
            <span className="text-amber-500 font-bold">Pendiente</span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-sans italic">
            &quot;3 errores comunes al elegir software para tu negocio...&quot;
          </p>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
            <span>• Vie 12:30 · TikTok/Reels</span>
            <span className="text-amber-500 font-bold">Pendiente</span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-sans italic">
            &quot;Cómo ahorramos 15 horas semanales con agentes dedicados...&quot;
          </p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Responde <strong>6</strong> para aprobar todos y dejarlos agendados, o ingresa al panel para ajustar el arte.
        </p>
      </div>
    )
  },
  {
    id: "crear",
    tabLabel: "4. Crear post al vuelo",
    userText: "4 Lanzamiento de promo 2x1 en asesorías por aniversario",
    userTime: "11:15",
    botTime: "11:15",
    botReply: (
      <div className="space-y-2">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          ✨ <strong>¡Borrador generado por nuestros agentes!</strong>
        </p>
        <div className="bg-slate-100/80 dark:bg-slate-800/70 p-2.5 rounded-lg text-xs space-y-1 border border-slate-200/50 dark:border-slate-700/50">
          <p className="font-medium text-slate-900 dark:text-white">
            🎉 Cumplimos otro año acompañando a PyMEs que no se rinden.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Para celebrarlo, durante las próximas 48 horas duplicamos cada sesión: te llevas 2 asesorías por el valor de 1.
          </p>
          <p className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] pt-1">
            #Emprendimiento #NegociosChile #Automatizacion
          </p>
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          ✅ Guardado en tu panel. Ya puedes revisarlo o dejar que salga en tu horario estelar.
        </p>
      </div>
    )
  },
  {
    id: "radar",
    tabLabel: "3. Radar de Nicho",
    userText: "3",
    userTime: "14:20",
    botTime: "14:20",
    botReply: (
      <div className="space-y-2">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          📡 <strong>Radar de Nicho activo para tu marca:</strong>
        </p>
        <div className="bg-slate-100/80 dark:bg-slate-800/70 p-2.5 rounded-lg text-xs space-y-1.5 border border-slate-200/50 dark:border-slate-700/50">
          <div className="text-slate-700 dark:text-slate-200">
            🔥 <strong>Tendencia #1:</strong> Dudas sobre automatización de boletas y cobros recurrentes.
          </div>
          <div className="text-slate-700 dark:text-slate-200">
            💡 <strong>Ángulo recomendado:</strong> Comparativa visual &quot;Cobrar manual vs. Sistema automático&quot;.
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            Fuentes analizadas: Búsquedas locales, foros y publicaciones de alto impacto esta semana.
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Nuestros agentes ya prepararon 2 ideas de contenido basadas en este radar.
        </p>
      </div>
    )
  },
  {
    id: "cuentas",
    tabLabel: "7. Cambiar de marca",
    userText: "7",
    userTime: "16:02",
    botTime: "16:02",
    botReply: (
      <div className="space-y-2">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          🔄 <strong>Cuentas vinculadas a este número:</strong>
        </p>
        <div className="bg-slate-100/80 dark:bg-slate-800/70 p-2 rounded-lg text-xs space-y-1 font-mono">
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
            ▸ C1: Santisoft AI (Activa actualmente)
          </div>
          <div className="text-slate-600 dark:text-slate-300">
            • C2: Tienda Orgánica Sur
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Escribe <strong>C2</strong> para cambiar de marca y gestionar su contenido de inmediato.
        </p>
      </div>
    )
  }
];

export default function WhatsAppBotSection() {
  const [activeTab, setActiveTab] = useState<string>("aprobar");
  const currentScenario = SCENARIOS.find((s) => s.id === activeTab) || SCENARIOS[0];

  return (
    <section id="whatsapp-bot" className="py-24 relative overflow-hidden border-t border-white/10">
      <div className="wrap relative z-10">
        
        {/* Encabezado de Sección */}
        <div className="section-head center max-w-2xl mx-auto mb-16" data-reveal>
          <span className="eyebrow flex items-center justify-center gap-2 mx-auto mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Control total desde el móvil
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Tu marketing publica solo.<br />
            El control lo tienes en <span className="text-emerald-500">WhatsApp.</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Nuestros agentes investigan tu industria, diseñan piezas, redactan copys y publican en piloto automático.
            Pero cuando quieres supervisar o pedir algo nuevo, no tienes que abrir un panel: lo resuelves con un mensaje.
          </p>
        </div>

        {/* Bento Grid: Simulador WhatsApp a la izquierda + Beneficios a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto" data-reveal>
          
          {/* Columna Izquierda: Teléfono con WhatsApp UI */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Píldoras interactivas para probar escenarios */}
            <div className="flex flex-wrap gap-2 justify-center mb-4 w-full">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === s.id
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60"
                  }`}
                >
                  {s.tabLabel}
                </button>
              ))}
            </div>

            {/* Chasis del Teléfono */}
            <div className="w-full max-w-[420px] bg-[#0c1317] rounded-[32px] p-3 shadow-2xl border border-slate-800 ring-1 ring-emerald-500/20">
              {/* Pantalla */}
              <div className="bg-[#0b141a] rounded-[24px] overflow-hidden flex flex-col min-h-[460px] text-slate-100 shadow-inner">
                
                {/* Header de WhatsApp */}
                <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        SS
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#202c33] rounded-full"></span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                        Santisoft Agentes
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-normal">BOT</span>
                      </h4>
                      <p className="text-[11px] text-emerald-400 font-medium">en línea</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span className="cursor-pointer hover:text-white">📞</span>
                    <span className="cursor-pointer hover:text-white">⋮</span>
                  </div>
                </div>

                {/* Área de Mensajes */}
                <div className="flex-1 p-4 flex flex-col justify-end gap-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
                  
                  {/* Banner de encriptación */}
                  <div className="text-center my-1">
                    <span className="inline-block bg-[#182229] text-amber-300/80 text-[10px] px-2.5 py-1 rounded-md shadow-sm border border-amber-500/10">
                      🔒 Vinculado seguro a tu cuenta de Santisoft
                    </span>
                  </div>

                  {/* Mensaje del Usuario */}
                  <div className="self-end max-w-[85%] bg-[#005c4b] text-white rounded-2xl rounded-tr-xs p-3 shadow-md">
                    <p className="text-xs sm:text-sm">{currentScenario.userText}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200/80">
                      <span>{currentScenario.userTime}</span>
                      <span className="text-emerald-300 font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Respuesta del Bot */}
                  <div className="self-start max-w-[92%] bg-[#202c33] text-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-md border border-white/5 transition-all animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs sm:text-[13px] leading-relaxed">
                      {currentScenario.botReply}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-400">
                      <span>{currentScenario.botTime}</span>
                    </div>
                  </div>
                </div>

                {/* Barra de entrada simulada */}
                <div className="bg-[#202c33] px-3 py-2.5 flex items-center gap-2 border-t border-white/5 text-slate-400">
                  <span className="text-base cursor-pointer">😊</span>
                  <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 text-xs text-slate-300">
                    Escribe un número (0-7)...
                  </div>
                  <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs cursor-pointer">
                    ➤
                  </span>
                </div>

              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 font-mono">
              <span className="text-emerald-500">●</span> Simulación en vivo · Prueba las pestañas superiores
            </p>

          </div>

          {/* Columna Derecha: Tarjetas de Beneficios Clave */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Beneficio 1 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Aprobación en 1 toque
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Nuestros agentes redactan y calendarizan tu mes. Te mandan el resumen a WhatsApp y con responder <strong>6</strong> autorizas las publicaciones. Cero fricción.
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficio 2 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  ✍️
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Crea publicaciones sobre la marcha
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    ¿Se te ocurrió una promo o tienes una novedad urgente? Mándala por WhatsApp con la opción <strong>4</strong> y nuestros agentes te devuelven el copy listo para publicar.
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficio 3 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  📡
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Radar de Nicho en tu bolsillo
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    ¿Te quedaste sin ideas? Opción <strong>3</strong> y recibes las tendencias y preguntas reales que tu audiencia está buscando en este momento.
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficio 4 */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  🏢
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Multi-marca en el mismo chat
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Si manejas dos o más marcas, saltas entre ellas con el comando <strong>7</strong>. Todo ordenado, sin cerrar sesión ni cambiar de ventana.
                  </p>
                </div>
              </div>
            </div>

            {/* Callout diferenciador */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  Diferenciador Exclusivo
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Ninguna plataforma en LATAM te permite mandar en tus redes directo desde WhatsApp.
                </span>
              </div>
              <Link
                href="/registro?plan=free"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
              >
                Pruébalo gratis
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
