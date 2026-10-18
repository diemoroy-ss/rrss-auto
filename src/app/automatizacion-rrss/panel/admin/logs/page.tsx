'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../../../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format, subDays, subWeeks, startOfDay, endOfDay } from 'date-fns';
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

type Period = 'day' | 'week' | 'custom' | 'all';

const PERIOD_OPTIONS: { id: Period; label: string; emoji: string }[] = [
    { id: 'day', label: 'Último día', emoji: '📅' },
    { id: 'week', label: 'Última semana', emoji: '📆' },
    { id: 'custom', label: 'Rango de fechas', emoji: '🗓️' },
    { id: 'all', label: 'Todos', emoji: '🗂️' },
];

export default function AdminLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalFetched, setTotalFetched] = useState(0);

    // Period filter
    const [period, setPeriod] = useState<Period>('day');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Other filters
    const [filterClient, setFilterClient] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let q;
            const col = collection(db, 'admin_logs');

            if (period === 'day') {
                const since = Timestamp.fromDate(startOfDay(subDays(new Date(), 1)));
                q = query(col, where('timestamp', '>=', since), orderBy('timestamp', 'desc'), limit(500));
            } else if (period === 'week') {
                const since = Timestamp.fromDate(startOfDay(subWeeks(new Date(), 1)));
                q = query(col, where('timestamp', '>=', since), orderBy('timestamp', 'desc'), limit(500));
            } else if (period === 'custom' && dateFrom && dateTo) {
                const from = Timestamp.fromDate(startOfDay(new Date(dateFrom)));
                const to = Timestamp.fromDate(endOfDay(new Date(dateTo)));
                q = query(col, where('timestamp', '>=', from), where('timestamp', '<=', to), orderBy('timestamp', 'desc'), limit(500));
            } else {
                q = query(col, orderBy('timestamp', 'desc'), limit(200));
            }

            const snapshot = await getDocs(q);
            const loadedLogs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as AdminLog));
            setLogs(loadedLogs);
            setTotalFetched(loadedLogs.length);
        } catch (err: any) {
            console.error("Error fetching admin logs:", err);
            setError("Error al cargar los logs. Asegúrate de tener permisos o de que el índice de Firestore esté creado.");
        } finally {
            setLoading(false);
        }
    }, [period, dateFrom, dateTo]);

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
    }, [router, fetchLogs]);

    const getStatusColor = (status: string) => {
        switch (status) {
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
        if (filterClient && !log.clientEmail?.toLowerCase().includes(filterClient.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: filteredLogs.length,
        success: filteredLogs.filter(l => l.status === 'success').length,
        error: filteredLogs.filter(l => l.status === 'error').length,
        skipped: filteredLogs.filter(l => l.status === 'skipped').length,
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span>📡</span> Logs de Sistema
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ejecuciones de publicación, automatizaciones y eventos del sistema.
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold transition-colors disabled:opacity-50"
                >
                    {loading ? '⏳ Cargando...' : '🔄 Refrescar'}
                </button>
            </div>

            {/* Period tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Período</p>
                <div className="flex flex-wrap gap-2">
                    {PERIOD_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setPeriod(opt.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-1.5 ${
                                period === opt.id
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                        >
                            <span>{opt.emoji}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Custom date range */}
                {period === 'custom' && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Desde</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hasta</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchLogs}
                                disabled={!dateFrom || !dateTo}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Secondary filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Filtrar por Cliente</label>
                    <input
                        type="text"
                        placeholder="Buscar por email..."
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="w-full md:w-56">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Estado</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl text-sm text-slate-700 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="success">✅ Exitosos</option>
                        <option value="error">❌ Fallidos</option>
                        <option value="skipped">⚠️ Omitidos</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            {!loading && !error && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700', emoji: '📊' },
                        { label: 'Exitosos', value: stats.success, color: 'bg-emerald-50 text-emerald-700', emoji: '✅' },
                        { label: 'Fallidos', value: stats.error, color: 'bg-rose-50 text-rose-700', emoji: '❌' },
                        { label: 'Omitidos', value: stats.skipped, color: 'bg-amber-50 text-amber-700', emoji: '⚠️' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl p-3 text-center ${s.color} border border-current/10`}>
                            <div className="text-2xl font-black">{s.emoji} {s.value}</div>
                            <div className="text-xs font-bold uppercase tracking-wider mt-0.5 opacity-70">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 font-bold text-sm mb-6">
                    ⚠️ {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex h-40 items-center justify-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        Cargando logs...
                    </div>
                </div>
            )}

            {/* Table */}
            {!loading && !error && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {filteredLogs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="font-semibold">Sin registros para este período y filtros.</p>
                            <p className="text-sm mt-1">Intenta cambiar el rango de fechas o los filtros.</p>
                        </div>
                    ) : (
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
                                    {filteredLogs.map((log) => {
                                        const dateStr = log.timestamp?.toDate
                                            ? format(log.timestamp.toDate(), "dd MMM yyyy, HH:mm", { locale: es })
                                            : 'N/A';
                                        const isExpanded = expandedId === log.id;

                                        return (
                                            <>
                                                <tr
                                                    key={log.id}
                                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                                >
                                                    <td className="p-4 pl-6 text-slate-500 whitespace-nowrap text-xs font-medium">
                                                        {dateStr}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-700">{log.clientEmail || '—'}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[160px]">{log.postId}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-fit text-xs border border-slate-200">
                                                            {getTypeIcon(log.postType)} {log.postType || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-widest ${getStatusColor(log.status)}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6 max-w-xs">
                                                        <p className="text-slate-700 font-medium truncate">{log.message}</p>
                                                        {log.details && !isExpanded && (
                                                            <p className="text-[11px] text-slate-400 mt-0.5 italic truncate">{log.details}</p>
                                                        )}
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr key={`${log.id}-detail`} className="bg-indigo-50/30">
                                                        <td colSpan={5} className="px-6 py-4 text-sm text-slate-600 border-b border-indigo-100">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Mensaje completo</p>
                                                                    <p className="font-medium text-slate-700">{log.message || '—'}</p>
                                                                </div>
                                                                {log.details && (
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Detalles</p>
                                                                        <p className="text-slate-600 font-mono text-xs whitespace-pre-wrap break-all">{log.details}</p>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">User ID</p>
                                                                    <p className="font-mono text-xs text-slate-500">{log.userId || '—'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Acción</p>
                                                                    <p className="font-mono text-xs text-slate-500">{log.action || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium">
                            Mostrando <span className="font-bold text-slate-600">{filteredLogs.length}</span> de <span className="font-bold text-slate-600">{totalFetched}</span> logs cargados
                        </p>
                        <p className="text-xs text-slate-400">Haz clic en una fila para ver el detalle</p>
                    </div>
                </div>
            )}
        </div>
    );
}
