"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_TYPES = [
  { value: "business_owner",    label: "Dueño de negocio / PyME",               icon: "🏪" },
  { value: "content_creator",   label: "Creador de contenido / Marca Personal",  icon: "📱" },
  { value: "marketing_team",    label: "Equipo de marketing en empresa",          icon: "🏢" },
  { value: "agency",            label: "Agencia / Consultor digital",             icon: "🎯" },
  { value: "ecommerce",         label: "Tienda online / E-commerce",              icon: "🛒" },
];

const INDUSTRIES = [
  { value: "Gastronomía y Alimentación",    icon: "🍕" },
  { value: "Salud, Fitness y Bienestar",    icon: "🏋️" },
  { value: "Belleza y Cuidado Personal",    icon: "💆" },
  { value: "Educación y Capacitación",      icon: "🎓" },
  { value: "Inmobiliaria y Bienes Raíces",  icon: "🏠" },
  { value: "Servicios Profesionales",       icon: "⚖️" },
  { value: "Tecnología y Software",         icon: "💻" },
  { value: "Comercio y Retail",             icon: "🛍️" },
  { value: "Turismo y Viajes",              icon: "✈️" },
  { value: "Arte, Diseño y Creatividad",    icon: "🎨" },
  { value: "Otro",                          icon: "✏️" },
];

const GOALS = [
  { value: "Crecer mi audiencia",            desc: "Más seguidores y alcance orgánico",       icon: "🚀" },
  { value: "Generar ventas directas",        desc: "Clientes y conversiones desde redes",     icon: "💰" },
  { value: "Fidelizar clientes actuales",    desc: "Comunidad y retención",                   icon: "🤝" },
  { value: "Posicionarme como experto",      desc: "Autoridad y reputación de marca",         icon: "🏆" },
  { value: "Crecer en todos los frentes",    desc: "Crecimiento completo del embudo",         icon: "📣" },
];

const PLATFORMS = [
  { value: "Instagram",   icon: "📸", color: "bg-pink-50 border-pink-200" },
  { value: "Facebook",    icon: "👥", color: "bg-blue-50 border-blue-200" },
  { value: "TikTok",      icon: "🎵", color: "bg-slate-50 border-slate-200" },
  { value: "YouTube",     icon: "▶️", color: "bg-red-50 border-red-200" },
  { value: "Twitter / X", icon: "𝕏",  color: "bg-slate-50 border-slate-200" },
];

const TONES = [
  { value: "Cercano y divertido",    desc: "Como hablarle a un amigo",       icon: "😄" },
  { value: "Profesional y formal",   desc: "Serio, institucional",           icon: "💼" },
  { value: "Dinámico y urgente",     desc: "Energético, acción inmediata",   icon: "⚡" },
  { value: "Cálido y empático",      desc: "Cercano, de confianza",          icon: "🤝" },
  { value: "Directo al punto",       desc: "Sin rodeos, claro y conciso",    icon: "🎯" },
];

const LOADING_STEPS = [
  "Creando tu perfil de marca",
  "Configurando tus agentes de contenido",
  "Preparando tu primera estrategia",
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
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected
          ? "border-indigo-500 bg-indigo-50"
          : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
      }`}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${selected ? "text-indigo-700" : "text-slate-800"}`}>
          {label}
        </p>
        {desc && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{desc}</p>
        )}
      </div>
      <div
        className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
          selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
        }`}
      />
    </button>
  );
}

function CheckCard({
  icon,
  label,
  selected,
  onClick,
  colorClass,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected
          ? "border-indigo-500 bg-indigo-50"
          : `border-slate-100 hover:border-indigo-200 hover:bg-slate-50 ${colorClass ?? ""}`
      }`}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <p className={`text-sm font-semibold flex-1 ${selected ? "text-indigo-700" : "text-slate-800"}`}>
        {label}
      </p>
      <div
        className={`w-4 h-4 rounded-md border-2 shrink-0 transition-all flex items-center justify-center ${
          selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
        }`}
      >
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Step Screens ─────────────────────────────────────────────────────────────

