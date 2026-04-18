"use client";

import React from "react";

interface StatusModalProps {
  isOpen: boolean;
  type: "success" | "error" | "info" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function StatusModal({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
}: StatusModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: { emoji: "✅", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", btn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200" },
    error: { emoji: "⚠️", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", btn: "bg-rose-600 hover:bg-rose-500 shadow-rose-200" },
    info: { emoji: "ℹ️", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", btn: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200" },
    confirm: { emoji: "❓", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", btn: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200" },
  };

  const style = icons[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={type !== "confirm" ? onConfirm : onCancel}
      ></div>
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-300 border-2 border-slate-50">
          <div className={`p-10 text-center`}>
              <div className={`${style.bg} ${style.border} border-2 w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm`}>
                  {style.emoji}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">{title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
              
              <div className="mt-10 flex gap-4">
                  {type === "confirm" && (
                      <button 
                        onClick={onCancel}
                        className="flex-1 bg-white border-2 border-slate-100 text-slate-400 font-black py-4 px-6 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
                      >
                        {cancelText}
                      </button>
                  )}
                  <button 
                    onClick={onConfirm}
                    className={`flex-1 ${style.btn} text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-widest text-[10px]`}
                  >
                    {confirmText}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}
