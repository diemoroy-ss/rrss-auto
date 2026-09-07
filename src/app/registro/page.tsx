"use client";
import { useState, useEffect, Suspense } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, db, googleProvider } from "../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LogoMark from "../../components/LogoMark";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "free";
  const billing = searchParams.get("billing") || "mensual";

  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setCurrentUser(u);
        setEmail(u.email || "");
        setName(u.displayName || "");
        
        // Verificar si ya tiene datos en DB
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.onboardingCompleted) {
            // Ya está registrado y completó onboarding, redirigir directo a MP o App
            await handlePostRegistration(u.uid, u.email || "", plan, billing === "anual");
          } else {
            // No ha completado onboarding
            router.push(`/onboarding?plan=${encodeURIComponent(plan)}&billing=${encodeURIComponent(billing)}`);
          }
        }
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, [plan, billing]);

  const handlePostRegistration = async (uid: string, userEmail: string, selectedPlan: string, isAnnual: boolean) => {
    if (selectedPlan === "free" || !selectedPlan) {
      router.push("/automatizacion-rrss/panel");
      return;
    }

    try {
      const res = await fetch("/api/payments/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          userId: uid,
          userEmail: userEmail,
          isAnnual: isAnnual
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Error al conectar con la pasarela de pago.");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message || "Error de red al procesar el pago.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let uid = "";
      let userEmail = "";

      if (currentUser) {
        uid = currentUser.uid;
        userEmail = currentUser.email || email;
      } else {
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        uid = creds.user.uid;
        userEmail = creds.user.email || email;
      }

      // Guardar en DB
      await setDoc(doc(db, "users", uid), {
        email: userEmail,
        name: name,
        phone: phone,
        company: company,
        role: "user",
        plan: "free", // MP webhook will upgrade this later if paid
        categoriesAllowed: ["all"],
        createdAt: serverTimestamp(),
        registeredApps: ["automatizacion"]
      }, { merge: true });

      // Redirigir al wizard de onboarding para configurar la marca
      router.push(`/onboarding?plan=${encodeURIComponent(plan)}&billing=${encodeURIComponent(billing)}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al registrarte.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      // El onAuthStateChanged detectará esto y nos pondrá en estado currentUser
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#DD4B19] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPaidPlan = plan !== "free";

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen flex flex-col">
      <BrandHeader />

      <div className="flex-1 flex items-center justify-center p-4 font-sans mt-20 mb-20">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 font-serif">
            {isPaidPlan ? "Completa tu registro para continuar" : "Crea tu cuenta gratis"}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {isPaidPlan 
              ? `Estás a un paso de activar tu plan ${plan.toUpperCase()}.` 
              : "Comienza a automatizar tus redes sociales en minutos."}
          </p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

        {!currentUser && (
          <button 
            type="button" 
            onClick={handleGoogle} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
        )}

        {!currentUser && (
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-400 font-medium">O CON CORREO</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Nombre completo</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:border-[#DD4B19] outline-none" />
          </div>

          {currentUser ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
              <input required type="email" value={email} disabled className="px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl outline-none cursor-not-allowed" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:border-[#DD4B19] outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:border-[#DD4B19] outline-none" />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Teléfono (WhatsApp)</label>
            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:border-[#DD4B19] outline-none" placeholder="+56 9 1234 5678" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Nombre de tu empresa / marca</label>
            <input required type="text" value={company} onChange={e => setCompany(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:border-[#DD4B19] outline-none" />
          </div>

          <button type="submit" disabled={loading} className="mt-4 w-full bg-[#DD4B19] text-white font-bold py-3.5 rounded-xl hover:bg-[#c23e11] transition-colors flex items-center justify-center">
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
            ) : (
              isPaidPlan ? "Continuar al Pago" : "Comenzar Gratis"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Al registrarte aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </div>
      </div>

      <BrandFooter />
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <RegistroContent />
    </Suspense>
  );
}
