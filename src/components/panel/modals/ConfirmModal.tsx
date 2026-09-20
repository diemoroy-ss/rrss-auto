"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  desc: string;
  confirmText: string;
  cancelText: string;
  isDanger: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  secondaryAction?: { text: string; onClick: () => void };
}

export default function ConfirmModal({
  isOpen, title, desc, confirmText, cancelText, isDanger, onConfirm, onCancel, secondaryAction
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white rounded-[24px] shadow-2xl relative z-10 w-full max-w-sm p-8 text-center animate-in zoom-in-95 fade-in duration-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 border border-slate-100">
          {isDanger ? '⚠️' : '🤔'}
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm font-medium mb-8">{desc}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`py-3.5 rounded-xl font-bold shadow-sm transition-colors ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'
            }`}
          >
            {confirmText}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="py-3 text-indigo-600 font-bold hover:bg-indigo-50 border-2 border-indigo-100 rounded-xl transition-colors"
            >
              {secondaryAction.text}
            </button>
          )}
          <button onClick={onCancel} className="py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
