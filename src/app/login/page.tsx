"use client";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { auth, db, googleProvider } from "../../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginGastronomico() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect users who are already logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      // Si el usuario ya está autenticado, redirigirlo a su panel
      if (u) {
        if (typeof window !== "undefined" && !window.location.href.includes("tempAdminBypass")) {
           router.replace("/automatizacion-rrss/panel");
        }
      }
    });
    return () => unsub();
  }, [router]);

  const syncUserToDb = async (user: any, extraData: any = {}) => {
    // Check if user exists in Database (Users collection)
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let resolvedRole = "user";
    if (user.email === "admin@santisoft.cl" || user.email === "diemoroy@gmail.com") {
      resolvedRole = "admin";
    }

    // If it doesn't exist, create DB profile
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
         email: user.email,
         name: extraData.name || user.displayName || "Usuario Nuevo",
         phone: extraData.phone || "",
         company: extraData.company || "",
         role: resolvedRole,
         plan: "free",
         categoriesAllowed: ["all"],
         createdAt: serverTimestamp(),
         registeredApps: ["automatizacion"] // Marca el origen
      });
    } else {
      const data = userDoc.data();
      resolvedRole = data.role;
      
      // Si el usuario ya existe pero no tiene la marca de esta app, la agregamos
      const apps = data.registeredApps || [];
      if (!apps.includes("automatizacion")) {
        await updateDoc(userDocRef, {
          registeredApps: [...apps, "automatizacion"]
        });
      }

      // Force admin role for this specific email if not set
      if ((user.email === "admin@santisoft.cl" || user.email === "diemoroy@gmail.com") && resolvedRole !== "admin") {
         await updateDoc(userDocRef, { role: "admin" });
         resolvedRole = "admin";
      }

      // Force business plan for tester account automatically
      if (user.email === "santisoftai@gmail.com" && data.plan !== "business") {
         await updateDoc(userDocRef, { plan: "business" });
      }
    }
    return resolvedRole;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (email === "admin@santisoft.cl" && password === "123") {
        localStorage.setItem("tempAdminBypass", "true");
        router.push("/gastronomico/admin/plantillas");
        return;
      }

      if (isRegister) {
        // REGISTER FLOW
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserToDb(userCredential.user, { name, phone, company });
        await sendEmailVerification(userCredential.user);
        
        // Log out immediately to force them to verify email
        await auth.signOut();
        setSuccess("Cuenta creada exitosamente. Por favor revisa tu correo y verifica tu dirección antes de iniciar sesión.");
        setIsRegister(false); // Switch to login view
      } else {
        // LOGIN FLOW
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Require Email Verification
        if (!userCredential.user.emailVerified) {
          setError("Debes verificar tu correo electrónico antes de poder acceder.");
          await auth.signOut();
          setLoading(false);
          return;
        }

        const role = await syncUserToDb(userCredential.user);
        router.push("/automatizacion-rrss/panel");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
         setError("Este correo ya está registrado.");
      } else if (err.code === 'auth/invalid-credential') {
         setError("Credenciales incorrectas.");
      } else {
         setError(isRegister ? "Error al crear cuenta. Verifica los datos." : "Credenciales incorrectas o usuario no existe.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const role = await syncUserToDb(result.user);
      router.push("/automatizacion-rrss/panel");
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Error al iniciar sesión con Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-slate-900 text-white rounded-[20px] flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-slate-900/20">
             🤖
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Santisoft Automatización</h1>
           <p className="text-slate-500 mt-2 text-sm">{isRegister ? "Crea una cuenta para empezar" : "Inicia sesión para gestionar tus redes sociales."}</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-200">
          
          {error && (
            <div className="mb-6 bg-rose-50 text-rose-600 text-sm font-bold p-4 rounded-xl text-center border border-rose-100">
               {error}
            </div>
          )}
          {success && (
            <div className="mb-6 bg-emerald-50 text-emerald-600 text-sm font-bold p-4 rounded-xl text-center border border-emerald-100">
               {success}
            </div>
          )}

          {!isRegister && (
            <>
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm mb-6"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-slate-100 flex-1"/>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">O con correo</span>
                <div className="h-px bg-slate-100 flex-1"/>
              </div>
            </>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {isRegister && (
               <>
                 <div>
                   <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                   <input type="text" required value={name} onChange={e=>setName(e.target.value)} placeholder="Juan Pérez" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium transition-all" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Teléfono <span className="text-[9px] lowercase font-normal">(Opcional)</span></label>
                     <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+56 9 XXXXXXXX" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium transition-all" />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Empresa <span className="text-[9px] lowercase font-normal">(Opcional)</span></label>
                     <input type="text" value={company} onChange={e=>setCompany(e.target.value)} placeholder="Mi Local SpA" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium transition-all" />
                   </div>
                 </div>
               </>
            )}

            <div>
               <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
               <input 
                 type="email" 
                 required 
                 value={email}
                 onChange={e=>setEmail(e.target.value)}
                 placeholder="tucorreo@ejemplo.com"
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium transition-all"
               />
            </div>
            
            <div>
               <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contraseña</label>
               <input 
                 type="password" 
                 required 
                 value={password}
                 onChange={e=>setPassword(e.target.value)}
                 placeholder="••••••••"
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium transition-all"
               />
            </div>

            <button type="submit" disabled={loading || !email || !password || (isRegister && !name)}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex justify-center items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  {isRegister ? 'Registrando...' : 'Ingresando...'}
                </>
              ) : (isRegister ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </button>
          </form>

          <div className="mt-6 text-center">
             <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-indigo-600 text-sm font-bold hover:underline transition-all">
                {isRegister ? "¿Ya tienes cuenta? Inicia sesión aquí." : "¿No tienes cuenta? Regístrate aquí."}
             </button>
          </div>
          
        </div>

      </div>
    </div>
  )
}
