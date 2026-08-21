'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '../../../../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminLog {
    id: string;
    timestamp: any;
    action: string;
    postId: string;
    userId: string;
    clientEmail: string;
    postType: string;
    status: string;
    message: string;
    details: string;
}

export default function AdminLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterClient, setFilterClient] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, success, error, skipped

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                const userData = userDoc.data();
                if (userData?.role !== "admin") {
                    router.push('/automatizacion-rrss/panel');
                } else {
                    fetchLogs();
                }
            } else {
                router.push('/automatizacion-rrss/panel');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            let q = query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(100));
            const snapshot = await getDocs(q);
            const loadedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLog));
            setLogs(loadedLogs);
        } catch (err: any) {
            console.error("Error fetching admin logs:", err);
            setError("Error al cargar los logs. Asegúrate de tener permisos.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'success': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'error': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'skipped': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('reel') || t.includes('short') || t.includes('video')) return '🎬';
        if (t.includes('carrusel')) return '📑';
        return '🖼️';
    };

    const filteredLogs = logs.filter(log => {
        if (filterStatus !== 'all' && log.status !== filterStatus) return false;
        if (filterClient && !log.clientEmail.toLowerCase().includes(filterClient.toLowerCase())) return false;
        return true;
    });

    if (loading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando logs del sistema...</div>;
    if (error) return <div className="p-8 text-rose-500 font-bold">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="text-2xl">📡</span> System Logs (Ejecuciones)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Monitorea la publicación JIT y ejecuciones programadas.</p>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold transition-colors"
                >
                    🔄 Refrescar
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Filtrar por Cliente</label>
                    <input 
                        type="text" 
                        placeholder="Buscar por email..." 
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="w-full border-slate-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="w-full md:w-64">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Filtrar por Estado</label>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="all">Todos</option>
                        <option value="success">Exitosos</option>
                        <option value="error">Fallidos</option>
                        <option value="skipped">Omitidos</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <th className="p-4 pl-6">Fecha y Hora</th>
                                <th className="p-4">Cliente / ID</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 pr-6">Mensaje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">No hay registros que coincidan con los filtros.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const dateStr = log.timestamp?.toDate ? format(log.timestamp.toDate(), "dd MMM yyyy, HH:mm", { locale: es }) : 'N/A';
                                    
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 pl-6 text-slate-500 whitespace-nowrap text-xs font-medium">
                                                {dateStr}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-700">{log.clientEmail}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.postId}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-fit text-xs border border-slate-200">
                                                    {getTypeIcon(log.postType)} {log.postType}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-widest ${getStatusColor(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 max-w-lg">
                                                <p className="text-slate-700 font-medium">{log.message}</p>
                                                {log.details && <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-3" title={log.details}>{log.details}</p>}
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
