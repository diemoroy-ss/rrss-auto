"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db, googleProvider } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import LogoMark from "../../../components/LogoMark";
import Link from "next/link";

const ADMIN_EMAILS = [
  "admin@santisoft.cl",
  "diemoroy@gmail.com",
  "spalezcom@gmail.com",
  "santisoftai@gmail.com",
];

export default function VendedoresLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal recuperar contraseña
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Redirigir si ya tiene sesión válida
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userEmail = (user.email || "").toLowerCase();

          // Regla explícita: santisoftai@gmail.com siempre permitida
          if (userEmail === "santisoftai@gmail.com") {
            router.replace("/vendedores");
            return;
          }

          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.data()?.role;
          const isAllowed =
            ADMIN_EMAILS.includes(userEmail) ||
            role === "admin" ||
            role === "vendedor";

          if (isAllowed) {
            router.replace("/vendedores");
          }
        } catch (e) {
          console.error("Error comprobando sesión de vendedor:", e);
        }
      }
    });
    return () => unsub();
  }, [router]);

  // LOGIN CON GOOGLE
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = (user.email || "").toLowerCase();

      // Regla especial: santisoftai@gmail.com SIEMPRE permitida
      if (userEmail === "santisoftai@gmail.com") {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            name: user.displayName || "Santisoft AI",
            email: userEmail,
            role: "admin",
            plan: "business",
            registeredApps: ["muestras", "vendedores", "automatizacion"],
            createdAt: serverTimestamp(),
          });
        }
        router.replace("/vendedores");
        return;
      }

      // 1. Verificar si existe perfil por UID
      const userDocRef = doc(db, "users", user.uid);
      let userDoc = await getDoc(userDocRef);
      let userData = userDoc.exists() ? userDoc.data() : null;

      // 2. Si no existe por UID, buscar si fue registrado por su email como vendedor
      if (!userData && userEmail) {
        const q = query(collection(db, "users"), where("email", "==", userEmail));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          userData = querySnap.docs[0].data();
          // Vincular el perfil a este UID de Google
          await setDoc(
            userDocRef,
            {
              ...userData,
              name: user.displayName || userData.name || "Vendedor",
              email: userEmail,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      const role = userData?.role;
      const isAllowed =
        ADMIN_EMAILS.includes(userEmail) ||
        role === "admin" ||
        role === "vendedor";

      if (!isAllowed) {
        // Bloquear inmediatamente y cerrar sesión
        await signOut(auth);
        setError(
          `El correo de Google (${userEmail}) no está registrado como vendedor. Solicita al administrador que te registre como vendedor para poder acceder.`
        );
        return;
      }

      // Si es un vendedor válido pero aún no tenía doc bajo su UID actual de Google
      if (!userDoc.exists()) {
        await setDoc(
          userDocRef,
          {
            name: user.displayName || "Vendedor",
            email: userEmail,
            role: role || "vendedor",
            plan: "free",
            registeredApps: ["muestras", "vendedores"],
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      router.replace("/vendedores");
    } catch (err: any) {
      console.error("[GoogleLogin] Error:", err);
      if (err.code === "auth/popup-blocked") {
        setError(
          "El navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes o ingresa con tu correo y contraseña."
        );
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(
          "No se pudo completar el inicio de sesión con Google. Si estás usando una app integrada (Instagram, TikTok), abre el enlace en Chrome o Safari."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // LOGIN CON CORREO Y CONTRASEÑA
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      const userEmail = (user.email || "").toLowerCase();

      // Regla especial: santisoftai@gmail.com SIEMPRE permitida
      if (userEmail === "santisoftai@gmail.com") {
        router.replace("/vendedores");
        return;
      }

      // Verificar rol
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.data()?.role;
      const isAllowed =
        ADMIN_EMAILS.includes(userEmail) ||
        role === "admin" ||
        role === "vendedor";

      if (!isAllowed) {
        await signOut(auth);
        setError(
          "Tu cuenta no tiene habilitado el rol de vendedor para esta mini app. Pídele al administrador que active tu acceso comercial."
        );
        return;
      }

      router.replace("/vendedores");
    } catch (err: any) {
      console.error("[VendedoresLogin] Error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Correo o contraseña incorrectos. Verifica tus credenciales.");
      } else if (err.code === "auth/invalid-email") {
        setError("Ingresa un correo electrónico válido.");
      } else {
        setError(err.message || "Error al iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({
        type: "error",
        message: "Ingresa tu correo para enviarte el enlace de recuperación.",
      });
      return;
    }
    setForgotLoading(true);
    setForgotStatus(null);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotStatus({
        type: "success",
        message: "Enlace enviado. Revisa tu bandeja de entrada o carpeta de spam.",
      });
    } catch (err: any) {
      setForgotStatus({
        type: "error",
        message: "No se pudo enviar el correo de recuperación. Revisa que el email sea correcto.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-lg shadow-indigo-500/10">
          <LogoMark size={44} />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold tracking-wider uppercase mb-2 border border-emerald-500/20">
          Acceso Comercial PWA
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
          Muestras Comerciales
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">
          Genera propuestas y demos exclusivas con nuestros agentes para tus prospectos
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* BOTÓN INGRESAR CON GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm shadow-md transition-all transform active:scale-[0.99] disabled:opacity-50 mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 relative">
              O con correo y contraseña
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendedor@empresa.com"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  ¿La olvidaste?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Ingresar a Muestras</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              ¿Eres cliente regular?{" "}
              <Link
                href="/login"
                className="text-indigo-400 font-semibold hover:underline"
              >
                Inicia sesión en el panel aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Info PWA */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            💡 Puedes instalar esta app en tu pantalla de inicio desde las opciones de tu navegador.
          </p>
        </div>
      </div>

      {/* MODAL RECUPERAR CONTRASEÑA */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Recuperar Contraseña
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa el correo con el que tienes acceso de vendedor y te enviaremos el enlace para restablecer tu clave.
            </p>

            {forgotStatus && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                  forgotStatus.type === "success"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                }`}
              >
                {forgotStatus.message}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white disabled:opacity-50"
                >
                  {forgotLoading ? "Enviando..." : "Enviar Enlace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
