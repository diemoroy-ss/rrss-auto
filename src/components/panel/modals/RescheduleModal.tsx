"use client";

interface RescheduleModalProps {
  isOpen: boolean;
  date: string;
  isSaving: boolean;
  onDateChange: (date: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function RescheduleModal({
  isOpen,
  date,
  isSaving,
  onDateChange,
  onSave,
  onClose,
}: RescheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative z-10">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
          🗓️
        </div>
        <h3 className="text-xl font-black text-center text-slate-900 tracking-tight mb-2">Reagendar Post</h3>
        <p className="text-sm text-slate-500 text-center font-medium mb-6">Modifica la fecha y hora de publicación. El motor se recalibrará al instante.</p>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-indigo-400 font-bold text-slate-700"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
