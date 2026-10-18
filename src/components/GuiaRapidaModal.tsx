"use client";

import { useState } from "react";
import Link from "next/link";

interface GuiaRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepData {
  stepNumber: number;
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  points: { emoji: string; title: string; text: string }[];
  actionLink?: { href: string; label: string };
  tip: string;
}

const STEPS: StepData[] = [
  {
    stepNumber: 1,
    badge: "Paso 1 · Tu Negocio",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "⚙️",
    title: "Configura tu Marca y Redes Sociales",
    subtitle: "Conecta tus canales y define la identidad de tu negocio",
    description: "Para que las publicaciones salgan directamente en tus cuentas sin que tengas que intervenir manualmente, enlaza tus redes y sube tus logos.",
    points: [
      {
        emoji: "🔗",
        title: "Conexión de Cuentas",
        text: "Enlaza tus páginas oficiales de Facebook, perfiles de Instagram o cuentas de TikTok con un solo clic.",
      },
      {
        emoji: "🎨",
        title: "Identidad Visual",
        text: "Guarda tu logotipo y datos de contacto (WhatsApp, teléfono, dirección) para que aparezcan siempre en tus piezas.",
      },
      {
        emoji: "📍",
        title: "Acceso Rápido",
        text: "Puedes acceder a esta configuración en cualquier momento usando el nuevo icono de engranaje (⚙️) junto a tu Cuenta Activa en la barra superior.",
      },
    ],
    actionLink: {
      href: "/automatizacion-rrss/panel/configuracion",
      label: "Ir a Configuración de Marca →",
    },
    tip: "Una vez conectadas tus redes, nuestros agentes publicarán de manera 100% directa y automática.",
  },
  {
    stepNumber: 2,
    badge: "Paso 2 · Tu Oferta",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: "🛍️",
    title: "Carga tu Catálogo de Productos y Servicios",
    subtitle: "Tus productos reales son la base de las mejores publicaciones",
    description: "Alimenta tu catálogo con los productos estrella o servicios clave que ofreces. Nuestros agentes se encargarán de tomarlos como referencia exacta.",
    points: [
      {
        emoji: "📸",
        title: "Fotos Reales de tus Productos",
        text: "Sube fotos de tus platos, artículos o servicios. Nuestros agentes respetarán los detalles de tu producto al diseñar.",
      },
      {
        emoji: "🏷️",
        title: "Precios y Ofertas Claros",
        text: "Registra precios normales y promocionales. El sistema puede incluirlos automáticamente en los textos o en los afiches.",
      },
      {
        emoji: "⚡",
        title: "Creación en 1 Clic",
        text: "Al crear un post, solo eliges el producto de la lista y no tienes que volver a escribir de qué se trata.",
      },
    ],
    actionLink: {
      href: "/automatizacion-rrss/panel/catalogo",
      label: "Abrir Catálogo de Productos →",
    },
    tip: "Mantener tu catálogo actualizado hace que generar publicaciones tome apenas unos segundos.",
  },
  {
    stepNumber: 3,
    badge: "Paso 3 · Creación",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "✍️",
    title: "Dos Formas Claras de Crear Contenido",
    subtitle: "Elige el formato adecuado según el objetivo de tu publicación",
    description: "Hemos ordenado la creación en dos grandes caminos para que nunca haya dudas de qué formato estás diseñando:",
    points: [
      {
        emoji: "✨",
        title: "Publicación Estándar (Imagen, Carrusel, Historia o Reel)",
        text: "Diseño visual limpio, artístico o fotográfico sin textos encima de la imagen. El mensaje persuasivo y los hashtags van redactados directamente en el copy de la publicación.",
      },
      {
        emoji: "🎯",
        title: "Afiche / Diseño con Textos (Flyer Comercial)",
        text: "Carteles publicitarios donde los titulares de oferta, promociones, precios y llamadas a la acción se integran como capas editables directamente sobre el diseño visual.",
      },
      {
        emoji: "🎨",
        title: "Estilos Visuales con Foto Opcional",
        text: "Puedes elegir entre decenas de estilos artísticos. Si subes una foto base de tu producto, la anclamos; y si no la tienes, nuestros agentes la crean desde cero.",
      },
    ],
    actionLink: {
      href: "/automatizacion-rrss/panel/crear",
      label: "Probar el Generador de Posts →",
    },
    tip: "Si buscas una venta rápida de una oferta semanal, usa 'Afiche con Textos'. Si buscas engagement de marca, usa 'Publicación Estándar'.",
  },
  {
    stepNumber: 4,
    badge: "Paso 4 · Piloto Automático",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "📅",
    title: "Revisa tu Calendario y Activa el Piloto Automático",
    subtitle: "Tus publicaciones se agendan y publican en el horario ideal",
    description: "La tranquilidad de tener tu presencia en redes sociales resuelta semana a semana con consistencia y estrategia.",
    points: [
      {
        emoji: "📆",
        title: "Calendario de Próximos Posts",
        text: "Visualiza en qué días y horas saldrá cada publicación en Facebook, Instagram y TikTok.",
      },
      {
        emoji: "✏️",
        title: "Edición y Ajuste en Cualquier Momento",
        text: "Si quieres cambiar una palabra o cambiar la fecha de publicación, puedes editar cualquier post agendado con total libertad.",
      },
      {
        emoji: "🚀",
        title: "Publicación Automática",
        text: "Cuando llega la hora programada, el equipo de agentes despacha el contenido a tus redes sin que tengas que abrir la aplicación.",
      },
    ],
    actionLink: {
      href: "/automatizacion-rrss/panel",
      label: "Ver Próximos Posts →",
    },
    tip: "Con dedicarle 15 minutos a la semana a aprobar o crear posts, tu negocio mantendrá sus redes 100% activas y profesionales.",
  },
];

export default function GuiaRapidaModal({ isOpen, onClose }: GuiaRapidaModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/30 shrink-0">
              {currentStep.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentStep.badgeColor}`}>
                  {currentStep.badge}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {currentStepIndex + 1} de {STEPS.length}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors shrink-0"
            title="Cerrar guía"
          >
            ✕
          </button>
        </div>

        {/* Indicador de progreso (Dots) */}
        <div className="px-6 pt-4 flex items-center justify-center gap-2">
          {STEPS.map((step, idx) => (
            <button
              key={step.stepNumber}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? "w-8 bg-indigo-600"
                  : idx < currentStepIndex
                  ? "w-2 bg-indigo-300"
                  : "w-2 bg-slate-200"
              }`}
              title={`Ir al paso ${idx + 1}`}
            />
          ))}
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
            {currentStep.description}
          </p>

          {/* Tarjetas de puntos clave */}
          <div className="space-y-2.5">
            {currentStep.points.map((point, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150/80 flex items-start gap-3 hover:bg-indigo-50/40 transition-colors"
              >
                <span className="text-xl shrink-0 mt-0.5">{point.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">
                    {point.title}
                  </h4>
                  <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                    {point.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tip de agentes */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium flex items-start gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <div className="leading-relaxed">
              <strong className="font-bold">Consejo de nuestros agentes:</strong> {currentStep.tip}
            </div>
          </div>
        </div>

        {/* Barra de Acciones / Footer */}
        <div className="p-4 md:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {currentStep.actionLink ? (
            <Link
              href={currentStep.actionLink.href}
              onClick={onClose}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
            >
              {currentStep.actionLink.label}
            </Link>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 font-bold text-xs transition-all"
              >
                ← Anterior
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <span>{isLast ? "¡Listo, empezar a usar!" : "Siguiente"}</span>
              {!isLast && <span>→</span>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
