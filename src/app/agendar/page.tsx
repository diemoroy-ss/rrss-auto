"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AgendarPage() {
  const router = useRouter();
  
  // Limitar fechas a días hábiles a partir de mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
  
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const timeSlots = [
    "10:00", "11:00", "12:00", "13:00", 
    "15:00", "16:00", "17:00", "18:00"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError("Por favor selecciona una fecha y una hora.");
      return;
    }
    
    const selectedDate = new Date(date + "T00:00:00");
    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
      setError("Por favor selecciona un día de Lunes a Viernes.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, date, time, notes })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Ocurrió un error al agendar.");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen flex flex-col">
      <nav>
        <div className="wrap">
          <Link href="/" className="logo">
            <img src="/favicon.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '6px' }} />
            SANTISOFT AI
          </Link>
          <div className="nav-links">
            <Link href="/#planes" className="ghost">Planes</Link>
            <Link href="/login" className="ghost">Acceso Cliente</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 font-sans mt-20 mb-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 flex flex-col md:flex-row gap-8">
          
          {/* Info Section */}
          <div className="md:w-1/3 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">📹</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 font-serif">Demostración Santisoft</h1>
            <div className="text-slate-500 text-sm flex flex-col gap-2">
              <p className="flex items-center gap-2"><span className="text-lg">⏱️</span> 30 min</p>
              <p className="flex items-center gap-2"><span className="text-lg">💻</span> Videollamada (Google Meet)</p>
            </div>
            <p className="text-slate-600 mt-4 text-sm leading-relaxed">
              Descubre cómo nuestra plataforma puede automatizar tus redes sociales y blog utilizando IA. 
              En esta sesión de 30 minutos te mostraremos el panel por dentro y responderemos tus dudas.
            </p>
          </div>

          {/* Form Section */}
          <div className="md:w-2/3">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 h-full animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 font-serif mb-4">¡Reunión Agendada!</h2>
                <p className="text-slate-500 mb-8 max-w-md">
                  Hemos enviado una confirmación a <strong>{email}</strong> con los detalles de nuestra llamada para el <strong>{date}</strong> a las <strong>{time}</strong>.
                </p>
                <Link href="/" className="btn btn-ghost border border-slate-200">Volver al inicio</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Selecciona Fecha y Hora</h2>
                
                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Día (Lun - Vie)</label>
                    <input 
                      type="date" 
                      min={minDate}
                      required 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      disabled={loading}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] outline-none" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Hora</label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          disabled={!date || loading}
                          className={`py-2 px-1 text-sm font-medium rounded-lg border transition-all ${
                            time === slot 
                              ? 'bg-[#DD4B19] text-white border-[#DD4B19]' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#DD4B19] disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>
                <h2 className="text-xl font-bold text-slate-800">Tus Datos</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Nombre</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Correo</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] outline-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Teléfono (Opcional)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] outline-none" placeholder="+56 9 1234 5678" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">¿De qué trata tu negocio? (Opcional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={loading} rows={2} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] outline-none resize-none" placeholder="Breve descripción para prepararnos..." />
                </div>

                <button type="submit" disabled={loading || !date || !time} className="mt-4 w-full bg-[#DD4B19] text-white font-bold py-4 rounded-xl hover:bg-[#c23e11] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                  ) : (
                    "Confirmar Agendamiento"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <span className="fmono"><span className="on-air"></span>© 2026 SANTISOFT. TODOS LOS DERECHOS RESERVADOS.</span>
          <div className="flinks">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
