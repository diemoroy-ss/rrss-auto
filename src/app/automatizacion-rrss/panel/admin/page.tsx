"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import StatusModal from "../../../../components/StatusModal";
import {
  ContractedModules,
  SaasModuleId,
  SAAS_MODULES_CATALOG,
  MODULE_PACKAGES,
  CustomUsageLimits,
  BusinessCollaborator,
} from "../../../../lib/saas-modules";

interface AdminBusinessProfileItem {
  id: string;
  name: string;
  icon: string;
  rubro: string;
  phone: string;
  email: string;
  instagramUsername: string;
  facebookPageName: string;
  menuDigitalEnabled: boolean;
  fidelizacionEnabled: boolean;
  contractedModules: ContractedModules;
}

interface AdminUserData {
  id: string;
  email: string;
  name: string;
  company: string;
  phone: string;
  plan: string;
  role: string;
  planStartDate: string | null;
  planEndDate: string | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  subscriptionStatus: string;
  manualActivation: boolean;
  commercialNotes: string;
  customLimits: CustomUsageLimits;
  isDisabled: boolean;
  postsThisMonth: number;
  registeredApps: string[];
  contractedModules: ContractedModules;
  profiles: AdminBusinessProfileItem[];
  collaborators: BusinessCollaborator[];
}

interface AuditLogEntry {
  id: string;
  actionType: string;
  targetUserId: string;
  targetEmail: string;
  adminEmail: string;
  summary: string;
  createdAt: string;
}

