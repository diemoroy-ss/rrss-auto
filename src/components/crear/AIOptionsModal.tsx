"use client";

import React from "react";

interface AIOptionsModalProps {
  isOpen: boolean;
  options: string[];
  onSelect: (option: string) => void;
  onRedo: () => void;
  onClose: () => void;
}

export default function AIOptionsModal({
  isOpen,
  options,
  onSelect,
  onRedo,
  onClose
}: AIOptionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-300 border-2 border-slate-50 flex flex-col max-h-[90vh]">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Opciones de IA</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecciona la que más te guste</p>
                  </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
          </div>

          <div className="p-8 overflow-y-auto space-y-6 flex-1">
              {options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => onSelect(opt)}
                    className="w-full text-left p-6 rounded-[24px] border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group relative animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                      <div className="absolute top-4 right-6 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-colors">
                          Opción {idx + 1}
                      </div>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed pr-12">
                          {opt}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Elegir esta opción</span>
                          <span>→</span>
                      </div>
                  </button>
              ))}
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button 
                onClick={onRedo}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-black py-4 px-6 rounded-2xl hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
              >
                <span>🔄</span> Rehacer Propuesta
              </button>
              <button 
                onClick={onClose}
                className="flex-1 bg-slate-900 text-white font-black py-4 px-6 rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]"
              >
                Cerrar
              </button>
          </div>
      </div>
    </div>
  );
}
