"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PromoModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenPromo = localStorage.getItem('santisoft_promo_seen');
    if (hasSeenPromo) return;

    // Activar con exit-intent (cuando el cursor sale hacia arriba del documento)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setIsOpen(true);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    // Fallback: mostrar a los 10s si el usuario no mueve el cursor fuera
    const fallbackTimer = setTimeout(() => {
      setIsOpen(true);
      document.removeEventListener('mouseleave', handleMouseLeave);
    }, 10000);

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const closePromo = () => {
    setIsOpen(false);
    localStorage.setItem('santisoft_promo_seen', 'true');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
    >
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closePromo}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl shadow-indigo-500/20 transform animate-in fade-in zoom-in duration-300">

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -tr-10 -mr-10" aria-hidden="true"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -bl-10 -ml-10" aria-hidden="true"></div>

        <button
          onClick={closePromo}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/50 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          aria-label="Cerrar oferta"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="relative z-10 p-8 text-center pt-12">
           <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full text-4xl mb-6 shadow-inner ring-4 ring-white" aria-hidden="true">
              🎁
           </div>

           <h2 id="promo-modal-title" className="font-display text-3xl font-black text-slate-900 mb-4 tracking-tight">
              Desbloquea 4 <br />
              <span className="text-emerald-600">Posteos Gratis</span>
           </h2>

           <p className="text-slate-500 mb-8 font-medium">
             Regístrate ahora y nuestra Inteligencia Artificial generará y publicará contenido increíble para tus redes sin ningún costo. ¡Recupera tu tiempo hoy!
           </p>

           <div className="space-y-3">
             <Link
                href="/login"
                onClick={closePromo}
                className="block w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
             >
                Reclamar mi Regalo
             </Link>
             <button
                onClick={closePromo}
                className="block w-full py-3 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors"
             >
                Quizás más tarde
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