type ModalTab = "modules" | "commercial" | "businesses" | "history";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [availablePlans, setAvailablePlans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>("modules");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | SaasModuleId>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  // Create Client Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState<{
    email: string;
    password: string;
    name: string;
    businessName: string;
    rubro: string;
    phone: string;
    plan: string;
    contractedModules: ContractedModules;
    planStartDate: string;
    planEndDate: string;
    commercialNotes: string;
  }>({
    email: "",
    password: "",
    name: "",
    businessName: "",
    rubro: "Restaurante / Cafetería",
    phone: "",
    plan: "esencial",
    contractedModules: { marketing: true, qr: true, fideliza: false },
    planStartDate: new Date().toISOString().slice(0, 10),
    planEndDate: "",
    commercialNotes: "",
  });

  // Commercial form state for selectedUser
  const [savingCommercial, setSavingCommercial] = useState(false);
  const [commercialDraft, setCommercialDraft] = useState<{
    name: string;
    company: string;
    phone: string;
    role: string;
    plan: string;
    subscriptionStatus: string;
    planStartDate: string;
    planEndDate: string;
    manualActivation: boolean;
    commercialNotes: string;
    postsLimit: string;
    aiImagesLimit: string;
    videosLimit: string;
  }>({
    name: "",
    company: "",
    phone: "",
    role: "user",
    plan: "esencial",
    subscriptionStatus: "active",
    planStartDate: "",
    planEndDate: "",
    manualActivation: true,
    commercialNotes: "",
    postsLimit: "",
    aiImagesLimit: "",
    videosLimit: "",
  });

  // New Business for existing client state
  const [newBizName, setNewBizName] = useState("");
  const [newBizRubro, setNewBizRubro] = useState("");
  const [creatingBiz, setCreatingBiz] = useState(false);

  // Collaborator form state
  const [collabEmail, setCollabEmail] = useState("");
  const [collabName, setCollabName] = useState("");
  const [collabRole, setCollabRole] = useState<"owner" | "collaborator">("collaborator");
  const [addingCollab, setAddingCollab] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [togglingModuleKey, setTogglingModuleKey] = useState<string | null>(null);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showModal = (
    type: "success" | "error" | "info" | "confirm",
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: onConfirm || (() => setModal((prev) => ({ ...prev, isOpen: false }))),
    });
  };

  const fetchUsersList = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken();
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        `Error ${res.status}: ${
          errData.error || "No tienes permisos suficientes o la sesión expiró."
        }`
      );
      return;
    }

    const data = (await res.json()) as { users: AdminUserData[] };
    setUsers(data.users || []);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/automatizacion-rrss/panel");
        return;
      }

      try {
        await fetchUsersList();

        try {
          const plansSnap = await getDoc(doc(db, "system_config", "plans"));
          if (plansSnap.exists()) {
            const plansData = plansSnap.data() as Record<string, { id?: string; name?: string }>;
            const plansList = Object.values(plansData)
              .filter((p) => p && typeof p.id === "string" && typeof p.name === "string")
              .map((p) => ({
                id: p.id as string,
                name: p.name as string,
              }));
            setAvailablePlans(plansList);
          }
        } catch (planErr) {
          console.error("Error fetching plans:", planErr);
        }
      } catch (e: unknown) {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Error al cargar la lista de clientes.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const openClientModal = (u: AdminUserData, defaultTab: ModalTab = "modules") => {
    setSelectedUser(u);
    setActiveTab(defaultTab);
    setCommercialDraft({
      name: u.name || "",
      company: u.company || u.profiles[0]?.name || "",
      phone: u.phone || "",
      role: u.role || "user",
      plan: u.plan || "esencial",
      subscriptionStatus: u.isDisabled ? "suspended" : u.subscriptionStatus || "active",
      planStartDate: u.planStartDate ? u.planStartDate.slice(0, 10) : "",
      planEndDate: u.planEndDate ? u.planEndDate.slice(0, 10) : "",
      manualActivation: u.manualActivation,
      commercialNotes: u.commercialNotes || "",
      postsLimit:
        typeof u.customLimits?.postsLimit === "number" ? String(u.customLimits.postsLimit) : "",
      aiImagesLimit:
        typeof u.customLimits?.aiImagesLimit === "number"
          ? String(u.customLimits.aiImagesLimit)
          : "",
      videosLimit:
        typeof u.customLimits?.videosLimit === "number" ? String(u.customLimits.videosLimit) : "",
    });
    void loadUserAuditLogs(u.id);
  };

  const loadUserAuditLogs = async (userId: string) => {
    if (!auth.currentUser) return;
    setLoadingLogs(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/modules?userId=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { logs: AuditLogEntry[] };
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Error loading logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const toggleModuleForUser = async (
    targetUser: AdminUserData,
    moduleId: SaasModuleId,
    profileId?: string
  ) => {
    const busyKey = `${targetUser.id}:${profileId || "root"}:${moduleId}`;
    setTogglingModuleKey(busyKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      const baseModules = profileId
        ? targetUser.profiles.find((p) => p.id === profileId)?.contractedModules ||
          targetUser.contractedModules
        : targetUser.contractedModules;

      const updatedModules: ContractedModules = {
        ...baseModules,
        [moduleId]: !baseModules[moduleId],
      };

      const res = await fetch("/api/admin/users/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_modules",
          userId: targetUser.id,
          profileId,
          contractedModules: updatedModules,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar el módulo contratado.");
      }

      const nextUsers = users.map((u) => {
        if (u.id !== targetUser.id) return u;
        const nextProfiles = u.profiles.map((p) => {
          if (profileId && p.id !== profileId) return p;
          return {
            ...p,
            contractedModules: updatedModules,
            menuDigitalEnabled: updatedModules.qr,
            fidelizacionEnabled: updatedModules.fideliza,
          };
        });
        return {
          ...u,
          contractedModules:
            !profileId || profileId === "default" || u.profiles.length <= 1
              ? updatedModules
              : u.contractedModules,
          profiles: nextProfiles,
        };
      });

      setUsers(nextUsers);
      const refreshedSelected = nextUsers.find((u) => u.id === targetUser.id) || null;
      if (selectedUser?.id === targetUser.id && refreshedSelected) {
        setSelectedUser(refreshedSelected);
        void loadUserAuditLogs(targetUser.id);
      }
    } catch (e: unknown) {
      console.error(e);
      showModal("error", "Error", "No se pudo cambiar el estado del producto contratado.");
    } finally {
      setTogglingModuleKey(null);
    }
  };

  const applyModulePreset = async (targetUser: AdminUserData, modules: ContractedModules) => {
    setTogglingModuleKey(`${targetUser.id}:preset`);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_modules",
          userId: targetUser.id,
          contractedModules: modules,
        }),
      });
      if (!res.ok) throw new Error("No se pudo aplicar la combinación de módulos");

      const nextUsers = users.map((u) => {
        if (u.id !== targetUser.id) return u;
        return {
          ...u,
          contractedModules: modules,
          profiles: u.profiles.map((p) => ({
            ...p,
            contractedModules: modules,
            menuDigitalEnabled: modules.qr,
            fidelizacionEnabled: modules.fideliza,
          })),
        };
      });

      setUsers(nextUsers);
      const updated = nextUsers.find((u) => u.id === targetUser.id) || null;
      if (selectedUser?.id === targetUser.id && updated) {
        setSelectedUser(updated);
        void loadUserAuditLogs(targetUser.id);
      }
      showModal(
        "success",
        "Productos Contratados Actualizados",
        `Configuración aplicada para ${targetUser.company || targetUser.name}.`
      );
    } catch (e) {
      console.error(e);
      showModal("error", "Error", "Hubo un problema al aplicar el paquete de módulos.");
    } finally {
      setTogglingModuleKey(null);
    }
  };

  const saveCommercialSettings = async () => {
    if (!selectedUser) return;
    setSavingCommercial(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const customLimits: CustomUsageLimits = {
        postsLimit:
          commercialDraft.postsLimit.trim() !== ""
            ? Number(commercialDraft.postsLimit)
            : null,
        aiImagesLimit:
          commercialDraft.aiImagesLimit.trim() !== ""
            ? Number(commercialDraft.aiImagesLimit)
            : null,
        videosLimit:
          commercialDraft.videosLimit.trim() !== ""
            ? Number(commercialDraft.videosLimit)
            : null,
      };

      const res = await fetch("/api/admin/users/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_commercial",
          userId: selectedUser.id,
          name: commercialDraft.name,
          company: commercialDraft.company,
          phone: commercialDraft.phone,
          role: commercialDraft.role,
          plan: commercialDraft.plan,
          subscriptionStatus: commercialDraft.subscriptionStatus,
          planStartDate: commercialDraft.planStartDate || null,
          planEndDate: commercialDraft.planEndDate || null,
          manualActivation: commercialDraft.manualActivation,
          commercialNotes: commercialDraft.commercialNotes,
          customLimits,
        }),
      });

      if (!res.ok) throw new Error("No se pudieron guardar las condiciones comerciales");

      await fetchUsersList();
      await loadUserAuditLogs(selectedUser.id);
      showModal(
        "success",
        "Gestión Comercial Guardada",
        "Se actualizaron el plan, vigencia, límites y observaciones del cliente."
      );
    } catch (e) {
      console.error(e);
      showModal("error", "Error", "No se pudieron guardar los cambios comerciales.");
    } finally {
      setSavingCommercial(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.email.trim()) return;
    setCreatingClient(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClientForm),
      });

      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el cliente");
      }

      setIsCreateOpen(false);
      setNewClientForm({
        email: "",
        password: "",
        name: "",
        businessName: "",
        rubro: "Restaurante / Cafetería",
        phone: "",
        plan: "esencial",
        contractedModules: { marketing: true, qr: true, fideliza: false },
        planStartDate: new Date().toISOString().slice(0, 10),
        planEndDate: "",
        commercialNotes: "",
      });

      await fetchUsersList();
      showModal(
        "success",
        "Cliente Creado",
        data.message || "El cliente y su negocio fueron dados de alta con los módulos seleccionados."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear cliente";
      showModal("error", "Error al crear cliente", msg);
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCreateBusinessForUser = async () => {
    if (!selectedUser || !newBizName.trim()) return;
    setCreatingBiz(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "create_business",
          userId: selectedUser.id,
          businessName: newBizName.trim(),
          rubro: newBizRubro.trim() || "Comercio",
          contractedModules: selectedUser.contractedModules,
        }),
      });
      if (!res.ok) throw new Error("Error al crear negocio");
      setNewBizName("");
      setNewBizRubro("");
      await fetchUsersList();
      await loadUserAuditLogs(selectedUser.id);
      showModal(
        "success",
        "Negocio Agregado",
        `Se creó el negocio "${newBizName}" asociado a la cuenta de ${selectedUser.name}.`
      );
    } catch (e) {
      console.error(e);
      showModal("error", "Error", "No se pudo crear el nuevo negocio para este cliente.");
    } finally {
      setCreatingBiz(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUser || !collabEmail.trim()) return;
    setAddingCollab(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "add_collaborator",
          userId: selectedUser.id,
          collaborator: {
            email: collabEmail.trim(),
            name: collabName.trim(),
            role: collabRole,
          },
        }),
      });
      if (!res.ok) throw new Error("No se pudo asociar colaborador");
      const data = (await res.json()) as { collaborators: BusinessCollaborator[] };
      const updatedUser: AdminUserData = {
        ...selectedUser,
        collaborators: data.collaborators || [],
      };
      setSelectedUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setCollabEmail("");
      setCollabName("");
      await loadUserAuditLogs(selectedUser.id);
    } catch (e) {
      console.error(e);
      showModal("error", "Error", "No se pudo asociar el usuario al negocio.");
    } finally {
      setAddingCollab(false);
    }
  };

  const handleRemoveCollaborator = async (emailToRemove: string) => {
    if (!selectedUser) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "remove_collaborator",
          userId: selectedUser.id,
          collaboratorEmail: emailToRemove,
        }),
      });
      if (!res.ok) throw new Error("Error al eliminar colaborador");
      const data = (await res.json()) as { collaborators: BusinessCollaborator[] };
      const updatedUser: AdminUserData = {
        ...selectedUser,
        collaborators: data.collaborators || [],
      };
      setSelectedUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      await loadUserAuditLogs(selectedUser.id);
    } catch (e) {
      console.error(e);
      showModal("error", "Error", "No se pudo desvincular al colaborador.");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    showModal(
      "confirm",
      "Cambiar Estado de Acceso",
      `¿Confirmas que deseas ${currentStatus ? "reactivar" : "suspender"} el acceso de este cliente?`,
      async () => {
        setModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch("/api/admin/users/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId, isDisabled: !currentStatus }),
          });

          if (!res.ok) throw new Error("Error al cambiar estado");

          const updatedUsers = users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  isDisabled: !currentStatus,
                  subscriptionStatus: !currentStatus ? "suspended" : "active",
                }
              : u
          );
          setUsers(updatedUsers);
          if (selectedUser?.id === userId) {
            setSelectedUser({
              ...selectedUser,
              isDisabled: !currentStatus,
              subscriptionStatus: !currentStatus ? "suspended" : "active",
            });
          }
          showModal(
            "success",
            "Estado Actualizado",
            `La cuenta fue ${!currentStatus ? "suspendida" : "reactivada"} correctamente.`
          );
        } catch (e) {
          console.error(e);
          showModal("error", "Error", "Hubo un problema al actualizar el estado del cliente.");
        }
      }
    );
  };

  const updateUserField = async (userId: string, field: string, value: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, field, value }),
      });
      if (!res.ok) throw new Error("Error al modificar usuario");

      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, [field]: value } : u));
      setUsers(updatedUsers);
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, [field]: value });
      }
    } catch {
      showModal("error", "Error", "Hubo un problema al guardar el cambio.");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === "active" && u.isDisabled) return false;
      if (statusFilter === "suspended" && !u.isDisabled) return false;
      if (moduleFilter !== "all" && !u.contractedModules[moduleFilter]) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchCompany = (u.company || "").toLowerCase().includes(q);
      const matchProfiles = u.profiles.some((p) => p.name.toLowerCase().includes(q));
      return matchName || matchEmail || matchCompany || matchProfiles;
    });
  }, [users, searchQuery, moduleFilter, statusFilter]);

  const moduleStats = useMemo(() => {
    return {
      total: users.length,
      marketing: users.filter((u) => u.contractedModules.marketing).length,
      qr: users.filter((u) => u.contractedModules.qr).length,
      fideliza: users.filter((u) => u.contractedModules.fideliza).length,
    };
  }, [users]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-bold text-slate-500 text-sm">
          Cargando Panel de Administración General de SocialPilot...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Header del Administrador General */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-black uppercase tracking-widest mb-3">
            <span>🛡️</span> Consola Central Multi-Tenant
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Administración General <span className="text-orange-600">SocialPilot</span>
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base font-medium">
            Administra clientes, negocios y habilita o deshabilita individualmente{" "}
            <strong className="text-slate-700">Marketing</strong>,{" "}
            <strong className="text-slate-700">Carta QR</strong> y{" "}
            <strong className="text-slate-700">Fideliza</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2"
          >
            <span className="text-base leading-none">＋</span> Crear Cliente / Negocio
          </button>
          <Link
            href="/automatizacion-rrss/panel/admin/planes"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 px-5 rounded-2xl border border-slate-200 transition-all flex items-center gap-2"
          >
            <span>⚙️</span> Planes y Cupos
          </Link>
          <Link
            href="/automatizacion-rrss/panel/admin/pagos"
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-3.5 px-5 rounded-2xl border border-emerald-200 transition-all flex items-center gap-2"
          >
            <span>💳</span> Pagos
          </Link>
          <Link
            href="/automatizacion-rrss/panel/admin/logs"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-3.5 px-5 rounded-2xl border border-indigo-200 transition-all flex items-center gap-2"
          >
            <span>📡</span> Logs
          </Link>
        </div>
      </div>

      {/* KPIs del Ecosistema */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Clientes Totales
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{moduleStats.total}</div>
          </div>
          <span className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-xl">
            👥
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-orange-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black text-orange-600 uppercase tracking-wider">
              SocialPilot Marketing
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{moduleStats.marketing}</div>
          </div>
          <span className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">
            📣
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black text-amber-600 uppercase tracking-wider">
              SocialPilot Carta QR
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{moduleStats.qr}</div>
          </div>
          <span className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            🍽️
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">
              SocialPilot Fideliza
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{moduleStats.fideliza}</div>
          </div>
          <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            🎁
          </span>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, negocio, restaurante o correo electrónico..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "marketing", label: "📣 Marketing" },
                { id: "qr", label: "🍽️ Carta QR" },
                { id: "fideliza", label: "🎁 Fideliza" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setModuleFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  moduleFilter === f.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "suspended")}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">Estado: Todos</option>
            <option value="active">Estado: Activos</option>
            <option value="suspended">Estado: Suspendidos</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="p-10 bg-rose-50 border-2 border-rose-100 rounded-3xl text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-rose-600 font-black text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-rose-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-rose-500 transition-all"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase font-black tracking-wider text-slate-500">
                  <th className="py-4 px-6">Cliente / Negocios</th>
                  <th className="py-4 px-5">
                    Productos Contratados (Activar / Desactivar)
                  </th>
                  <th className="py-4 px-5">Plan & Vigencia</th>
                  <th className="py-4 px-4">Actividad</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Administración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const mainBusiness = u.profiles[0]?.name || u.company || u.name;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Identidad y Negocios */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0">
                            {u.profiles[0]?.icon || "🏢"}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm leading-snug flex items-center gap-2">
                              {mainBusiness}
                              {u.profiles.length > 1 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {u.profiles.length} negocios
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Productos Contratados: Switches directos */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap items-center gap-2">
                          {(
                            [
                              {
                                id: "marketing" as SaasModuleId,
                                label: "Marketing",
                                icon: "📣",
                                activeClass:
                                  "bg-orange-50 text-orange-700 border-orange-300 shadow-xs",
                              },
                              {
                                id: "qr" as SaasModuleId,
                                label: "Carta QR",
                                icon: "🍽️",
                                activeClass:
                                  "bg-amber-50 text-amber-800 border-amber-300 shadow-xs",
                              },
                              {
                                id: "fideliza" as SaasModuleId,
                                label: "Fideliza",
                                icon: "🎁",
                                activeClass:
                                  "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs",
                              },
                            ] as const
                          ).map((mod) => {
                            const isEnabled = u.contractedModules[mod.id];
                            const isBusy =
                              togglingModuleKey === `${u.id}:root:${mod.id}` ||
                              togglingModuleKey === `${u.id}:preset`;
                            return (
                              <button
                                key={mod.id}
                                type="button"
                                disabled={isBusy}
                                onClick={() => toggleModuleForUser(u, mod.id)}
                                title={`Clic para ${
                                  isEnabled ? "DESACTIVAR" : "ACTIVAR"
                                } SocialPilot ${mod.label}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                                  isEnabled
                                    ? mod.activeClass
                                    : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                                } ${isBusy ? "opacity-50" : ""}`}
                              >
                                <span>{mod.icon}</span>
                                <span>{mod.label}:</span>
                                <span
                                  className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-black ${
                                    isEnabled
                                      ? "bg-white/80 text-slate-900"
                                      : "bg-slate-200/70 text-slate-500"
                                  }`}
                                >
                                  {isEnabled ? "ACTIVO" : "OFF"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Plan & Vigencia */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <select
                            value={u.plan || "free"}
                            onChange={(e) => updateUserField(u.id, "plan", e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                          >
                            <option value="esencial">Plan Esencial ($59.990)</option>
                            <option value="crecimiento">Plan Crecimiento ($99.990)</option>
                            <option value="piloto_automatico">Piloto Automático ($249.990)</option>
                            <option value="free">Prueba / Manual ($0)</option>
                            <option value="agency">Agency / Corporativo</option>
                            {availablePlans
                              .filter(
                                (p) =>
                                  ![
                                    "esencial",
                                    "crecimiento",
                                    "piloto_automatico",
                                    "free",
                                    "agency",
                                  ].includes(p.id)
                              )
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {u.planEndDate
                              ? `Vence: ${u.planEndDate.slice(0, 10)}`
                              : "Vigencia continua"}
                          </div>
                        </div>
                      </td>

                      {/* Actividad */}
                      <td className="py-4 px-4">
                        <div className="text-xs font-bold text-slate-800">
                          {u.postsThisMonth} posts mes
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Alta: {u.createdAt ? u.createdAt.slice(0, 10) : "—"}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4 text-center">
                        {u.isDisabled ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspendido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openClientModal(u, "modules")}
                            className="text-xs font-black px-3.5 py-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all"
                          >
                            Gestionar Cliente
                          </button>
                          <button
                            onClick={() => toggleUserStatus(u.id, u.isDisabled)}
                            className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                              u.isDisabled
                                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500"
                                : "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                            }`}
                          >
                            {u.isDisabled ? "Reactivar" : "Suspender"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-slate-400 font-bold text-sm"
                    >
                      No se encontraron clientes con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE GESTIÓN INTEGRAL DEL CLIENTE */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSelectedUser(null)}
          />

          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 sm:px-8 py-6 text-white flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl font-black shadow-md">
                  {selectedUser.profiles[0]?.icon ||
                    (selectedUser.name ? selectedUser.name[0].toUpperCase() : "🏢")}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                      {selectedUser.company ||
                        selectedUser.profiles[0]?.name ||
                        selectedUser.name}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        selectedUser.isDisabled
                          ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      }`}
                    >
                      {selectedUser.isDisabled ? "Acceso Suspendido" : "Cliente Activo"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5">
                    {selectedUser.name} · {selectedUser.email} ·{" "}
                    <span className="font-mono text-slate-400">UID: {selectedUser.id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Navegación por Pestañas del Modal */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 flex flex-wrap gap-2 pt-3 shrink-0">
              {(
                [
                  { id: "modules", label: "📦 1. Productos Contratados" },
                  { id: "commercial", label: "💼 2. Gestión Comercial y Límites" },
                  { id: "businesses", label: "🏢 3. Negocios y Colaboradores" },
                  { id: "history", label: "🕒 4. Historial de Cambios" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 ${
                    activeTab === tab.id
                      ? "bg-white text-orange-600 border-orange-600 shadow-2xs"
                      : "text-slate-600 border-transparent hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cuerpo scrollable del Modal */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: PRODUCTOS CONTRATADOS */}
              {activeTab === "modules" && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Control Individual de Módulos del Ecosistema
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Activa o desactiva cada solución de forma independiente. El catálogo central
                        de productos y promociones siempre estará disponible para el cliente.
                      </p>
                    </div>
                  </div>

                  {/* Tarjetas de los 3 Productos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["marketing", "qr", "fideliza"] as SaasModuleId[]).map((modId) => {
                      const meta = SAAS_MODULES_CATALOG[modId];
                      const enabled = selectedUser.contractedModules[modId];
                      const busy = togglingModuleKey === `${selectedUser.id}:root:${modId}`;
                      return (
                        <div
                          key={modId}
                          className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                            enabled
                              ? "border-orange-500/80 bg-orange-50/20 shadow-sm"
                              : "border-slate-200 bg-white opacity-80"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                {meta.badge}
                              </span>
                              <span
                                className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg ${
                                  enabled
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {enabled ? "ACTIVADO" : "DESACTIVADO"}
                              </span>
                            </div>
                            <h5 className="text-base font-black text-slate-900">{meta.name}</h5>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {meta.tagline}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400">
                              {meta.subdomain}
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => toggleModuleForUser(selectedUser, modId)}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                enabled
                                  ? "bg-slate-900 text-white hover:bg-rose-600"
                                  : "bg-orange-600 text-white hover:bg-orange-500 shadow-sm"
                              }`}
                            >
                              {busy ? "Guardando..." : enabled ? "Desactivar" : "Activar Módulo"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Presets Rápidos de Contratación */}
                  <div className="pt-2">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                      Combinaciones Comerciales Rápidas
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {MODULE_PACKAGES.map((pkg) => {
                        const isCurrent =
                          pkg.modules.marketing === selectedUser.contractedModules.marketing &&
                          pkg.modules.qr === selectedUser.contractedModules.qr &&
                          pkg.modules.fideliza === selectedUser.contractedModules.fideliza;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => applyModulePreset(selectedUser, pkg.modules)}
                            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            <div className="text-xs font-black flex items-center justify-between">
                              <span>{pkg.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-md">
                                  Actual
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[11px] mt-1 ${
                                isCurrent ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {pkg.shortDescription}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GESTIÓN COMERCIAL Y LÍMITES */}
              {activeTab === "commercial" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Nombre Contacto
                      </label>
                      <input
                        type="text"
                        value={commercialDraft.name}
                        onChange={(e) =>
                          setCommercialDraft({ ...commercialDraft, name: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Razón Social / Marca
                      </label>
                      <input
                        type="text"
                        value={commercialDraft.company}
                        onChange={(e) =>
                          setCommercialDraft({ ...commercialDraft, company: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={commercialDraft.phone}
                        onChange={(e) =>
                          setCommercialDraft({ ...commercialDraft, phone: e.target.value })
                        }
                        placeholder="+56 9 ..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Plan Comercial Base
                      </label>
                      <select
                        value={commercialDraft.plan}
                        onChange={(e) =>
                          setCommercialDraft({ ...commercialDraft, plan: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      >
                        <option value="esencial">Plan PyME Esencial ($59.990)</option>
                        <option value="crecimiento">Plan PyME Crecimiento ($99.990)</option>
                        <option value="piloto_automatico">Plan Piloto Automático ($249.990)</option>
                        <option value="free">Plan Base / Manual ($0)</option>
                        <option value="agency">Plan Agency / Corporativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Estado de Contratación
                      </label>
                      <select
                        value={commercialDraft.subscriptionStatus}
                        onChange={(e) =>
                          setCommercialDraft({
                            ...commercialDraft,
                            subscriptionStatus: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      >
                        <option value="active">Activo (Vigente)</option>
                        <option value="manual">Activación Manual / Factura Directa</option>
                        <option value="trial">Periodo de Prueba</option>
                        <option value="suspended">Suspendido</option>
                        <option value="expired">Vencido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Rol de Seguridad
                      </label>
                      <select
                        value={commercialDraft.role}
                        onChange={(e) =>
                          setCommercialDraft({ ...commercialDraft, role: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      >
                        <option value="owner">Administrador del Negocio (Cliente)</option>
                        <option value="user">Usuario del Negocio (USER)</option>
                        <option value="vendedor">Ejecutivo Comercial (PWA)</option>
                        <option value="admin">Administrador General SocialPilot</option>
                      </select>
                    </div>
                  </div>

                  {/* Fechas de Vigencia */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Fecha de Inicio Contratación
                      </label>
                      <input
                        type="date"
                        value={commercialDraft.planStartDate}
                        onChange={(e) =>
                          setCommercialDraft({
                            ...commercialDraft,
                            planStartDate: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                        Fecha de Término / Renovación (Vacío = Indefinido)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={commercialDraft.planEndDate}
                          onChange={(e) =>
                            setCommercialDraft({
                              ...commercialDraft,
                              planEndDate: e.target.value,
                            })
                          }
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                        />
                        {commercialDraft.planEndDate && (
                          <button
                            type="button"
                            onClick={() =>
                              setCommercialDraft({ ...commercialDraft, planEndDate: "" })
                            }
                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Límites de Uso Personalizados */}
                  <div className="pt-2 border-t border-slate-100">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                      Límites de Uso Personalizados (Opcional — Sobrescribe el Plan Base)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Publicaciones / mes
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Usar límite del plan"
                          value={commercialDraft.postsLimit}
                          onChange={(e) =>
                            setCommercialDraft({ ...commercialDraft, postsLimit: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Imágenes de Agentes / mes
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Usar límite del plan"
                          value={commercialDraft.aiImagesLimit}
                          onChange={(e) =>
                            setCommercialDraft({
                              ...commercialDraft,
                              aiImagesLimit: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Videos y Reels / mes
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Usar límite del plan"
                          value={commercialDraft.videosLimit}
                          onChange={(e) =>
                            setCommercialDraft({ ...commercialDraft, videosLimit: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observaciones Comerciales */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                      Observaciones Comerciales / Acuerdo de Facturación
                    </label>
                    <textarea
                      rows={3}
                      value={commercialDraft.commercialNotes}
                      onChange={(e) =>
                        setCommercialDraft({
                          ...commercialDraft,
                          commercialNotes: e.target.value,
                        })
                      }
                      placeholder="Ej: Contrató Carta QR + Fideliza vía transferencia anual. Incluye soporte de carga inicial de menú..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-900 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={savingCommercial}
                      onClick={saveCommercialSettings}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-md transition-all"
                    >
                      {savingCommercial
                        ? "Guardando..."
                        : "Guardar Condiciones Comerciales"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: NEGOCIOS Y COLABORADORES */}
              {activeTab === "businesses" && (
                <div className="space-y-8">
                  {/* Lista de Negocios del Cliente */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-1">
                      Negocios Asociados a esta Cuenta ({selectedUser.profiles.length})
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Cada negocio tiene su propio catálogo, identidad visual, URL de Carta QR y
                      Club Fideliza.
                    </p>

                    <div className="space-y-3">
                      {selectedUser.profiles.map((biz) => {
                        const qrPublicPath = `/menu/${selectedUser.id}___${biz.id}`;
                        return (
                          <div
                            key={biz.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{biz.icon || "🏢"}</span>
                              <div>
                                <div className="font-black text-slate-900 text-sm">
                                  {biz.name}{" "}
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ({biz.id})
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {biz.rubro || "Sin rubro especificado"} ·{" "}
                                  <a
                                    href={qrPublicPath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-orange-600 hover:underline font-bold"
                                  >
                                    Ver Carta QR Pública ↗
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {(["marketing", "qr", "fideliza"] as SaasModuleId[]).map((mId) => {
                                const active = biz.contractedModules[mId];
                                return (
                                  <button
                                    key={mId}
                                    type="button"
                                    onClick={() => toggleModuleForUser(selectedUser, mId, biz.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                      active
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                        : "bg-white text-slate-400 border-slate-200"
                                    }`}
                                  >
                                    {SAAS_MODULES_CATALOG[mId].shortName}:{" "}
                                    {active ? "ON" : "OFF"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Crear Nuevo Negocio para el Cliente */}
                    <div className="mt-4 p-4 rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="text"
                        value={newBizName}
                        onChange={(e) => setNewBizName(e.target.value)}
                        placeholder="Nombre del nuevo local o sucursal..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={newBizRubro}
                        onChange={(e) => setNewBizRubro(e.target.value)}
                        placeholder="Rubro (ej: Cafetería, Sucursal Centro)"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        disabled={creatingBiz || !newBizName.trim()}
                        onClick={handleCreateBusinessForUser}
                        className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black px-4 py-2.5 rounded-xl shrink-0"
                      >
                        {creatingBiz ? "Creando..." : "+ Crear Negocio"}
                      </button>
                    </div>
                  </div>

                  {/* Colaboradores Asociados */}
                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-black text-slate-900 mb-1">
                      Usuarios y Colaboradores Asociados al Negocio
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Registra administradores del negocio o colaboradores operativos autorizados.
                    </p>

                    {selectedUser.collaborators.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {selectedUser.collaborators.map((c) => (
                          <div
                            key={c.email}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-900">{c.name}</span>{" "}
                              <span className="text-xs text-slate-500">({c.email})</span>
                              <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                {c.role === "owner" ? "Admin del Negocio" : "Colaborador"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCollaborator(c.email)}
                              className="text-xs font-bold text-rose-600 hover:underline"
                            >
                              Desvincular
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-4">
                        No hay colaboradores adicionales registrados en esta cuenta.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <input
                        type="email"
                        value={collabEmail}
                        onChange={(e) => setCollabEmail(e.target.value)}
                        placeholder="correo@negocio.cl"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={collabName}
                        onChange={(e) => setCollabName(e.target.value)}
                        placeholder="Nombre colaborador"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      />
                      <select
                        value={collabRole}
                        onChange={(e) =>
                          setCollabRole(e.target.value as "owner" | "collaborator")
                        }
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      >
                        <option value="collaborator">Colaborador del Negocio</option>
                        <option value="owner">Administrador del Negocio</option>
                      </select>
                      <button
                        type="button"
                        disabled={addingCollab || !collabEmail.trim()}
                        onClick={handleAddCollaborator}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl"
                      >
                        {addingCollab ? "Asociando..." : "+ Asociar Usuario"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: HISTORIAL DE CAMBIOS */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900">
                    Registro de Auditoría y Cambios Comerciales
                  </h4>
                  {loadingLogs ? (
                    <p className="text-xs text-slate-400 py-6">Consultando historial...</p>
                  ) : auditLogs.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400 font-medium">
                      Aún no se registran modificaciones manuales en el historial de este cliente.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{log.summary}</div>
                            <div className="text-[11px] text-slate-400">
                              Por: {log.adminEmail || "Admin"} · Acción: {log.actionType}
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 shrink-0">
                            {log.createdAt.replace("T", " ").slice(0, 16)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR NUEVO CLIENTE / NEGOCIO */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsCreateOpen(false)}
          />
          <form
            onSubmit={handleCreateClient}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-slate-200"
          >
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Alta de Nuevo Cliente y Negocio</h3>
                <p className="text-xs text-slate-400">
                  Crea la cuenta, su primer negocio y selecciona qué productos contrata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientForm.businessName}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, businessName: e.target.value })
                    }
                    placeholder="Ej: Cafetería Central"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Nombre del Cliente / Encargado
                  </label>
                  <input
                    type="text"
                    value={newClientForm.name}
                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                    placeholder="Ej: Camila Soto"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Correo Electrónico de Acceso *
                  </label>
                  <input
                    type="email"
                    required
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    placeholder="cliente@negocio.cl"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Contraseña Inicial (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newClientForm.password}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, password: e.target.value })
                    }
                    placeholder="Mínimo 6 caracteres (o autogenerada)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Rubro Comercial
                  </label>
                  <input
                    type="text"
                    value={newClientForm.rubro}
                    onChange={(e) => setNewClientForm({ ...newClientForm, rubro: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Plan Asignado
                  </label>
                  <select
                    value={newClientForm.plan}
                    onChange={(e) => setNewClientForm({ ...newClientForm, plan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                  >
                    <option value="esencial">Plan PyME Esencial</option>
                    <option value="crecimiento">Plan PyME Crecimiento</option>
                    <option value="piloto_automatico">Plan Piloto Automático</option>
                    <option value="free">Plan Base / Manual</option>
                  </select>
                </div>
              </div>

              {/* Selección de Módulos Contratados al Crear */}
              <div className="pt-2">
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-2">
                  Productos Contratados por el Cliente
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["marketing", "qr", "fideliza"] as SaasModuleId[]).map((mId) => {
                    const active = newClientForm.contractedModules[mId];
                    const meta = SAAS_MODULES_CATALOG[mId];
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() =>
                          setNewClientForm({
                            ...newClientForm,
                            contractedModules: {
                              ...newClientForm.contractedModules,
                              [mId]: !active,
                            },
                          })
                        }
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          active
                            ? "border-orange-500 bg-orange-50/40"
                            : "border-slate-200 bg-slate-50 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {meta.shortName}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {active ? "ACTIVO" : "NO"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{meta.badge}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Observaciones Comerciales
                </label>
                <input
                  type="text"
                  value={newClientForm.commercialNotes}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, commercialNotes: e.target.value })
                  }
                  placeholder="Ej: Contrató Solo Carta QR mensual..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingClient}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-md"
                >
                  {creatingClient ? "Creando Cliente..." : "Crear Cliente y Activar Módulos"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <StatusModal
        {...modal}
        onCancel={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
