"use client";

import { useState, useEffect } from "react";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled" | "blocked";
  meetUrl?: string;
  createdAt: string;
}

export default function AdminAgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "blocked" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal states
  const [confirmModalBooking, setConfirmModalBooking] = useState<Booking | null>(null);
  const [meetUrl, setMeetUrl] = useState("https://meet.google.com/");
  const [customMessage, setCustomMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [editModalBooking, setEditModalBooking] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editStatus, setEditStatus] = useState<any>("pending");
  const [savingEdit, setSavingEdit] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockTime, setBlockTime] = useState("10:00");
  const [blockReason, setBlockReason] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);

  const timeSlots = ["10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00", "18:00"];

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agenda");
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Error fetching agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handlers
  const handleConfirmAndSendMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalBooking) return;
    setSendingEmail(true);

    try {
      const res = await fetch("/api/admin/agenda/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: confirmModalBooking.id,
          email: confirmModalBooking.email,
          name: confirmModalBooking.name,
          date: confirmModalBooking.date,
          time: confirmModalBooking.time,
          meetUrl,
          customMessage
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Correo de confirmación enviado exitosamente con la videollamada.");
        setConfirmModalBooking(null);
        fetchBookings();
      } else {
        alert("❌ Error: " + (data.error || "No se pudo enviar el correo."));
      }
    } catch (err) {
      alert("❌ Error de red al enviar confirmación.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalBooking) return;
    setSavingEdit(true);

    try {
      const res = await fetch("/api/admin/agenda", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editModalBooking.id,
          date: editDate,
          time: editTime,
          status: editStatus
        })
      });

      if (res.ok) {
        setEditModalBooking(null);
        fetchBookings();
      } else {
        alert("Error al actualizar la reserva");
      }
    } catch (err) {
      alert("Error de red");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockTime) return;
    setSavingBlock(true);

    try {
      const res = await fetch("/api/admin/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: blockDate,
          time: blockTime,
          reason: blockReason
        })
      });

      if (res.ok) {
        setBlockModalOpen(false);
        setBlockReason("");
        fetchBookings();
      } else {
        alert("Error al crear el bloqueo");
      }
    } catch (err) {
      alert("Error de red");
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDelete = async (id: string, isBlock: boolean) => {
    if (!confirm(isBlock ? "¿Deseas desbloquear este horario?" : "¿Seguro que deseas eliminar esta reserva?")) return;

    try {
      const res = await fetch(`/api/admin/agenda?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBookings();
      } else {
        alert("Error al eliminar");
      }
    } catch (err) {
      alert("Error de red");
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === "all" ? true : b.status === filter;
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || 
                          b.email.toLowerCase().includes(search.toLowerCase()) ||
                          b.date.includes(search);
    const matchesStartDate = !startDate || b.date >= startDate;
    const matchesEndDate = !endDate || b.date <= endDate;
    return matchesFilter && matchesSearch && matchesStartDate && matchesEndDate;
  });

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    blocked: bookings.filter(b => b.status === "blocked").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>📅</span> Gestor de Agenda & Demostraciones
          </h1>
          <p className="text-slate-500 text-sm">Administra las citas agendadas, envía enlaces de Google Meet y bloquea horarios.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setBlockModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm flex items-center gap-2 shadow-sm"
          >
            <span>🚫</span> Bloquear Horario
          </button>
          <button 
            onClick={fetchBookings}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl transition-all text-sm"
            title="Recargar"
          >
            🔄
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Registro</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{counts.all}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase">Pendientes</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{counts.pending}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase">Confirmadas</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{counts.confirmed}</p>
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Horarios Bloqueados</p>
          <p className="text-2xl font-black text-slate-700 mt-1">{counts.blocked}</p>
        </div>
      </div>

      {/* Controls: Search & Tabs & Date Filters */}
      <div className="flex flex-col gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Row 1: Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "pending", "confirmed", "blocked", "cancelled"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filter === tab 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {tab === "all" && `Todos (${counts.all})`}
                {tab === "pending" && `⏳ Pendientes (${counts.pending})`}
                {tab === "confirmed" && `✅ Confirmadas (${counts.confirmed})`}
                {tab === "blocked" && `🚫 Bloqueados (${counts.blocked})`}
                {tab === "cancelled" && `❌ Canceladas (${counts.cancelled})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Row 2: Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Filtrar por rango:</span>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-700 text-xs font-medium cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-700 text-xs font-medium cursor-pointer"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Limpiar fechas"
            >
              ✕ Limpiar Rango
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold">Cargando agenda...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No hay registros con los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Cliente / Contacto</th>
                  <th className="py-3 px-4">Notas / Negocio</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBookings.map(booking => {
                  const isBlocked = booking.status === "blocked";
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{booking.date}</div>
                        <div className="text-slate-500 text-[11px] font-mono">⏰ {booking.time} hrs</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <span className="font-bold text-amber-700">HORARIO BLOQUEADO</span>
                        ) : (
                          <>
                            <div className="font-bold text-slate-800">{booking.name}</div>
                            <div className="text-slate-400 text-[11px]">{booking.email}</div>
                            {booking.phone && <div className="text-slate-400 text-[10px]">📱 {booking.phone}</div>}
                          </>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {booking.notes || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                          booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                          booking.status === "blocked" ? "bg-slate-200 text-slate-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {booking.status === "confirmed" && "✅ Confirmada"}
                          {booking.status === "pending" && "⏳ Pendiente"}
                          {booking.status === "blocked" && "🚫 Bloqueado"}
                          {booking.status === "cancelled" && "❌ Cancelada"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isBlocked && (
                            <button
                              onClick={() => {
                                setConfirmModalBooking(booking);
                                setMeetUrl("https://meet.google.com/");
                                setCustomMessage("");
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1"
                              title="Responder / Enviar Google Meet"
                            >
                              ✉️ Confirmar / Meet
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditModalBooking(booking);
                              setEditDate(booking.date);
                              setEditTime(booking.time);
                              setEditStatus(booking.status);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded-lg font-bold text-[11px] transition-colors"
                            title="Editar Fecha/Hora/Estado"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id, isBlocked)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 rounded-lg font-bold text-[11px] transition-colors"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Confirm & Send Meet */}
      {confirmModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>🎥</span> Confirmar Cita y Enviar Google Meet
              </h3>
              <button onClick={() => setConfirmModalBooking(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
              <p><strong>Cliente:</strong> {confirmModalBooking.name} ({confirmModalBooking.email})</p>
              <p><strong>Fecha reservada:</strong> {confirmModalBooking.date} a las {confirmModalBooking.time} hrs</p>
            </div>

            <form onSubmit={handleConfirmAndSendMeet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enlace de Videollamada (Google Meet)</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetUrl}
                  onChange={e => setMeetUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje Opcional para el cliente</label>
                <textarea
                  placeholder="Ej: Hola Diego, te espero en este enlace. Por favor ten a mano las credenciales de tu marca..."
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModalBooking(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {sendingEmail ? "Enviando..." : "📧 Enviar Confirmación por Correo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Date/Time */}
      {editModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>✏️</span> Modificar Reserva
              </h3>
              <button onClick={() => setEditModalBooking(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Fecha</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Hora</label>
                <select
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  {timeSlots.map(s => (
                    <option key={s} value={s}>{s} hrs</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado de Reserva</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="pending">⏳ Pendiente</option>
                  <option value="confirmed">✅ Confirmada</option>
                  <option value="blocked">🚫 Bloqueado</option>
                  <option value="cancelled">❌ Cancelada</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalBooking(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {savingEdit ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Block Slot */}
      {blockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>🚫</span> Bloquear Horario Específico
              </h3>
              <button onClick={() => setBlockModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <p className="text-xs text-slate-500">
              Al bloquear una fecha y hora, los usuarios no podrán seleccionarla en la página pública de reservas.
            </p>

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha a Bloquear</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={e => setBlockDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hora a Bloquear</label>
                <select
                  value={blockTime}
                  onChange={e => setBlockTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  {timeSlots.map(s => (
                    <option key={s} value={s}>{s} hrs</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Reunión de equipo, feriado, etc."
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBlock}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {savingBlock ? "Bloqueando..." : "Bloquear Horario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
