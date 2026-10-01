"use client";

import { useState, useEffect, useRef } from 'react';
import { auth } from '../../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProfile } from '../../../../contexts/ProfileContext';
import type { CatalogoItem } from '../../../../contexts/ProfileContext';
import Link from 'next/link';
import TestCompanyModal from '../../../../components/catalogo/TestCompanyModal';

const EMPTY_FORM: Omit<CatalogoItem, 'id' | 'createdAt' | 'active'> = {
  name: '',
  description: '',
  type: 'producto',
  category: '',
  price: '',
  offerPrice: '',
  includePriceInCopy: true,
  imageUrl: '',
  tags: [],
  profileId: '',
  keepOriginalPhoto: true,
  fontStyle: 'script_handwritten',
};

export default function CatalogoPage() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile, updateActiveProfile, profiles, setActiveProfile, loadProfiles } = useProfile();
  const [togglingMenu, setTogglingMenu] = useState(false);

  const isMenuEnabled = activeProfile?.menuDigitalEnabled === true;
  const userEmail = (user?.email || '').toLowerCase().trim();
  const isAdminUser = ['santisoftai@gmail.com', 'diemoroy@gmail.com', 'spalezcom@gmail.com', 'admin@santisoft.cl'].includes(userEmail);
  const isTestCompany = activeProfile?.isTestProfile === true || (activeProfile?.id && activeProfile.id.startsWith('prof_test_'));
  const testProfiles = profiles.filter((p) => p.isTestProfile === true || p.id.startsWith('prof_test_'));

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
      } else {
        try {
          const token = await u.getIdToken();
          setUserToken(token);
        } catch (e) {
          console.error("Error getting token", e);
        }
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

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      profileId: activeProfile?.id || 'default',
      keepOriginalPhoto: true,
      fontStyle: 'script_handwritten',
      includePriceInCopy: true,
    });
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
      category: item.category || '',
      price: item.price || '',
      offerPrice: item.offerPrice || '',
      includePriceInCopy: item.includePriceInCopy !== false,
      imageUrl: item.imageUrl || '',
      tags: item.tags || [],
      profileId: item.profileId,
      keepOriginalPhoto: item.keepOriginalPhoto !== false,
      fontStyle: item.fontStyle || 'script_handwritten',
    });
    setImageFile(null);
    setImagePreview(item.imageUrl || '');
    setError('');
    setShowModal(true);
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
      setError('Nombre y descripción son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      const token = await getToken();
      
      const payload = { ...form, imageUrl: imageUrl || null };

      if (editingItem) {
        const res = await fetch('/api/catalogo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setSuccess('Ítem actualizado correctamente.');
      } else {
        const res = await fetch('/api/catalogo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setSuccess('Ítem creado correctamente.');
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
    if (!window.confirm('¿Estás seguro de eliminar este ítem del catálogo?')) return;
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Productos & Servicios</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            El catálogo de {activeProfile?.name || 'tu marca'} — las referencias que nuestros agentes usan al crear contenido.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdminUser && (
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 text-slate-800 border-2 border-indigo-200/80 font-black rounded-2xl transition-all text-sm shadow-xs"
              title="Crear o gestionar empresas de prueba"
            >
              <span>🧪</span> Empresas de Prueba
              {testProfiles.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                  {testProfiles.length}
                </span>
              )}
            </button>
          )}
          {isMenuEnabled && (
            <Link
              href="/automatizacion-rrss/panel/menu-qr"
              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 font-black rounded-2xl transition-all text-sm shadow-xs"
            >
              <span>📱</span> Carta Menú & QR
            </Link>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/30 text-sm"
          >
            + Agregar ítem
          </button>
        </div>
      </div>

      {/* ── Banner: Modo Empresa de Prueba Activa ── */}
      {isAdminUser && isTestCompany && (
        <div className="mb-8 p-5 sm:p-6 rounded-3xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-sm animate-in fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-amber-500/30">
                {activeProfile?.icon || '🧪'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                    🧪 Empresa de Prueba
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {activeProfile?.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">
                    ({activeProfile?.rubro || 'Sin rubro'})
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1 max-w-2xl leading-relaxed">
                  Estás gestionando el catálogo piloto de esta empresa. Los productos y fotos que subas aquí serán usados por nuestros agentes para diseñar su estrategia de contenidos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Link
                href="/automatizacion-rrss/panel/estrategia"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <span>🚀 Planificar Estrategia</span>
                <span>→</span>
              </Link>
              <Link
                href="/automatizacion-rrss/panel"
                className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1"
              >
                <span>📅 Ver Posts</span>
              </Link>
              <button
                onClick={() => setActiveProfile('default')}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs transition-all border border-slate-200"
                title="Volver a tu cuenta principal"
              >
                🏢 Cuenta Principal
              </button>
              <button
                onClick={() => setShowTestModal(true)}
                className="px-3 py-2.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-black rounded-xl text-xs transition-all"
                title="Gestionar empresas de prueba"
              >
                ⚙️ Cambiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner: Acceso Admin a Empresas de Prueba (si no está activa una de prueba) ── */}
      {isAdminUser && !isTestCompany && (
        <div className="mb-8 p-5 sm:p-6 rounded-3xl border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-indigo-600/30">
                🧪
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    Modo Admin: Empresas de Prueba para Estrategias
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                    santisoftai
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl leading-relaxed">
                  Crea empresas piloto (gastronomía, estética, fitness, clínicas, etc.) con catálogos y fotos reales en 1 clic para probar la estrategia y ver cómo quedan los posts generados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {testProfiles.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setActiveProfile(e.target.value);
                    }
                  }}
                  defaultValue=""
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="" disabled>
                    Seleccionar Empresa ({testProfiles.length})...
                  </option>
                  {testProfiles.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.icon || '🏢'} {tp.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowTestModal(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-slate-900/10 flex items-center gap-1.5"
              >
                <span>+ Crear Empresa de Prueba</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner de Habilitación de Carta Menú Digital & QR ── */}
      <div className={`mb-8 p-5 sm:p-6 rounded-3xl border-2 transition-all ${
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

      {success && (
        <div className="mb-6 px-5 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-2xl text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <span className="text-6xl mb-4">📦</span>
          <h3 className="text-xl font-black text-slate-700 mb-2">Aún no tienes ítems</h3>
          <p className="text-slate-400 text-sm font-medium mb-6">
            Agrega tus productos o servicios clave para que nuestros agentes los incluyan al idear contenido.
          </p>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm transition-all"
          >
            + Agregar mi primer ítem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
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
                  <button onClick={() => openEdit(item)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-all">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(item.id!)} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-xs rounded-xl transition-all">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-7">
              <h2 className="text-2xl font-black text-slate-900 mb-1">{editingItem ? 'Editar ítem' : 'Nuevo ítem'}</h2>
              <p className="text-slate-400 text-sm font-medium mb-6">
                {editingItem ? 'Actualiza los datos del producto/servicio.' : 'Completa los datos para agregarlo a tu catálogo.'}
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Imagen referencial</label>
                <div 
                  className="h-36 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors overflow-hidden bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl block mb-1">🖼️</span>
                      <span className="text-xs text-slate-400 font-bold">Click para subir imagen</span>
                      <span className="text-[10px] text-slate-300 font-medium block mt-1">JPG, PNG, WebP — máx 5 MB</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Nombre *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ej: Consulta de Valoración"
                  className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Descripción *</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={3}
                  placeholder="Describe brevemente este producto o servicio para que los agentes lo entiendan y lo promocionen correctamente."
                  className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Tipo *</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value as 'producto'|'servicio'})}
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none bg-white"
                  >
                    <option value="producto">Producto</option>
                    <option value="servicio">Servicio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Categoría (Carta / Menú)</label>
                  <input 
                    type="text" 
                    list="category-suggestions"
                    value={form.category || ''} 
                    onChange={e => setForm({...form, category: e.target.value})}
                    placeholder="Ej: Cafetería, Sandwiches, Postres..."
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                  />
                  <datalist id="category-suggestions">
                    <option value="Cafetería" />
                    <option value="Panadería & Pastelería" />
                    <option value="Sandwiches & Hamburguesas" />
                    <option value="Platos Principales" />
                    <option value="Bebidas & Jugos" />
                    <option value="Postres" />
                    <option value="Promociones & Combos" />
                    <option value="Servicios Destacados" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Precio Normal (opcional)</label>
                  <input 
                    type="text" 
                    value={form.price || ''} 
                    onChange={e => setForm({...form, price: e.target.value})}
                    placeholder="Ej: $4.990 o $10 USD"
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Precio Oferta / Promo</span>
                    <span className="text-[10px] text-rose-600 font-black uppercase tracking-wider">Destacado</span>
                  </label>
                  <input 
                    type="text" 
                    value={form.offerPrice || ''} 
                    onChange={e => setForm({...form, offerPrice: e.target.value})}
                    placeholder="Ej: $3.990 o 2x1"
                    className="w-full border-2 border-rose-200 focus:border-rose-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors bg-rose-50/20"
                  />
                </div>
              </div>

              {/* Opción de usar precios en publicaciones */}
              <div className="mb-4 p-3.5 rounded-2xl border-2 border-amber-100 bg-amber-50/40">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="includePriceInCopy"
                    checked={form.includePriceInCopy !== false}
                    onChange={(e) => setForm({ ...form, includePriceInCopy: e.target.checked })}
                    className="mt-1 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="includePriceInCopy" className="cursor-pointer">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>🏷️</span> Incluir precio u oferta en la redacción de publicaciones
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                      Nuestros agentes destacarán el precio o descuento en el texto y llamado a la acción al planificar o generar contenido sobre este ítem.
                    </p>
                  </label>
                </div>
              </div>

              {/* Opción de Foto Real Intocable vs Retoque IA */}
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
                      <span>📸</span> Usar foto real intacta (Sin retoque de imagen)
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                      Recomendado para comida, panadería y productos reales: nuestros agentes mantendrán tu fotografía original exacta y sólo superpondrán textos publicitarios, ofertas o precios.
                    </p>
                  </label>
                </div>

                {(form.keepOriginalPhoto ?? true) && (
                  <div className="pt-2 border-t border-indigo-100/80">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Estilo Tipográfico para Banners & Ofertas
                    </label>
                    <select
                      value={form.fontStyle || 'script_handwritten'}
                      onChange={(e) => setForm({ ...form, fontStyle: e.target.value as any })}
                      className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none bg-white"
                    >
                      <option value="script_handwritten">✍️ Cursiva Cálida (Estilo Cafetería / Panadería / Buenos Días)</option>
                      <option value="bold_modern">💥 Bold Promocional (Estilo Ofertas / $1.990 / Rappi)</option>
                      <option value="elegant_serif">🍷 Elegante Serif (Estilo Gourmet / Carta)</option>
                      <option value="clean_minimal">⚡ Moderno Sans (Limpio y directo)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving || uploadingImage}
                  className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {(saving || uploadingImage) ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                  ) : (
                    editingItem ? 'Actualizar' : 'Agregar al catálogo'
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal para Administrar y Crear Empresas de Prueba (Admin) */}
      {isAdminUser && (
        <TestCompanyModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          userToken={userToken}
          onCompanyCreated={async () => {
            await loadItems();
          }}
        />
      )}

    </div>
  );
}
