"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────
export type StepStatus = "pending" | "running" | "done" | "error";

export interface GeneratingStep {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  status: StepStatus;
}

interface GeneratingModalProps {
  isOpen: boolean;
  steps: GeneratingStep[];
  currentStepId: string | null;
  onCancel?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Spinner SVG animado
// ─────────────────────────────────────────────────────────────
function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Icono de estado por paso
// ─────────────────────────────────────────────────────────────
function StepIcon({ step }: { step: GeneratingStep }) {
  if (step.status === "done") {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (step.status === "error") {
    return (
      <div className="w-9 h-9 rounded-full bg-rose-100 border-2 border-rose-400 flex items-center justify-center shadow-sm">
        <span className="text-rose-600 text-base">✕</span>
      </div>
    );
  }

  if (step.status === "running") {
    return (
      <div className="w-9 h-9 rounded-full bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-pulse">
        <Spinner size={16} />
      </div>
    );
  }

  // pending
  return (
    <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400">
      <span className="text-base leading-none">{step.icon}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Partículas decorativas de fondo
// ─────────────────────────────────────────────────────────────
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <div
      className="absolute rounded-full bg-indigo-400/20 animate-ping"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: "2s",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Componente principal del modal
// ─────────────────────────────────────────────────────────────
export default function GeneratingModal({
  isOpen,
  steps,
  currentStepId,
  onCancel,
}: GeneratingModalProps) {
  const [dots, setDots] = useState(".");

  // Animación de puntos suspensivos
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = steps.find(s => s.id === currentStepId);
  const doneCount = steps.filter(s => s.status === "done").length;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" />

      {/* Partículas flotantes decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingParticle delay={0} size={8} x={15} y={20} />
        <FloatingParticle delay={0.5} size={5} x={80} y={15} />
        <FloatingParticle delay={1} size={10} x={60} y={75} />
        <FloatingParticle delay={1.5} size={6} x={25} y={70} />
        <FloatingParticle delay={0.3} size={7} x={90} y={50} />
        <FloatingParticle delay={0.8} size={4} x={40} y={30} />
      </div>

      {/* Modal card */}
      <div
        className="relative w-full max-w-md bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 pt-8 pb-10 overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-violet-400/20 rounded-full blur-xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Santisoft IA</p>
                <h3 className="text-white text-lg font-black tracking-tight leading-none mt-0.5">Generando tu diseño</h3>
              </div>
            </div>

            {/* Step actual */}
            <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3.5 border border-white/15">
              <p className="text-white font-bold text-sm leading-snug">
                {currentStep?.label || "Iniciando proceso"}{dots}
              </p>
              {currentStep?.sublabel && (
                <p className="text-white/70 text-[11px] font-medium mt-1">{currentStep.sublabel}</p>
              )}
            </div>

            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Progreso</span>
                <span className="text-white/80 text-[10px] font-black">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de pasos */}
        <div className="px-6 py-5 space-y-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3.5 py-2.5 px-3 rounded-2xl transition-all duration-300 ${
                step.status === "running"
                  ? "bg-indigo-50 border border-indigo-100"
                  : step.status === "done"
                  ? "bg-emerald-50/50"
                  : "bg-transparent"
              }`}
            >
              <StepIcon step={step} />

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold leading-snug truncate transition-colors ${
                    step.status === "running"
                      ? "text-indigo-700"
                      : step.status === "done"
                      ? "text-emerald-700"
                      : step.status === "error"
                      ? "text-rose-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.status === "running" && step.sublabel && (
                  <p className="text-indigo-500 text-[10px] font-medium mt-0.5">{step.sublabel}</p>
                )}
              </div>

              {/* Número de paso en estado pendiente */}
              {step.status === "pending" && (
                <span className="text-[10px] font-black text-slate-300 shrink-0">0{index + 1}</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 flex items-center gap-2.5">
            <div className="w-5 h-5 text-indigo-500 shrink-0">
              <Spinner size={16} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-snug">
              La IA está trabajando en tu diseño. Esto puede tomar entre 30 y 60 segundos.
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full text-center text-[11px] text-slate-400 hover:text-slate-600 font-semibold transition-colors py-1"
            >
              Cancelar proceso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
