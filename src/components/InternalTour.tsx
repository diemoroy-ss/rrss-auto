"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  path: string; // Ruta donde debe estar para ver el paso
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-dashboard-title',
    title: '¡Bienvenido a tu Panel!',
    content: 'Aquí verás el listado de todos los posts que Santisoft publicará automáticamente por ti.',
    path: '/automatizacion-rrss/panel'
  },
  {
    targetId: 'tour-calendar-widget',
    title: 'Visualiza tu Mes',
    content: 'Filtra tus publicaciones día a día usando este calendario interactivo y revisa qué formatos están agendados.',
    path: '/automatizacion-rrss/panel'
  },
  {
    targetId: 'tour-btn-new-post',
    title: 'Crea contenido nuevo',
    content: 'Cuando tengas una idea, haz clic aquí para abrir el generador inteligente.',
    path: '/automatizacion-rrss/panel'
  },
  {
    targetId: 'tour-step-type',
    title: 'Formatos de Publicación',
    content: 'Ahora puedes elegir crear un Post tradicional, una Historia, un Carrusel de varias imágenes, o incluso un Reel (video de 8s).',
    path: '/automatizacion-rrss/panel/crear'
  },
  {
    targetId: 'tour-step-idea',
    title: 'Dime tu Idea',
    content: 'Escribe aquí lo que quieres publicar. No te preocupes por el diseño o el texto final, la IA se encarga.',
    path: '/automatizacion-rrss/panel/crear'
  },
  {
    targetId: 'tour-step-datetime',
    title: 'Elige el Momento',
    content: 'Selecciona la fecha y hora exacta en la que quieres que el post salga al aire.',
    path: '/automatizacion-rrss/panel/crear'
  },
  {
    targetId: 'tour-step-networks',
    title: 'Selecciona Redes',
    content: 'Elige si quieres publicar en Facebook, Instagram o en ambas simultáneamente.',
    path: '/automatizacion-rrss/panel/crear'
  },
  {
    targetId: 'tour-step-submit',
    title: '¡Listo para el Despegue!',
    content: 'Haz clic aquí para programar tu post. El bot hará el resto del trabajo pesado.',
    path: '/automatizacion-rrss/panel/crear'
  }
];

export default function InternalTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: 0
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Recuperar estado si el usuario navegó durante el tour
    const activeStep = localStorage.getItem('santisoft_active_step');
    const isTourActive = localStorage.getItem('santisoft_tour_active') === 'true';

    if (isTourActive && activeStep !== null) {
      setCurrentStep(parseInt(activeStep));
      setIsVisible(true);
    } else {
      const hasSeenTour = localStorage.getItem('santisoft_internal_tour_done');
      if (!hasSeenTour) {
        startTour();
      }
    }
  }, []);

  // Update tooltip position when step changes
  useEffect(() => {
    if (isVisible && currentStep >= 0) {
      const step = TOUR_STEPS[currentStep];
      const timer = setTimeout(() => {
        const el = document.getElementById(step.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Decide placement
          let top = rect.bottom + 20;
          let left = rect.left + (rect.width / 2);
          let transform = 'translateX(-50%)';

          // If it overlaps the bottom of the screen, move it above the element
          if (top + 300 > window.innerHeight && rect.top - 20 - 300 > 0) {
             top = rect.top - 20;
             transform = 'translate(-50%, -100%)';
          }
          
          setTooltipStyle({
            top: `${top}px`,
            left: `${left}px`,
            transform,
            opacity: 1,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          });
          
          // Scroll into view gently
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
           // Fallback default center
           setTooltipStyle({
             top: '50%',
             left: '50%',
             transform: 'translate(-50%, -50%)',
             opacity: 1,
             transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
           });
        }
      }, 150); // slight delay to allow rendering
      return () => clearTimeout(timer);
    } else {
      setTooltipStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [currentStep, isVisible, pathname]);

  const startTour = () => {
    setCurrentStep(0);
    setIsVisible(true);
    localStorage.setItem('santisoft_tour_active', 'true');
    localStorage.setItem('santisoft_active_step', '0');
    // Asegurarse de empezar en el dashboard
    if (pathname !== TOUR_STEPS[0].path) {
        router.push(TOUR_STEPS[0].path);
    }
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextIdx = currentStep + 1;
      const nextStepObj = TOUR_STEPS[nextIdx];
      
      setCurrentStep(nextIdx);
      localStorage.setItem('santisoft_active_step', nextIdx.toString());

      // Navegar si el siguiente paso está en otra página
      if (nextStepObj.path !== pathname) {
        router.push(nextStepObj.path);
      }
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    setIsVisible(false);
    setCurrentStep(-1);
    localStorage.setItem('santisoft_internal_tour_done', 'true');
    localStorage.removeItem('santisoft_tour_active');
    localStorage.removeItem('santisoft_active_step');
  };

  if (!isVisible || currentStep === -1) {
    // Botón de ayuda flotante siempre visible
    return (
      <button 
        onClick={startTour}
        className="fixed bottom-6 left-6 w-12 h-12 bg-white text-indigo-600 rounded-full shadow-2xl border border-indigo-100 flex items-center justify-center text-xl hover:scale-110 transition-transform z-[80] group"
        title="Repetir Tutorial"
      >
        <span className="group-hover:rotate-12 transition-transform">❓</span>
      </button>
    );
  }

  const step = TOUR_STEPS[currentStep];
  const isWrongPath = step.path && pathname !== step.path;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Overlay Oscuro */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto z-[100]" onClick={finishTour} />
      
      {/* Tooltip */}
      <div 
        className="absolute w-full max-w-sm p-8 bg-white rounded-[32px] shadow-2xl pointer-events-auto border border-indigo-100 animate-in zoom-in z-[120]"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start mb-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
              Paso {currentStep + 1} de {TOUR_STEPS.length}
           </span>
           <button onClick={finishTour} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{step.title}</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
          {isWrongPath ? (
            <span className="text-amber-600 font-bold">⚠️ Debes estar en la sección adecuada para ver este paso.</span>
          ) : step.content}
        </p>

        <div className="flex items-center justify-between gap-4">
           <button 
             onClick={finishTour}
             className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
           >
             Saltar Tour
           </button>
           <button 
             onClick={nextStep}
             className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
           >
             {currentStep === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente Paso'}
           </button>
        </div>
      </div>

      {/* CSS para resaltar el elemento (simplificado) */}
      <style jsx global>{`
        #${step.targetId} {
          position: relative;
          z-index: 110 !important;
          outline: 4px solid #6366f1 !important;
          outline-offset: 4px;
          pointer-events: auto !important;
          background: white !important;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
