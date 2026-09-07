"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import SantisoftLogo from "../../components/SantisoftLogo";

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_TYPES = [
  { value: "business_owner",    label: "Dueño de negocio / PyME",               desc: "Quiero clientes y presencia profesional sin complicarme", icon: "🏪" },
  { value: "content_creator",   label: "Creador de contenido / Marca Personal",  desc: "Busco visibilidad, comunidad y audiencia constante", icon: "📱" },
  { value: "marketing_team",    label: "Equipo de marketing en empresa",          desc: "Automatizar la operativa diaria de redes", icon: "🏢" },
  { value: "agency",            label: "Agencia / Consultor digital",             desc: "Gestionar varias marcas y generar volumen con calidad", icon: "🎯" },
  { value: "ecommerce",         label: "Tienda online / E-commerce",              desc: "Promocionar catálogo y convertir visitas en compras", icon: "🛒" },
];

const INDUSTRIES = [
  { value: "Gastronomía y Alimentación",    icon: "🍕", hint: "Fotos apetitosas, ofertas del día y platos estrella" },
  { value: "Salud, Fitness y Bienestar",    icon: "🏋️", hint: "Consejos, testimonios y transformación de clientes" },
  { value: "Belleza y Cuidado Personal",    icon: "💆", hint: "Resultados visibles, estética y confianza" },
  { value: "Educación y Capacitación",      icon: "🎓", hint: "Contenido de alto valor, tips y autoridad" },
  { value: "Inmobiliaria y Bienes Raíces",  icon: "🏠", hint: "Propiedades destacadas, tours y estilo de vida" },
  { value: "Servicios Profesionales",       icon: "⚖️", hint: "Credibilidad, resolución de problemas y contacto directo" },
  { value: "Tecnología y Software",         icon: "💻", hint: "Soluciones modernas, novedades y demostraciones" },
  { value: "Comercio y Retail",             icon: "🛍️", hint: "Lanzamientos, promociones y experiencia de compra" },
  { value: "Turismo y Viajes",              icon: "✈️", hint: "Destinos inspiradores, tips de viaje y escapadas" },
  { value: "Arte, Diseño y Creatividad",    icon: "🎨", hint: "Proceso creativo, identidad visual y portfolio" },
  { value: "Otro",                          icon: "✏️", hint: "Tus agentes adaptarán su lenguaje a tu rubro específico" },
];

const GOALS = [
  { value: "Crecer mi audiencia",            desc: "Más seguidores, interacción y alcance orgánico constante", icon: "🚀" },
  { value: "Generar ventas directas",        desc: "Convertir seguidores en clientes por mensaje y WhatsApp", icon: "💰" },
  { value: "Fidelizar clientes actuales",    desc: "Mantener a tu comunidad activa y conectada con tu marca", icon: "🤝" },
  { value: "Posicionarme como experto",      desc: "Generar reputación, autoridad y respeto en tu sector", icon: "🏆" },
  { value: "Crecer en todos los frentes",    desc: "Estrategia integral: visibilidad, interacción y ventas", icon: "📣" },
];

const PLATFORMS = [
  { value: "Instagram",   icon: "📸", badge: "Reels & Carruseles", tag: "Recomendado" },
  { value: "Facebook",    icon: "👥", badge: "Página & Comunidad", tag: "Recomendado" },
  { value: "TikTok",      icon: "🎵", badge: "Videos Cortos & Tendencias", tag: "" },
  { value: "YouTube",     icon: "▶️", badge: "Shorts & Videos", tag: "" },
  { value: "Twitter / X", icon: "𝕏",  badge: "Posts & Novedades", tag: "" },
];

const TONES = [
  { value: "Cercano y divertido",    desc: "Cálido, espontáneo y natural, como hablar con un amigo", icon: "😄" },
  { value: "Profesional y formal",   desc: "Serio, confiable, institucional y respetuoso", icon: "💼" },
  { value: "Dinámico y urgente",     desc: "Enérgico, vendedor, directo al grano y enfocado en acción", icon: "⚡" },
  { value: "Cálido y empático",      desc: "Humano, comprensivo y enfocado en escuchar a la persona", icon: "🤝" },
  { value: "Directo al punto",       desc: "Sin rodeos ni relleno, claro, didáctico y contundente", icon: "🎯" },
];