function WelcomeStep({ onNext, userName }: { onNext: () => void; userName: string }) {
  return (
    <div className="text-center py-4">
      <div className="text-5xl mb-6">👋</div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">
        ¡Hola{userName ? `, ${userName.split(" ")[0]}` : ""}!
      </h1>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">
        Cuéntanos sobre tu marca para que nuestros agentes
        creen contenido perfecto desde el primer post.
      </p>
      <p className="text-xs text-slate-400 mb-8">⏱ Solo tardas 60 segundos</p>
      <button
        onClick={onNext}
        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all text-base"
      >
        Empezar →
      </button>
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
      <h2 className="text-xl font-black text-slate-900 mb-1">¿Cómo es tu negocio?</h2>
      <p className="text-slate-400 text-sm mb-6">Elige la opción que mejor te describe.</p>
      <div className="space-y-2">
        {USER_TYPES.map((t) => (
          <OptionCard
            key={t.value}
            icon={t.icon}
            label={t.label}
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
  return (
    <div>
      <h2 className="text-xl font-black text-slate-900 mb-1">¿En qué industria opera tu marca?</h2>
      <p className="text-slate-400 text-sm mb-6">Esto le dice a nuestros agentes cómo hablar de tu negocio.</p>
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
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
      {data.rubro === "Otro" && (
        <input
          type="text"
          placeholder="Ej: Veterinaria, Consultora, etc."
          value={data.rubroCustom}
          onChange={(e) => setData((d) => ({ ...d, rubroCustom: e.target.value }))}
          className="mt-3 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-indigo-500 outline-none"
          autoFocus
        />
      )}
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
      <h2 className="text-xl font-black text-slate-900 mb-1">¿Qué quieres lograr en redes sociales?</h2>
      <p className="text-slate-400 text-sm mb-6">Tu objetivo principal para los próximos 30 días.</p>
      <div className="space-y-2">
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
      <h2 className="text-xl font-black text-slate-900 mb-1">¿En qué redes quieres publicar?</h2>
      <p className="text-slate-400 text-sm mb-6">Puedes seleccionar varias.</p>
      <div className="space-y-2">
        {PLATFORMS.map((p) => (
          <CheckCard
            key={p.value}
            icon={p.icon}
            label={p.value}
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
      <h2 className="text-xl font-black text-slate-900 mb-1">¿Cómo quieres que suene tu marca?</h2>
      <p className="text-slate-400 text-sm mb-6">El tono que usarán nuestros agentes al escribir.</p>
      <div className="space-y-2">
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
      <h2 className="text-xl font-black text-slate-900 mb-1">Cuéntanos sobre tu negocio</h2>
      <p className="text-slate-400 text-sm mb-6">
        Describe en 2 líneas qué haces y para quién. Nuestros agentes lo usarán en cada contenido.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
            Descripción del negocio *
          </label>
          <textarea
            rows={3}
            placeholder="Ej: Somos una clínica dental en Santiago que ofrece tratamientos de blanqueamiento y ortodoncia para adultos y familias..."
            value={data.businessDescription}
            onChange={(e) => setData((d) => ({ ...d, businessDescription: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-indigo-500 outline-none resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {data.businessDescription.length}/300 caracteres
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
            Sitio web (opcional)
          </label>
          <input
            type="url"
            placeholder="https://tusitio.cl"
            value={data.website}
            disabled={data.noWebsite}
            onChange={(e) => setData((d) => ({ ...d, website: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-indigo-500 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.noWebsite}
              onChange={(e) =>
                setData((d) => ({ ...d, noWebsite: e.target.checked, website: "" }))
              }
              className="rounded accent-indigo-600"
            />
            <span className="text-xs text-slate-500">No tengo sitio web</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ loadingStep }: { loadingStep: number }) {
  return (
    <div className="text-center py-8">
      <div className="w-14 h-14 mx-auto mb-6 relative">
        <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-lg">⚙️</div>
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-6">
        Configurando tu espacio de automatización
      </h2>
      <div className="space-y-3 text-left max-w-[280px] mx-auto">
        {LOADING_STEPS.map((s, i) => {
          const done = loadingStep > i;
          const active = loadingStep === i;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 transition-all duration-300 ${
                done ? "opacity-100" : active ? "opacity-70" : "opacity-30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  done ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                {done ? (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : active ? (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <span className={`text-sm font-medium ${done ? "text-slate-700" : "text-slate-400"}`}>
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

const TOTAL_STEPS = 7; // steps 1-7 (0 is welcome)

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
    platforms: [],
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

  // Progress: steps 1-7 shown in bar (step 0 = welcome, no bar)
  const progress = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Top nav with progress bar */}
      {step > 0 && step < TOTAL_STEPS && (
        <div className="w-full max-w-[500px] mb-4 flex items-center gap-4">
          <button
            type="button"
            onClick={prevStep}
            className="text-sm text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 shrink-0 transition-colors"
          >
            ← Atrás
          </button>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-[500px] p-7 sm:p-8">
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
            className="mt-6 w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base"
          >
            {step === 6 ? "Finalizar →" : "Siguiente →"}
          </button>
        )}
      </div>

      {/* Skip link — only on early steps */}
      {step > 0 && step < 4 && (
        <button
          type="button"
          onClick={() => router.push("/automatizacion-rrss/panel")}
          className="mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Saltar y configurar después
        </button>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
