"use client";

/**
 * BulkActionBar
 * Barra flotante que aparece cuando hay posts seleccionados.
 * Permite confirmar, desconfirmar y borrar en lote.
 */
interface BulkActionBarProps {
  selectedCount: number;
  onConfirm: () => void;
  onUnconfirm: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onConfirm,
  onUnconfirm,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 border border-white/10 pointer-events-auto">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
            Acciones Masivas
          </span>
          <span className="text-sm font-bold">{selectedCount} seleccionados</span>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <span>✅</span> Confirmar
          </button>
          <button
            onClick={onUnconfirm}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
          >
            <span>↩️</span> Desconfirmar
          </button>
          <button
            onClick={onDelete}
            className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-500/20"
          >
            <span>🗑️</span> Eliminar
          </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <button
          onClick={onClear}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/5 text-slate-400 hover:text-white"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