const LOADING_STEPS = [
  "Creando el perfil de tu marca",
  "Sincronizando agentes de redacción y diseño",
  "Preparando los pilares de tu estrategia",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingData = {
  userType: string;
  rubro: string;
  rubroCustom: string;
  goal: string;
  platforms: string[];
  tone: string;
  businessDescription: string;
  website: string;
  noWebsite: boolean;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionCard({
  icon,
  label,
  desc,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
        selected
          ? "border-[#FF6B00] bg-orange-50/50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
          selected
            ? "bg-[#FF6B00] text-white shadow-xs"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${selected ? "text-[#C43E00]" : "text-slate-900"}`}>
          {label}
        </p>
        {desc && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{desc}</p>
        )}
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          selected ? "border-[#FF6B00] bg-[#FF6B00]" : "border-slate-300"
        }`}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}

function CheckCard({
  icon,
  label,
  badge,
  tag,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  badge?: string;
  tag?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
        selected
          ? "border-[#FF6B00] bg-orange-50/50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
          selected
            ? "bg-[#FF6B00] text-white shadow-xs"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold truncate ${selected ? "text-[#C43E00]" : "text-slate-900"}`}>
            {label}
          </p>
          {tag && (
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {tag}
            </span>
          )}
        </div>
        {badge && (
          <span className="text-xs text-slate-500 mt-0.5 block truncate">
            {badge}
          </span>
        )}
      </div>
      <div
        className={`w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${
          selected ? "border-[#FF6B00] bg-[#FF6B00]" : "border-slate-300"
        }`}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Step Screens ─────────────────────────────────────────────────────────────

function WelcomeStep({ onNext, userName }: { onNext: () => void; userName: string }) {
  // If the registered name is too generic, short, or an email prefix, use a warm greeting
  const isGeneric = !userName || /^(home|admin|user|usuario|test|owner|grupo|null|undefined)$/i.test(userName.trim());
  const greeting = isGeneric ? "¡Te damos la bienvenida!" : `¡Hola, ${userName.split(" ")[0]}!`;

  return (
    <div className="text-center py-2">
      {/* Wave Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#C43E00] text-xs font-extrabold uppercase tracking-wide mb-4">
        <span className="text-sm animate-wave inline-block origin-[70%_70%]">👋</span>
        <span>Configuración en 60 segundos</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
        {greeting}
      </h1>

      <p className="text-slate-600 text-sm leading-relaxed max-w-[420px] mx-auto mb-6">
        Configuremos tu marca para que tus agentes creen publicaciones, imágenes y videos con tu verdadero estilo.
      </p>

      {/* Agents Intro Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <span>👥</span>
          <span>Tus 3 agentes asignados</span>
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-base shrink-0 font-bold">✍️</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900">Agente Redactor</p>
              <p className="text-xs text-slate-500 truncate">Aprende el tono de tu voz para redactar copys naturales</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center text-base shrink-0 font-bold">🎨</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900">Agente Visual</p>
              <p className="text-xs text-slate-500 truncate">Diseña imágenes y banners respetando tus colores</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-base shrink-0 font-bold">🎬</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900">Agente de Video</p>
              <p className="text-xs text-slate-500 truncate">Guioniza y produce Reels verticales con locución</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full bg-[#FF6B00] hover:bg-[#E05300] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
      >
        <span>Comenzar a configurar mi marca</span>
        <span>→</span>
      </button>

      <p className="text-xs text-slate-500 mt-3">
        Solo unas preguntas rápidas · Podrás modificar todo después en tu panel
      </p>
    </div>
  );
}

function UserTypeStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">¿Cómo es tu negocio?</h2>
        <p className="text-slate-600 text-sm">Así tus agentes calibran la estructura de cada publicación.</p>
      </div>
      <div className="space-y-2.5">
        {USER_TYPES.map((t) => (
          <OptionCard
            key={t.value}
            icon={t.icon}
            label={t.label}
            desc={t.desc}
            selected={data.userType === t.value}
            onClick={() => setData((d) => ({ ...d, userType: t.value }))}
          />
        ))}
      </div>
    </div>
  );
}

function IndustryStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  const selectedInd = INDUSTRIES.find(i => i.value === data.rubro);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">¿En qué industria opera tu marca?</h2>
        <p className="text-slate-600 text-sm">Esto le enseña a tus agentes el vocabulario y contexto de tu rubro.</p>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {INDUSTRIES.map((ind) => (
          <OptionCard
            key={ind.value}
            icon={ind.icon}
            label={ind.value}
            selected={data.rubro === ind.value}
            onClick={() => setData((d) => ({ ...d, rubro: ind.value }))}
          />
        ))}
      </div>

      {data.rubro === "Otro" ? (
        <input
          type="text"
          placeholder="Escribe tu rubro (ej: Veterinaria, Centro Médico, etc.)"
          value={data.rubroCustom}
          onChange={(e) => setData((d) => ({ ...d, rubroCustom: e.target.value }))}
          className="mt-3 w-full px-4 py-3 bg-white border-2 border-orange-300 rounded-xl text-sm text-slate-900 focus:border-[#FF6B00] outline-none font-medium"
          autoFocus
        />
      ) : selectedInd?.hint ? (
        <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200 flex items-center gap-2 text-xs text-[#C43E00] font-medium">
          <span>💡</span>
          <span>{selectedInd.hint}</span>
        </div>
      ) : null}
    </div>
  );
}

function GoalStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">¿Qué quieres lograr en redes sociales?</h2>
        <p className="text-slate-600 text-sm">Tu objetivo principal para los próximos 30 días.</p>
      </div>
      <div className="space-y-2.5">
        {GOALS.map((g) => (
          <OptionCard
            key={g.value}
            icon={g.icon}
            label={g.value}
            desc={g.desc}
            selected={data.goal === g.value}
            onClick={() => setData((d) => ({ ...d, goal: g.value }))}
          />
        ))}
      </div>
    </div>
  );
}

function PlatformsStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  const toggle = (value: string) => {
    setData((d) => ({
      ...d,
      platforms: d.platforms.includes(value)
        ? d.platforms.filter((p) => p !== value)
        : [...d.platforms, value],
    }));
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">¿En qué canales quieres tener presencia?</h2>
        <p className="text-slate-600 text-sm">Elige todas las redes que te interesen. Tus agentes adaptarán los formatos.</p>
      </div>
      <div className="space-y-2.5">
        {PLATFORMS.map((p) => (
          <CheckCard
            key={p.value}
            icon={p.icon}
            label={p.value}
            badge={p.badge}
            tag={p.tag}
            selected={data.platforms.includes(p.value)}
            onClick={() => toggle(p.value)}
          />
        ))}
      </div>
    </div>
  );
}

function ToneStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">¿Cómo quieres que suene tu marca?</h2>
        <p className="text-slate-600 text-sm">El tono de voz que usará tu agente redactor en cada post.</p>
      </div>
      <div className="space-y-2.5">
        {TONES.map((t) => (
          <OptionCard
            key={t.value}
            icon={t.icon}
            label={t.value}
            desc={t.desc}
            selected={data.tone === t.value}
            onClick={() => setData((d) => ({ ...d, tone: t.value }))}
          />
        ))}
      </div>
    </div>
  );
}

function DescriptionStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">Cuéntanos sobre tu negocio</h2>
        <p className="text-slate-600 text-sm">
          Describe en un par de líneas qué ofreces y a quién ayudas. Es la base de todo lo que tus agentes generen.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>Descripción del negocio *</span>
            <span className="text-xs font-normal text-slate-500">
              {data.businessDescription.length}/300
            </span>
          </label>
          <textarea
            rows={4}
            placeholder="Ej: Somos una cafetería de especialidad en Providencia. Ofrecemos café de origen, repostería artesanal y desayunos para profesionales y vecinos del sector..."
            value={data.businessDescription}
            onChange={(e) => setData((d) => ({ ...d, businessDescription: e.target.value.slice(0, 300) }))}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 focus:border-[#FF6B00] outline-none resize-none font-medium leading-relaxed"
          />
          <p className="text-xs text-slate-500 mt-1">
            Mínimo 10 caracteres. Entre más claro seas, mejores serán las publicaciones.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 block">
            Sitio web o enlace (opcional)
          </label>
          <input
            type="url"
            placeholder="https://tumarcachile.cl"
            value={data.website}
            disabled={data.noWebsite}
            onChange={(e) => setData((d) => ({ ...d, website: e.target.value }))}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 focus:border-[#FF6B00] outline-none disabled:opacity-40 disabled:bg-slate-100 font-medium"
          />
          <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.noWebsite}
              onChange={(e) =>
                setData((d) => ({ ...d, noWebsite: e.target.checked, website: "" }))
              }
              className="w-4 h-4 rounded accent-[#FF6B00]"
            />
            <span className="text-xs font-medium text-slate-600">Por ahora no tengo sitio web</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ loadingStep }: { loadingStep: number }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-6 relative">
        <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-[#FF6B00] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">✨</div>
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
        Preparando el espacio de tu marca
      </h2>
      <p className="text-slate-600 text-sm mb-8">
        Tus agentes están procesando tu información para arrancar...
      </p>

      <div className="space-y-3 text-left max-w-[320px] mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
        {LOADING_STEPS.map((s, i) => {
          const done = loadingStep > i;
          const active = loadingStep === i;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 transition-all duration-200 ${
                done ? "opacity-100" : active ? "opacity-90" : "opacity-40"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                    ? "bg-[#FF6B00] text-white"
                    : "bg-slate-300 text-slate-500"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : active ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                )}
              </div>
              <span className={`text-xs font-bold ${done ? "text-slate-900" : active ? "text-[#C43E00]" : "text-slate-500"}`}>
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 7; // steps 1-6 are questions, 7 is loading (0 is welcome)

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "free";
  const billing = searchParams.get("billing") || "mensual";

  const [step, setStep] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const [data, setData] = useState<OnboardingData>({
    userType: "",
    rubro: "",
    rubroCustom: "",
    goal: "",
    platforms: ["Instagram", "Facebook"],
    tone: "",
    businessDescription: "",
    website: "",
    noWebsite: false,
  });

  // ── Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/registro");
        return;
      }
      setUser(u);

      // Check if already onboarded
      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          if (d.onboardingCompleted) {
            router.push("/automatizacion-rrss/panel");
            return;
          }
          setUserName(d.name || u.displayName || "");
        }
      } catch (e) {
        console.error(e);
      }

      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  // ── Loading step animation + save trigger
  useEffect(() => {
    if (step !== 7) return;

    const run = async () => {
      await delay(700);
      setLoadingStep(1);
      await delay(900);
      setLoadingStep(2);
      await delay(900);
      setLoadingStep(3);
      await delay(600);
      await handleSave();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleSave = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        let profiles: any[] = userData.profiles || [];

        const effectiveRubro =
          data.rubro === "Otro" ? data.rubroCustom.trim() || "Otro" : data.rubro;

        // Find or create default profile
        let idx = profiles.findIndex((p: any) => p.id === "default");
        if (idx === -1) {
          profiles.push({
            id: "default",
            name: userData.company || userData.name || "Mi Cuenta Principal",
            icon: "🏢",
          });
          idx = profiles.length - 1;
        }

        // Patch with onboarding data (visible in Configuración → Marca y Contacto)
        profiles[idx] = {
          ...profiles[idx],
          name: profiles[idx].name || userData.company || userData.name || "Mi Cuenta Principal",
          rubro: effectiveRubro,
          businessDescription: data.businessDescription.trim(),
          ...(data.website && !data.noWebsite ? { website: data.website.trim() } : {}),
          ...(userData.phone && !profiles[idx].phone ? { phone: userData.phone } : {}),
          ...(userData.email && !profiles[idx].email ? { email: userData.email } : {}),
        };

        await updateDoc(userDocRef, {
          profiles,
          ...(data.website && !data.noWebsite ? { website: data.website.trim() } : {}),
          rubro: effectiveRubro,
          businessDescription: data.businessDescription.trim(),
          userType: data.userType,
          preferredPlatforms: data.platforms,
          goal: data.goal,
          preferredTone: data.tone,
          onboardingCompleted: true,
          onboardingCompletedAt: serverTimestamp(),
        });
      }

      // ── Final redirect
      if (!plan || plan === "free") {
        router.push("/automatizacion-rrss/panel");
      } else {
        const res = await fetch("/api/payments/mercadopago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan,
            userId: user.uid,
            userEmail: user.email,
            isAnnual: billing === "anual",
          }),
        });
        const payData = await res.json();
        if (payData.url) {
          window.location.href = payData.url;
        } else {
          router.push("/automatizacion-rrss/panel");
        }
      }
    } catch (err) {
      console.error("[Onboarding] Save error:", err);
      router.push("/automatizacion-rrss/panel");
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return !!data.userType;
      case 2:
        return !!data.rubro && (data.rubro !== "Otro" || data.rubroCustom.trim().length > 0);
      case 3: return !!data.goal;
      case 4: return data.platforms.length > 0;
      case 5: return !!data.tone;
      case 6: return data.businessDescription.trim().length >= 10;
      default: return false;
    }
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };
  const prevStep = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Progress: steps 1-6 shown in bar (step 0 = welcome, step 7 = saving)
  const progress = step === 0 ? 0 : Math.round((Math.min(step, 6) / 6) * 100);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: "#F8FAFC", color: "#0F172A" }}
      className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8"
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-lg flex items-center justify-between py-4">
        <SantisoftLogo
          markSize={28}
          textColor="#0F172A"
          showSubText={true}
          subText="REDES & CONTENIDO"
        />
        {step > 0 && step < TOTAL_STEPS && (
          <div className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
            Paso {step} de 6
          </div>
        )}
      </header>

      {/* Center Content Container */}
      <div className="w-full max-w-lg my-auto flex flex-col items-center">
        {/* Progress Bar (Visible on steps 1-6) */}
        {step > 0 && step < TOTAL_STEPS && (
          <div className="w-full mb-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2 px-1">
              <button
                type="button"
                onClick={prevStep}
                className="hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>Atrás</span>
              </button>
              <span className="text-[#C43E00]">
                {progress}% completado
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B00] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Card: Solid White, crisp high contrast */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/90 w-full p-6 sm:p-8">
          {step === 0 && <WelcomeStep onNext={nextStep} userName={userName} />}
          {step === 1 && <UserTypeStep data={data} setData={setData} />}
          {step === 2 && <IndustryStep data={data} setData={setData} />}
          {step === 3 && <GoalStep data={data} setData={setData} />}
          {step === 4 && <PlatformsStep data={data} setData={setData} />}
          {step === 5 && <ToneStep data={data} setData={setData} />}
          {step === 6 && <DescriptionStep data={data} setData={setData} />}
          {step === TOTAL_STEPS && <LoadingStep loadingStep={loadingStep} />}

          {/* Next button (shown on steps 1-6) */}
          {step > 0 && step < TOTAL_STEPS && (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="mt-6 w-full bg-[#FF6B00] hover:bg-[#E05300] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{step === 6 ? "Completar configuración" : "Continuar"}</span>
              <span>→</span>
            </button>
          )}
        </div>

        {/* Skip button on early steps */}
        {step > 0 && step < 4 && (
          <button
            type="button"
            onClick={() => router.push("/automatizacion-rrss/panel")}
            className="mt-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Saltar por ahora y configurar en el panel
          </button>
        )}
      </div>

      {/* Footer minimal info */}
      <footer className="py-4 text-center text-xs text-slate-500">
        Santisoft Automatización · Configuración asistida por agentes
      </footer>

      {/* Wave animation */}
      <style jsx global>{`
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg); }
          20%, 60% { transform: rotate(18deg); }
          40%, 80% { transform: rotate(-14deg); }
        }
        .animate-wave {
          display: inline-block;
          animation: wave-hand 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
