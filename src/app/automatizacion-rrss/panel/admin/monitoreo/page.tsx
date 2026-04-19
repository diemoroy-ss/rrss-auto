"use client";

import { useEffect, useState, useMemo } from "react";
import { auth } from "../../../../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { format, isBefore } from "date-fns";
import { es } from "date-fns/locale";

type AdminPost = {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  profileName: string;
  copy: string;
  type: string;
  networks: string[];
  status: string;
  generatedBy: string;
  scheduledFor: string | null;
  createdAt: string | null;
};

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("");

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
         router.push("/automatizacion-rrss/panel");
         return;
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSearch = async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/admin/posts", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           setError(`Error ${res.status}: ${errData.error || 'No tienes permisos suficientes.'}`);
           return;
        }

        const data = await res.json();
        setPosts(data.posts || []);
      } catch (e: any) {
         console.error(e);
         setError(e.message || "Error al cargar los posts.");
      } finally {
         setLoading(false);
      }
  };

  // Derived unique clients for select box
  const uniqueClients = useMemo(() => {
      const clients = new Set<string>();
      posts.forEach(p => clients.add(p.clientName));
      return Array.from(clients).sort();
  }, [posts]);

  // Handle derived list based on filters
  const filteredPosts = useMemo(() => {
      let result = posts;

      if (statusFilter !== "ALL") {
          result = result.filter(p => p.status === statusFilter.toLowerCase());
      }

      if (clientFilter !== "") {
          result = result.filter(p => p.clientName === clientFilter);
      }

      if (searchQuery.trim() !== '') {
          const lowerQ = searchQuery.toLowerCase();
          result = result.filter(p => 
              (p.copy && p.copy.toLowerCase().includes(lowerQ)) ||
              (p.clientEmail && p.clientEmail.toLowerCase().includes(lowerQ)) ||
              (p.clientName && p.clientName.toLowerCase().includes(lowerQ))
          );
      }

      return result;
  }, [posts, statusFilter, clientFilter, searchQuery]);

  const getStatusBadge = (status: string, scheduledDate: Date | null) => {
      const isPending = status === 'pending' || status === 'confirmed';
      const isLate = isPending && scheduledDate && isBefore(scheduledDate, new Date());

      if (isLate) {
          return (
              <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                 ⚠️ Retrasado
              </span>
          );
      }

      switch (status) {
          case 'pending':
          case 'confirmed':
              return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Pendiente</span>;
          case 'processing':
              return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Posteando...</span>;
          case 'completed':
              return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Completado</span>;
          case 'quota_exceeded':
              return <span className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Sin Cuota</span>;
          case 'error':
              return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Falla origen</span>;
          default:
              return <span className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
      }
  };

  if (loading) {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
            <div className="h-64 bg-slate-100 rounded-[32px]"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-[32px] text-rose-700">
            <h3 className="font-black text-xl flex items-center gap-2"><span className="text-2xl">⚠️</span> {error}</h3>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-2">
                <span className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-slate-900/30 text-white">📡</span>
                Monitoreo Global de Posts
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                Supervisa el estado y ejecución de todas las publicaciones agendadas por los clientes de la plataforma. Para proteger la base de datos, presiona Buscar para extraer los últimos 100 posts.
            </p>
      </div>

      {/* Control Bar (Filters) */}
      <div className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input 
                    type="text" 
                    placeholder="Buscar por correo o extracto de texto..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 font-medium text-sm transition-all"
                />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto hide-scrollbar">
                {uniqueClients.length > 0 && (
                    <select 
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-[16px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[140px] cursor-pointer"
                    >
                        <option value="">Todos los Clientes</option>
                        {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}

                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-[16px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                >
                    <option value="ALL">Cualquier Estado</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="COMPLETED">Completados</option>
                    <option value="PROCESSING">En Proceso</option>
                    <option value="ERROR">Con Errores</option>
                </select>

                <button 
                  onClick={handleSearch}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap text-sm font-black tracking-wide px-6 py-3 rounded-[16px] transition-all shadow-lg shadow-indigo-600/20"
                >
                  Extraer Datos
                </button>
            </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Agenda Local</th>
                          <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Estado / N8N</th>
                          <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Cliente (Propietario)</th>
                          <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Tipo & Redes</th>
                          <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400 w-1/3">Extracto de Copy</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {!hasSearched ? (
                          <tr><td colSpan={5} className="py-24 text-center text-slate-500 font-medium">Presiona <b>Extraer Datos</b> para cargar información desde Firebase.</td></tr>
                      ) : filteredPosts.length === 0 ? (
                          <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-medium text-sm">No hay publicaciones que coincidan con tus filtros.</td></tr>
                      ) : (
                        filteredPosts.map(post => {
                            const dateObj = post.scheduledFor ? new Date(post.scheduledFor) : null;
                            const isLate = post.status === 'pending' && dateObj && isBefore(dateObj, new Date());

                            return (
                                <tr key={post.id} className={`transition-colors hover:bg-slate-50/50 ${isLate ? 'bg-rose-50/30' : ''}`}>
                                    <td className="py-5 px-6 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className={`font-black text-sm ${isLate ? 'text-rose-700' : 'text-slate-900'}`}>
                                                {dateObj ? format(dateObj, "d MMM, yyyy", { locale: es }) : 'N/A'}
                                            </span>
                                            <span className={`text-xs font-bold mt-0.5 ${isLate ? 'text-rose-500' : 'text-slate-500'}`}>
                                                {dateObj ? format(dateObj, "HH:mm") : '--'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        {getStatusBadge(post.status, dateObj)}
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm truncate max-w-[150px]" title={post.clientName}>{post.clientName}</span>
                                            <span className="text-xs text-slate-400 truncate max-w-[150px]" title={post.clientEmail}>{post.clientEmail}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-black text-slate-700 text-xs bg-slate-100 px-2 py-0.5 rounded">{post.type}</span>
                                            <div className="flex gap-1">
                                                {post.networks?.map(net => (
                                                    <span key={net} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">
                                                        {net.substring(0,2)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="text-sm font-medium text-slate-600 line-clamp-2 max-w-xs leading-relaxed" title={post.copy}>
                                            {post.copy || <span className="text-slate-400 italic">Sin texto base</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
