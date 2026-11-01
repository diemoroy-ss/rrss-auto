"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { auth } from '../../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProfile } from '../../../../contexts/ProfileContext';
import type { CatalogoItem } from '../../../../contexts/ProfileContext';
import Link from 'next/link';

const EMPTY_FORM: Omit<CatalogoItem, 'id' | 'createdAt' | 'active'> = {
  name: '',
  description: '',
  type: 'producto',
  category: '',
  subcategory: '',
  price: '',
  offerPrice: '',
  includePriceInCopy: true,
  imageUrl: '',
  tags: [],
  profileId: '',
  keepOriginalPhoto: true,
  fontStyle: 'script_handwritten',
  linkedProductIds: [],
  promoImageMode: 'both',
};

export default function CatalogoPage() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile, updateActiveProfile } = useProfile();
  const [togglingMenu, setTogglingMenu] = useState(false);

  // Viñeta principal: 'catalogo' (Productos y Servicios) vs 'promociones' (Promociones)
  const [activeTab, setActiveTab] = useState<'catalogo' | 'promociones'>('catalogo');
  const [filterCategory, setFilterCategory] = useState<string>("TODAS");
  const [linkedSearch, setLinkedSearch] = useState<string>("");

  // Separación de Productos/Servicios vs Promociones
  const catalogProductsAndServices = useMemo(() => {
    return items.filter((i) => i.type !== 'promocion');
  }, [items]);

  const promoItems = useMemo(() => {
    return items.filter((i) => i.type === 'promocion');
  }, [items]);

  const existingCategories = useMemo(() => {
    const cats = Array.from(
      new Set(
        catalogProductsAndServices
          .map((i) => i.category?.trim())
          .filter(Boolean) as string[]
      )
    );
    return cats.sort((a, b) => a.localeCompare(b));
  }, [catalogProductsAndServices]);

  const displayCatalogItems = useMemo(() => {
    if (filterCategory === "TODAS") return catalogProductsAndServices;
    return catalogProductsAndServices.filter(
      (i) => (i.category || "Destacados").toLowerCase() === filterCategory.toLowerCase()
    );
  }, [catalogProductsAndServices, filterCategory]);

  const filteredLinkableProducts = useMemo(() => {
    const q = linkedSearch.toLowerCase().trim();
    if (!q) return catalogProductsAndServices;
    return catalogProductsAndServices.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [catalogProductsAndServices, linkedSearch]);

  const isMenuEnabled = activeProfile?.menuDigitalEnabled === true;

  const handleToggleMenuDigital = async (enable: boolean) => {
    setTogglingMenu(true);
    try {
      await updateActiveProfile({ menuDigitalEnabled: enable });
      setSuccess(
        enable
          ? "¡Carta Menú Digital habilitada con éxito! Ya puedes verla en el menú lateral."
          : "Carta Menú Digital desactivada."
      );
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError("Error al actualizar la configuración de la carta digital.");
    } finally {
      setTogglingMenu(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user && activeProfile?.id) {
      loadItems();
    }
  }, [user, activeProfile]);

  const getToken = async () => {
    return (await user?.getIdToken()) || '';
  };

  const loadItems = async () => {
    if (!user || !activeProfile?.id) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/catalogo?profileId=${activeProfile.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError('Error cargando el catálogo.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (defaultType: 'producto' | 'servicio' | 'promocion' = 'producto') => {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      type: defaultType,
      category: defaultType === 'promocion' ? 'Promociones' : '',
      profileId: activeProfile?.id || 'default',
      keepOriginalPhoto: true,
      fontStyle: defaultType === 'promocion' ? 'bold_modern' : 'script_handwritten',
      includePriceInCopy: true,
      linkedProductIds: [],
      promoImageMode: 'both',
    });
    setLinkedSearch('');
    setImageFile(null);
    setImagePreview('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (item: CatalogoItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      type: item.type,
      category: item.category || (item.type === 'promocion' ? 'Promociones' : ''),
      subcategory: item.subcategory || '',
      price: item.price || '',
      offerPrice: item.offerPrice || '',
      includePriceInCopy: item.includePriceInCopy !== false,
      imageUrl: item.imageUrl || '',
      tags: item.tags || [],
      profileId: item.profileId,
      keepOriginalPhoto: item.keepOriginalPhoto !== false,
      fontStyle: item.fontStyle || 'script_handwritten',
      linkedProductIds: item.linkedProductIds || [],
      promoImageMode: item.promoImageMode || 'both',
    });
    setLinkedSearch('');
    setImageFile(null);
    setImagePreview(item.imageUrl || '');
    setError('');
    setShowModal(true);
  };

  const toggleLinkedProduct = (productId: string) => {
    const current = form.linkedProductIds || [];
    const exists = current.includes(productId);
    const updated = exists
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    setForm({ ...form, linkedProductIds: updated });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.imageUrl || null;
    setUploadingImage(true);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('profileId', activeProfile?.id || 'default');
      const res = await fetch('/api/catalogo/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error subiendo imagen');
      return data.url;
    } catch (e: any) {
      throw e;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim() || !form.description.trim()) {
      setError(
        form.type === 'promocion'
          ? 'Escribe cuál será la promoción y su descripción.'
          : 'Nombre y descripción son obligatorios.'
      );
      return;
    }
    setSaving(true);
    try {
      let resolvedImageUrl = await uploadImage();

      // Si es una promoción sin imagen propia pero tiene productos vinculados con foto, usar la primera foto disponible como respaldo
      if (!resolvedImageUrl && form.type === 'promocion' && (form.linkedProductIds || []).length > 0) {
        const firstWithPhoto = catalogProductsAndServices.find(
          (p) => (form.linkedProductIds || []).includes(p.id) && p.imageUrl
        );
        if (firstWithPhoto?.imageUrl) {
          resolvedImageUrl = firstWithPhoto.imageUrl;
        }
      }

      const token = await getToken();
      const payload = {
        ...form,
        category: form.type === 'promocion' ? (form.category || 'Promociones') : form.category,
        imageUrl: resolvedImageUrl || null,
      };

      if (editingItem) {
        const res = await fetch('/api/catalogo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setSuccess(form.type === 'promocion' ? 'Promoción actualizada correctamente.' : 'Ítem actualizado correctamente.');
      } else {
        const res = await fetch('/api/catalogo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setSuccess(form.type === 'promocion' ? '¡Promoción creada correctamente!' : 'Ítem creado correctamente.');
      }

      if (form.type === 'promocion') {
        setActiveTab('promociones');
      }

      setShowModal(false);
      await loadItems();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Error guardando el ítem.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;
    try {
      const token = await getToken();
      await fetch('/api/catalogo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      await loadItems();
    } catch (e) {
      alert('Error eliminando.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Productos, Servicios & Promociones</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            El catálogo y las ofertas activas de {activeProfile?.name || 'tu marca'} que nuestros agentes usan al planificar y diseñar.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {isMenuEnabled && (
            <Link
              href="/automatizacion-rrss/panel/menu-qr"
              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 font-black rounded-2xl transition-all text-xs sm:text-sm shadow-xs"
            >
              <span>📱</span> Carta Menú & QR
            </Link>
          )}
          <button
            onClick={() => openCreate('promocion')}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-rose-500/25 text-xs sm:text-sm cursor-pointer"
          >
            <span>🔥</span> + Crear Promoción
          </button>
          <button
            onClick={() => openCreate('producto')}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/30 text-xs sm:text-sm cursor-pointer"
          >
            + Producto / Servicio
          </button>
        </div>
      </div>

      {/* ── Banner de Habilitación de Carta Menú Digital & QR ── */}
      <div className={`mb-6 p-5 sm:p-6 rounded-3xl border-2 transition-all ${
        isMenuEnabled 
          ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-emerald-200/80 shadow-sm"
          : "bg-gradient-to-r from-indigo-50 via-white to-purple-50 border-indigo-100 shadow-sm"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${
              isMenuEnabled ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
            }`}>
              {isMenuEnabled ? "📱" : "✨"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900">
                  Carta Menú Digital & Código QR
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isMenuEnabled ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600"
                }`}>
                  {isMenuEnabled ? "🟢 Habilitada" : "⚪ Opcional"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                {isMenuEnabled 
                  ? "Tu carta digital está activa. Los clientes pueden escanear el código QR para ver tus productos, fotos reales, precios y hacer pedidos directo a WhatsApp."
                  : "Muestra tus productos en una carta digital interactiva con fotos reales, precios y ofertas. Al activarla se habilitará la sección de Código QR y estilos visuales para tu local."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {isMenuEnabled ? (
              <>
                <Link
                  href="/automatizacion-rrss/panel/menu-qr"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <span>📱 Diseñar Carta & QR</span>
                  <span>→</span>
                </Link>
                <button
                  onClick={() => handleToggleMenuDigital(false)}
                  disabled={togglingMenu}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold rounded-xl text-xs transition-all"
                  title="Desactivar carta digital"
                >
                  {togglingMenu ? "..." : "Desactivar"}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleToggleMenuDigital(true)}
                disabled={togglingMenu}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
              >
                {togglingMenu ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Habilitando...</>
                ) : (
                  <><span>✨ Habilitar Carta Digital & QR</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── VIÑETAS PRINCIPALES: PRODUCTOS & SERVICIOS vs PROMOCIONES ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 mb-6 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('catalogo')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'catalogo'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📦</span>
          <span>Productos & Servicios</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'catalogo' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {catalogProductsAndServices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('promociones')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'promociones'
              ? 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-500 hover:text-rose-600'
          }`}
        >
          <span>🔥</span>
          <span>Promociones</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'promociones' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
          }`}>
            {promoItems.length}
          </span>
        </button>
      </div>

      {success && (
        <div className="mb-6 px-5 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-2xl text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'catalogo' ? (
        /* =========================================================
           VIÑETA 1: PRODUCTOS & SERVICIOS
           ========================================================= */
        catalogProductsAndServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <span className="text-6xl mb-4">📦</span>
            <h3 className="text-xl font-black text-slate-700 mb-2">Aún no tienes productos ni servicios</h3>
            <p className="text-slate-400 text-sm font-medium mb-6 max-w-md">
              Agrega tus platos, productos o servicios clave para asociarlos a promociones y usarlos en tus planificaciones.
            </p>
            <button
              onClick={() => openCreate('producto')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm transition-all cursor-pointer"
            >
              + Agregar mi primer producto o servicio
            </button>
          </div>
        ) : (
          <div>
            {/* Filtros rápidos por Categoría */}
            {existingCategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-6">
                <button
                  type="button"
                  onClick={() => setFilterCategory("TODAS")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    filterCategory === "TODAS"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Todas ({catalogProductsAndServices.length})
                </button>
                {existingCategories.map((cat) => {
                  const count = catalogProductsAndServices.filter(
                    (i) => (i.category || "Destacados").toLowerCase() === cat.toLowerCase()
                  ).length;
                  const isSelected = filterCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayCatalogItems.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl border-2 border-slate-100 shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-slate-200">
                        {item.type === 'producto' ? '📦' : '⚙️'}
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${item.type === 'producto' ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white'}`}>
                        {item.type}
                      </span>
                      {item.category && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-800 shadow-xs border border-white/50">
                          {item.category}
                        </span>
                      )}
                      {item.subcategory && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 shadow-xs border border-slate-200">
                          ↳ {item.subcategory}
                        </span>
                      )}
                    </div>
                    {item.keepOriginalPhoto !== false && item.imageUrl && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                        <span>📸</span> Foto Real
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-black text-slate-900 text-base leading-tight">{item.name}</h3>
                      <div className="text-right">
                        {item.offerPrice ? (
                          <div className="flex flex-col items-end">
                            <span className="text-rose-600 font-black text-sm whitespace-nowrap flex items-center gap-1">
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black tracking-wider">PROMO</span>
                              {item.offerPrice}
                            </span>
                            {item.price && (
                              <span className="text-slate-400 text-xs line-through whitespace-nowrap">{item.price}</span>
                            )}
                          </div>
                        ) : item.price ? (
                          <span className="text-emerald-600 font-black text-sm whitespace-nowrap">{item.price}</span>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-3">{item.description}</p>
                    {item.includePriceInCopy && (item.price || item.offerPrice) && (
                      <div className="mb-3 flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                        <span>🏷️</span> Precio activo para copys de agentes
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/automatizacion-rrss/panel/crear?catalogoId=${item.id}&catalogoName=${encodeURIComponent(item.name)}`}
                        className="flex-1 text-center px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl transition-all"
                      >
                        Crear post
                      </Link>
                      <button onClick={() => openEdit(item)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-all cursor-pointer">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item.id!)} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-xs rounded-xl transition-all cursor-pointer">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* =========================================================
           VIÑETA 2: PROMOCIONES
           ========================================================= */
        <div className="space-y-6">
          {/* Banner explicativo de Promociones */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-50 via-orange-50/60 to-amber-50/40 rounded-3xl border-2 border-rose-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-rose-500/20">
                🔥
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Centro de Promociones & Ofertas para tus Estrategias
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-2xl leading-relaxed">
                  Escribe aquí las promociones de tu negocio (ej. <em>&quot;20% OFF en primera sesión&quot;</em>, <em>&quot;Pack 3x2&quot;</em> o <em>&quot;Combo Especial&quot;</em>) y asóciales opcionalmente <strong>1 o más productos o servicios</strong> de tu catálogo. Al planificar tu estrategia podrás activar estas promociones y elegir si las imágenes se generan <strong>con texto publicitario</strong> o <strong>sin texto</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Link
                href="/automatizacion-rrss/panel/estrategia"
                className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-black rounded-xl text-xs transition-all shadow-xs"
              >
                🚀 Ir a Planificar
              </Link>
              <button
                onClick={() => openCreate('promocion')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                + Nueva Promoción
              </button>
            </div>
          </div>

          {promoItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-rose-200 text-center px-4">
              <span className="text-6xl mb-4">🔥</span>
              <h3 className="text-xl font-black text-slate-800 mb-2">Aún no has creado promociones</h3>
              <p className="text-slate-500 text-sm font-medium mb-6 max-w-md">
                Crea tu primera promoción (combos, descuentos, 2x1 o precios especiales) y vincúlale productos de tu catálogo para integrarla en tu calendario de publicaciones.
              </p>
              <button
                onClick={() => openCreate('promocion')}
                className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-black rounded-2xl text-sm transition-all shadow-lg shadow-rose-500/25 cursor-pointer"
              >
                🔥 Crear mi primera Promoción
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {promoItems.map((promo) => {
                const linkedProducts = catalogProductsAndServices.filter((p) =>
                  (promo.linkedProductIds || []).includes(p.id)
                );
                const displayImg =
                  promo.imageUrl ||
                  linkedProducts.find((p) => p.imageUrl)?.imageUrl ||
                  '';
                const imgModeLabel =
                  promo.promoImageMode === 'with_text'
                    ? '🏷️ Con Texto'
                    : promo.promoImageMode === 'without_text'
                    ? '📸 Sin Texto'
                    : '🔄 Con y Sin Texto';

                return (
                  <div
                    key={promo.id}
                    className="bg-white rounded-3xl border-2 border-rose-100 hover:border-rose-300 shadow-md hover:shadow-lg transition-all overflow-hidden group flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 bg-slate-100 relative overflow-hidden">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={promo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-rose-50 to-orange-50 text-rose-300">
                            🔥
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                            🔥 Promoción
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-sm text-slate-800 shadow-xs border border-white/50">
                            {imgModeLabel}
                          </span>
                        </div>
                        {(promo.offerPrice || promo.price) && (
                          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/15 shadow-lg">
                            <span className="text-xs font-black text-amber-400">
                              {promo.offerPrice || promo.price}
                            </span>
                            {promo.offerPrice && promo.price && (
                              <span className="text-[10px] text-slate-400 line-through ml-1.5">
                                {promo.price}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-5 pb-3">
                        <h3 className="font-black text-slate-900 text-base leading-tight mb-1.5">
                          {promo.name}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-3">
                          {promo.description}
                        </p>

                        {/* Productos / Servicios vinculados */}
                        {linkedProducts.length > 0 ? (
                          <div className="mb-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                              Productos / Servicios Incluidos ({linkedProducts.length}):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {linkedProducts.map((lp) => (
                                <span
                                  key={lp.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100 text-[11px] font-bold"
                                >
                                  {lp.imageUrl ? (
                                    <img
                                      src={lp.imageUrl}
                                      alt={lp.name}
                                      className="w-3.5 h-3.5 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span>{lp.type === 'servicio' ? '💼' : '📦'}</span>
                                  )}
                                  <span className="truncate max-w-[140px]">{lp.name}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3 text-[11px] font-medium text-slate-400 italic">
                            Promoción general (sin producto específico vinculado)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-slate-100">
                      <Link
                        href={`/automatizacion-rrss/panel/crear?catalogoId=${promo.id}&catalogoName=${encodeURIComponent(promo.name)}`}
                        className="flex-1 text-center px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl transition-all"
                      >
                        Diseñar post promo
                      </Link>
                      <button
                        onClick={() => openEdit(promo)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-all cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id!)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-xs rounded-xl transition-all cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Crear/Editar Producto, Servicio o Promoción */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {editingItem
                      ? form.type === 'promocion'
                        ? 'Editar Promoción'
                        : 'Editar Ítem'
                      : form.type === 'promocion'
                      ? '🔥 Nueva Promoción'
                      : 'Nuevo Producto / Servicio'}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                    {form.type === 'promocion'
                      ? 'Define la oferta y asocia opcionalmente 1 o más productos/servicios de tu catálogo.'
                      : 'Completa los datos para agregarlo a tu catálogo.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Selector de Tipo Rápido en el Modal */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'producto' })}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    form.type === 'producto'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📦 Producto
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'servicio' })}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    form.type === 'servicio'
                      ? 'bg-white text-violet-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  💼 Servicio
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      type: 'promocion',
                      category: form.category || 'Promociones',
                      fontStyle: 'bold_modern',
                    })
                  }
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    form.type === 'promocion'
                      ? 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  🔥 Promoción
                </button>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Nombre o Título de la Promoción */}
              <div className="mb-4">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  {form.type === 'promocion' ? '¿Cuál será la promoción? (Título) *' : 'Nombre *'}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={
                    form.type === 'promocion'
                      ? 'Ej: 20% OFF en Evaluación / Pack 3x2 / Combo Especial $10.000'
                      : 'Ej: Consulta de Valoración / Producto Estrella'
                  }
                  className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                />
              </div>

              {/* Descripción */}
              <div className="mb-4">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  {form.type === 'promocion'
                    ? 'Detalle / Condiciones de la Promoción *'
                    : 'Descripción *'}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder={
                    form.type === 'promocion'
                      ? 'Describe qué incluye la promo, días válidos o detalles para que nuestros agentes redacten el copy y diseñen el post.'
                      : 'Describe brevemente este producto o servicio para que nuestros agentes lo entiendan y promocionen.'
                  }
                  className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors resize-none"
                />
              </div>

              {/* Precios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{form.type === 'promocion' ? 'Valor Promo / Oferta *' : 'Precio Oferta / Promo'}</span>
                    <span className="text-[10px] text-rose-600 font-black uppercase tracking-wider">Destacado</span>
                  </label>
                  <input
                    type="text"
                    value={form.offerPrice || ''}
                    onChange={(e) => setForm({ ...form, offerPrice: e.target.value })}
                    placeholder="Ej: $10.000, 2x1 o 30% OFF"
                    className="w-full border-2 border-rose-200 focus:border-rose-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors bg-rose-50/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    {form.type === 'promocion' ? 'Precio Normal (Opcional)' : 'Precio Normal'}
                  </label>
                  <input
                    type="text"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Ej: $14.990"
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* SECCIÓN EXCLUSIVA PARA PROMOCIONES: VINCULAR 1 O MÁS PRODUCTOS / SERVICIOS */}
              {form.type === 'promocion' ? (
                <div className="mb-5 p-4 rounded-2xl border-2 border-rose-100 bg-rose-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        🛍️ Asociar Productos o Servicios (Opcional — 1 o más)
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Selecciona los productos o servicios que entran en esta promoción.
                      </p>
                    </div>
                    {(form.linkedProductIds || []).length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                        {(form.linkedProductIds || []).length} seleccionado{(form.linkedProductIds || []).length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  {catalogProductsAndServices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Aún no tienes productos individuales cargados, pero puedes guardar esta promoción directamente.
                    </p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={linkedSearch}
                        onChange={(e) => setLinkedSearch(e.target.value)}
                        placeholder="🔍 Buscar producto o servicio para asociar..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-rose-400"
                      />
                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                        {filteredLinkableProducts.map((prod) => {
                          const isChecked = (form.linkedProductIds || []).includes(prod.id);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => toggleLinkedProduct(prod.id)}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                                isChecked
                                  ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-400/30'
                                  : 'bg-white/70 border-slate-200 hover:bg-white'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${
                                  isChecked
                                    ? 'bg-rose-600 text-white font-bold'
                                    : 'border border-slate-300 bg-white text-transparent'
                                }`}
                              >
                                ✓
                              </div>
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm shrink-0">
                                  {prod.type === 'servicio' ? '💼' : '📦'}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate">{prod.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {prod.category || prod.type} {prod.price ? `• ${prod.price}` : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Preferencia de Imagen con Texto vs Sin Texto para esta Promoción */}
                  <div className="pt-3 border-t border-rose-200/60">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                      🎨 ¿Cómo deseas las imágenes de esta promoción?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, promoImageMode: 'with_text' })}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          form.promoImageMode === 'with_text'
                            ? 'border-rose-600 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-black text-slate-900">🏷️ Con Texto</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          Cartel con titular y precio en la imagen
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, promoImageMode: 'without_text' })}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          form.promoImageMode === 'without_text'
                            ? 'border-rose-600 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-black text-slate-900">📸 Sin Texto</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          Foto limpia del plato; la promo va en el copy
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, promoImageMode: 'both' })}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          (form.promoImageMode || 'both') === 'both'
                            ? 'border-rose-600 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-black text-slate-900">🔄 Ambos</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          Decidir o alternar al planificar el mes
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Categorías para Productos y Servicios normales */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      Categoría (ej: Piqueos, Entradas, Fondos...)
                    </label>
                    <input
                      type="text"
                      list="category-suggestions"
                      value={form.category || ''}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Escribe o selecciona categoría..."
                      className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                    />
                    <datalist id="category-suggestions">
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                      <option value="Piqueos" />
                      <option value="Entradas" />
                      <option value="Platos de Fondo" />
                      <option value="Sándwiches" />
                      <option value="Sushis & Rolls" />
                      <option value="Pizzas & Pastas" />
                      <option value="Bebidas & Tragos" />
                      <option value="Cafetería & Pastelería" />
                      <option value="Postres" />
                    </datalist>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Esta categoría se verá en el carrusel y encabezados de tu Carta QR.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      Subcategoría (Opcional)
                    </label>
                    <input
                      type="text"
                      value={form.subcategory || ''}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      placeholder="Ej: Smash Burgers, Calientes..."
                      className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Imagen referencial */}
              <div className="mb-5">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                  {form.type === 'promocion'
                    ? 'Imagen de la promoción (Opcional — si no subes, usa la de los productos vinculados o nuestros agentes la generan)'
                    : 'Imagen referencial'}
                </label>
                <div
                  className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors overflow-hidden bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl block mb-1">🖼️</span>
                      <span className="text-xs text-slate-400 font-bold">Click para subir imagen</span>
                      <span className="text-[10px] text-slate-300 font-medium block mt-0.5">JPG, PNG, WebP — máx 5 MB</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {/* Opción de Foto Real Intocable vs Generación de Estudio */}
              <div className="mb-5 p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="keepOriginalPhoto"
                    checked={form.keepOriginalPhoto ?? true}
                    onChange={(e) => setForm({ ...form, keepOriginalPhoto: e.target.checked })}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="keepOriginalPhoto" className="cursor-pointer">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>📸</span> Mantener fotografía original intacta
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                      Si tiene foto cargada, nuestros agentes conservarán la foto exacta y (cuando elijas imagen con texto) superpondrán el titular y precio sin tapar el plato.
                    </p>
                  </label>
                </div>

                {(form.keepOriginalPhoto ?? true) && (
                  <div className="pt-2 border-t border-indigo-100/80">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Estilo Tipográfico (cuando se genera con texto)
                    </label>
                    <select
                      value={form.fontStyle || 'script_handwritten'}
                      onChange={(e) => setForm({ ...form, fontStyle: e.target.value as any })}
                      className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none bg-white"
                    >
                      <option value="bold_modern">💥 Bold Promocional (Ideal Ofertas / $10.000 / Combos)</option>
                      <option value="script_handwritten">✍️ Cursiva Cálida (Estilo Cafetería / Artesanal)</option>
                      <option value="elegant_serif">🍷 Elegante Serif (Estilo Gourmet / Restobar)</option>
                      <option value="clean_minimal">⚡ Moderno Sans (Limpio y directo)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || uploadingImage}
                  className={`flex-1 px-5 py-3 disabled:opacity-50 text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    form.type === 'promocion'
                      ? 'bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 shadow-lg shadow-rose-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {saving || uploadingImage ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...
                    </>
                  ) : editingItem ? (
                    'Guardar Cambios'
                  ) : form.type === 'promocion' ? (
                    '🔥 Guardar Promoción'
                  ) : (
                    'Agregar al Catálogo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
