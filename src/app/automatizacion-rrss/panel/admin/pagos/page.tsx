"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../../lib/firebase";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { onAuthStateChanged } from "firebase/auth";

type Payment = {
  id: string;
  userId: string;
  userIdentifier: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  description: string;
  type: string;
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
         router.push("/automatizacion-rrss/panel");
         return;
      }

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch("/api/admin/payments", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
           setError(`Error ${res.status}: No tienes permisos suficientes para ver ingresos.`);
           return;
        }

        const data = await res.json();
        setPayments(data.payments);
      } catch (e: any) {
         console.error(e);
         setError(e.message || "Error al cargar la lista de pagos.");
      } finally {
         setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  // Calcular ingresos totales (simplificado)
  const totalRevenue = payments
    .filter(p => p.status === "approved" || p.status === "authorized")
    .reduce((acc, p) => acc + p.amount, 0);

  if (loading) return <div className="text-center font-bold text-slate-400 mt-20">Cargando transacciones...</div>;

  return (
    <div className="max-w-7xl mx-auto lg:mx-0">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Control de <span className="text-indigo-600">Ingresos.</span></h1>
          <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed italic">Monitoreo global de suscripciones y pagos de Santisoft.</p>
        </div>
        
        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl shadow-indigo-900/20 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Ingresos Totales (Histórico)</div>
                <div className="text-4xl font-black tracking-tighter">${totalRevenue.toLocaleString('es-CL')} <span className="text-sm text-slate-500 ml-1">CLP</span></div>
            </div>
        </div>
      </div>

      {error ? (
        <div className="p-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-sm border border-rose-100 animate-in fade-in slide-in-from-top-2">⚠️ {error}</div>
      ) : (
        <div className="premium-card !p-0 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                  <th className="p-6 px-8">Fecha</th>
                  <th className="p-6">Usuario</th>
                  <th className="p-6">Concepto</th>
                  <th className="p-6">Monto</th>
                  <th className="p-6">Tipo</th>
                  <th className="p-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50/30 transition-colors">
                     <td className="p-6 px-8 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{format(new Date(p.date), "dd MMM, yyyy", { locale: es })}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(p.date), "HH:mm 'hrs'")}</div>
                     </td>
                     <td className="p-6">
                        <div className="font-black text-slate-700 leading-tight">{p.userIdentifier}</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{p.userId}</div>
                     </td>
                     <td className="p-6">
                        <div className="text-xs font-bold text-slate-600">{p.description}</div>
                     </td>
                     <td className="p-6">
                        <div className="text-lg font-black text-slate-900">${p.amount.toLocaleString('es-CL')}</div>
                     </td>
                     <td className="p-6">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-bl-lg rounded-tr-lg border ${
                          p.type === 'preapproval' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100/50' 
                          : 'bg-slate-50 text-slate-700 border-slate-100/50'
                        }`}>
                          {p.type === 'preapproval' ? 'Suscripción' : 'Pago Directo'}
                        </span>
                     </td>
                     <td className="p-6 text-center">
                        {p.status === 'approved' || p.status === 'authorized' ? (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aprobado
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> {p.status}
                            </span>
                        )}
                     </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                   <tr>
                       <td colSpan={6} className="p-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">No existen registros de pagos registrados aún.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
