"use client";
import { useEffect, useState } from "react";

// This page is SERVER side for data fetching
export default function AnalyticsPage() {
  return <AnalyticsClient />;
}

function StatCard({ label, value, icon, sub, color = "indigo" }: { label: string; value: number | string; icon: string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${colors[color] || colors.indigo}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900">{value}</p>
        <p className="text-sm font-bold text-slate-700 mt-1">{label}</p>
        {sub && <p className="text-xs text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SimpleBar({ value, max, label, date }: { value: number; max: number; label: string; date: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-slate-400 w-20 shrink-0 uppercase tracking-widest">{date}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-black text-slate-700 w-8 text-right">{value}</span>
    </div>
  );
}

function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 bg-slate-200 rounded-xl"></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-[28px]"></div>)}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500">Error cargando analítica. Verifica la API.</p>;
  }

  const maxDay = Math.max(...(data.daily?.map((d: any) => d.count) || [1]), 1);

  return (
    <div className="max-w-[1200px] animate-in fade-in duration-500 space-y-10 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/30 text-white">📈</span>
          Analítica del Sitio
        </h1>
        <p className="text-slate-500 mt-3 font-medium text-lg max-w-2xl">
          Seguimiento de visitas a la página principal y uso de la aplicación. Datos en tiempo real desde Firestore.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="🏠" label="Visitas a la Landing" value={data.landing_views ?? 0} sub="Página principal" color="indigo" />
        <StatCard icon="🤖" label="Entradas al Panel" value={data.panel_views ?? 0} sub="Uso de la app" color="emerald" />
        <StatCard icon="📋" label="Demos Solicitadas" value={data.demo_requests ?? 0} sub="Formulario de demo" color="amber" />
        <StatCard icon="📅" label="Visitas Hoy" value={data.today ?? 0} sub="Cualquier evento" color="rose" />
      </div>

      {/* Chart + Breakdown Row */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        
        {/* Daily Chart */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-black text-slate-900 mb-8">Visitas Diarias (últimos 30 días)</h2>
          {data.daily?.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              Aún no hay datos suficientes para mostrar el gráfico.
            </div>
          ) : (
            <div className="space-y-3">
              {data.daily?.slice(-15).map((d: any, i: number) => (
                <SimpleBar key={i} date={d.date?.slice(5)} value={d.count} max={maxDay} label={d.date} />
              ))}
            </div>
          )}
        </div>

        {/* Event Breakdown */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-black text-slate-900 mb-6">Eventos por Página</h2>
          <div className="space-y-4">
            {data.by_page?.length === 0 && (
              <p className="text-slate-400 text-sm font-medium text-center py-4">Sin datos de páginas aún.</p>
            )}
            {data.by_page?.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.page}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.event}</p>
                </div>
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device Breakdown */}
      {data.by_device && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-black text-slate-900 mb-6">Dispositivos de Acceso</h2>
          <div className="flex flex-wrap gap-4">
            {data.by_device.map((item: any, i: number) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${i === 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <span className="text-2xl">{item.device === 'mobile' ? '📱' : '🖥️'}</span>
                <div>
                  <p className="text-sm font-black capitalize">{item.device}</p>
                  <p className="text-xs font-bold opacity-60">{item.count} visitas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-black text-slate-900 mb-6">Últimos 20 Eventos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Evento</th>
                <th className="text-left pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Página</th>
                <th className="text-left pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Dispositivo</th>
                <th className="text-left pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.recent?.map((ev: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{ev.event}</span>
                  </td>
                  <td className="py-3 font-medium text-slate-700">{ev.page}</td>
                  <td className="py-3 text-slate-500 font-medium">{ev.device === 'mobile' ? '📱 Móvil' : '🖥️ Desktop'}</td>
                  <td className="py-3 text-slate-400 font-medium text-xs">{new Date(ev.createdAt).toLocaleString('es-CL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
