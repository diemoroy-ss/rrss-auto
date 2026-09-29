"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import {
  FaUserPlus,
  FaKey,
  FaWhatsapp,
  FaEye,
  FaBan,
  FaCheck,
  FaTrash,
  FaSyncAlt,
  FaMobileAlt,
  FaCopy,
  FaEnvelope,
  FaSearch
} from "react-icons/fa";

interface Vendedor {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isDisabled: boolean;
  demosCount: number;
  createdAt: string | null;
}

const ADMIN_EMAILS = [
  "admin@santisoft.cl",
  "diemoroy@gmail.com",
  "spalezcom@gmail.com",
  "santisoftai@gmail.com",
];

export default function AdminVendedoresPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal: Crear Vendedor
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("Santisoft");
  const [createPhone, setCreatePhone] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdSummary, setCreatedSummary] = useState<{
    name: string;
    email: string;
    pass: string;
  } | null>(null);

  // Modal: Cambiar Contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  // Modal feedback genérico
  const [actionSuccess, setActionSuccess] = useState("");

  // 1. Guard de Administrador
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }

      const email = (u.email || "").toLowerCase();
      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        const role = userDoc.data()?.role;
        const allowed = ADMIN_EMAILS.includes(email) || role === "admin";

        if (!allowed) {
          router.replace("/automatizacion-rrss/panel");
          return;
        }

        setIsAdmin(true);
        loadVendedores();
      } catch (e) {
        console.error("Error verificando rol de admin:", e);
        router.replace("/automatizacion-rrss/panel");
      }
    });

    return () => unsub();
  }, [router]);

  // 2. Cargar Lista de Vendedores
  const loadVendedores = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/vendedores", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setVendedores(data.vendedores || []);
      }
    } catch (e) {
      console.error("Error cargando vendedores:", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Crear Vendedor
  const handleCreateVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/vendedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          phone: createPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el vendedor");
      }

      // Guardar resumen para que el admin pueda copiar las credenciales
      setCreatedSummary({
        name: createName.trim(),
        email: createEmail.trim(),
        pass: createPassword,
      });

      // Limpiar formulario y recargar lista
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreatePhone("");
      loadVendedores();
    } catch (err: any) {
      setCreateError(err.message || "Error al crear vendedor");
    } finally {
      setCreateLoading(false);
    }
  };

  // 4. Cambiar Contraseña desde Admin
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendedor) return;
    setPassError("");
    setPassSuccess("");
    setPassLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/vendedores", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedVendedor.id,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña");
      }

      setPassSuccess(`¡Contraseña de ${selectedVendedor.name} actualizada con éxito!`);
      setTimeout(() => {
        setShowPasswordModal(false);
        setSelectedVendedor(null);
        setNewPassword("");
        setPassSuccess("");
      }, 2000);
    } catch (err: any) {
      setPassError(err.message || "Error al actualizar contraseña");
    } finally {
      setPassLoading(false);
    }
  };

  // 5. Alternar Estado (Suspender / Activar)
  const handleToggleStatus = async (vendedor: Vendedor) => {
    const actionText = vendedor.isDisabled ? "activar" : "suspender";
    if (!confirm(`¿Estás seguro de que deseas ${actionText} a ${vendedor.name}?`)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/vendedores", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: vendedor.id,
          isDisabled: !vendedor.isDisabled,
        }),
      });

      if (res.ok) {
        setVendedores((prev) =>
          prev.map((v) => (v.id === vendedor.id ? { ...v, isDisabled: !v.isDisabled } : v))
        );
        setActionSuccess(`Vendedor ${vendedor.name} ${!vendedor.isDisabled ? "suspendido" : "activado"}`);
        setTimeout(() => setActionSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  // 6. Revocar Rol de Vendedor
  const handleRevokeRole = async (vendedor: Vendedor) => {
    if (!confirm(`¿Deseas revocar el rol de vendedor a ${vendedor.name}? Ya no podrá acceder a la PWA de muestras.`)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/vendedores?userId=${vendedor.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setVendedores((prev) => prev.filter((v) => v.id !== vendedor.id));
        setActionSuccess(`Acceso revocado a ${vendedor.name}`);
        setTimeout(() => setActionSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error revocando vendedor:", err);
    }
  };

  // Filtro
  const filteredVendedores = vendedores.filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.phone.includes(q)
    );
  });

  const totalDemos = vendedores.reduce((acc, v) => acc + v.demosCount, 0);
  const activeSellers = vendedores.filter((v) => !v.isDisabled).length;
  const topSeller = vendedores[0] && vendedores[0].demosCount > 0 ? vendedores[0] : null;

  if (loading && vendedores.length === 0) {
    return (
      <div className="p-8 text-center font-bold text-slate-400 mt-20">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Cargando equipo de vendedores...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">💼</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Equipo de Vendedores (Comercial PWA)
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Asigna usuarios y contraseñas a tus vendedores, gestiona sus accesos y revisa cuántas muestras han generado en la PWA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/vendedores"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
          >
            <FaMobileAlt className="text-indigo-600" /> Abrir Mini App PWA
          </Link>

          <button
            onClick={() => {
              setCreatedSummary(null);
              setCreateError("");
              setCreatePassword("Santisoft");
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98]"
          >
            <FaUserPlus /> Nuevo Vendedor
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <FaCheck /> {actionSuccess}
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Vendedores Activos
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{activeSellers}</span>
            <span className="text-xs text-slate-400 font-bold">de {vendedores.length} totales</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Muestras Generadas por el Equipo
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">{totalDemos}</span>
            <span className="text-xs text-slate-400 font-bold">demos para prospectos</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Vendedor Más Activo
          </div>
          <div className="truncate">
            <span className="text-xl font-black text-slate-900 truncate block">
              {topSeller ? topSeller.name : "Sin actividad aún"}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {topSeller ? `${topSeller.demosCount} muestras generadas` : "Crea tu primer vendedor"}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE VENDEDORES */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-4 top-3 text-slate-400 text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar vendedor por nombre, email o teléfono..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={loadVendedores}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title="Recargar lista"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-100">
                <th className="p-5 px-6">Vendedor / Usuario</th>
                <th className="p-5">Teléfono</th>
                <th className="p-5">Muestras</th>
                <th className="p-5">Estado</th>
                <th className="p-5 text-right px-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredVendedores.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">
                        {v.name[0]?.toUpperCase() || "V"}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{v.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{v.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-slate-600 font-mono">
                    {v.phone || <span className="text-slate-300 italic">No especificado</span>}
                  </td>

                  <td className="p-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                      🎨 {v.demosCount} {v.demosCount === 1 ? "muestra" : "muestras"}
                    </span>
                  </td>

                  <td className="p-5">
                    {v.isDisabled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Suspendido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                      </span>
                    )}
                  </td>

                  <td className="p-5 text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botón Asignar/Cambiar Contraseña */}
                      <button
                        onClick={() => {
                          setSelectedVendedor(v);
                          setNewPassword("");
                          setPassError("");
                          setPassSuccess("");
                          setShowPasswordModal(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs flex items-center gap-1"
                        title="Cambiar contraseña de este vendedor"
                      >
                        <FaKey className="text-indigo-600" />
                        <span className="hidden sm:inline">Clave</span>
                      </button>

                      {/* Botón Suspender / Habilitar */}
                      <button
                        onClick={() => handleToggleStatus(v)}
                        className={`p-2 rounded-xl font-bold transition-all text-xs ${
                          v.isDisabled
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                        }`}
                        title={v.isDisabled ? "Activar cuenta" : "Suspender cuenta"}
                      >
                        {v.isDisabled ? <FaCheck /> : <FaBan />}
                      </button>

                      {/* Botón Revocar Rol */}
                      <button
                        onClick={() => handleRevokeRole(v)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold transition-all text-xs"
                        title="Revocar acceso de vendedor"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredVendedores.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                    No se encontraron vendedores registrados. ¡Haz clic en &quot;Nuevo Vendedor&quot; para registrar al primero!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREAR NUEVO VENDEDOR */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[36px] max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Crear Nuevo Vendedor</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Asigna sus credenciales de acceso a la mini app de muestras.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-light"
              >
                ✕
              </button>
            </div>

            {createdSummary ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <FaCheck /> ¡Vendedor Creado Exitosamente!
                </div>
                <p className="text-xs text-emerald-700">
                  Copia estas credenciales y compártelas con tu vendedor para que ingrese en la PWA:
                </p>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-mono space-y-1">
                  <div><strong>App:</strong> https://rrss.santisoft.cl/vendedores</div>
                  <div><strong>Usuario:</strong> {createdSummary.email}</div>
                  <div><strong>Contraseña:</strong> {createdSummary.pass}</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const msg = `¡Hola ${createdSummary.name}! Aquí tienes tu acceso comercial a la mini app de Muestras de Santisoft:\n\n🔗 Enlace: https://rrss.santisoft.cl/vendedores\n👤 Usuario: ${createdSummary.email}\n🔑 Contraseña: ${createdSummary.pass}\n\nDesde allí puedes generar muestras para prospectos y compartirlas en 1 clic. ¡Mucho éxito!`;
                      navigator.clipboard.writeText(msg);
                      alert("¡Datos copiados al portapapeles listos para enviar por WhatsApp!");
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <FaCopy /> Copiar Mensaje
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="py-2 px-4 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateVendedor} className="space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    ⚠️ {createError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Correo Electrónico (Usuario) *
                  </label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="juan.perez@empresa.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Contraseña Inicial *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Santisoft"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Predeterminada: <strong>Santisoft</strong>. En su primer ingreso con esta clave inicial, el sistema le exigirá definir su contraseña personal.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Teléfono WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createLoading ? "Registrando..." : "Crear Vendedor"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CAMBIAR CONTRASEÑA */}
      {showPasswordModal && selectedVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[36px] max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Cambiar Contraseña</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Actualiza la clave de <strong>{selectedVendedor.name}</strong> ({selectedVendedor.email}).
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedVendedor(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-light"
              >
                ✕
              </button>
            </div>

            {passSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <FaCheck /> {passSuccess}
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {passError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    ⚠️ {passError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedVendedor(null);
                    }}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {passLoading ? "Actualizando..." : "Guardar Nueva Clave"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
