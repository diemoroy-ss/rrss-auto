"use client";

import { useState, useEffect, useRef } from 'react';
import { auth } from '../../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProfile } from '../../../../contexts/ProfileContext';
import type { CatalogoItem } from '../../../../contexts/ProfileContext';
import Link from 'next/link';

const EMPTY_FORM: Omit<CatalogoItem, 'id' | 'createdAt' | 'active'> = {
  name: '',
  description: '',
  type: 'producto',
  price: '',
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
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile } = useProfile();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
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
      price: item.price || '',
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Productos & Servicios</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            El catálogo de {activeProfile?.name || 'tu marca'} — las referencias que nuestros agentes usan al crear contenido.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/30 text-sm"
        >
          + Agregar ítem
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
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.type === 'producto' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                  {item.type}
                </span>
                {item.keepOriginalPhoto !== false && item.imageUrl && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                    <span>📸</span> Foto Real
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-black text-slate-900 text-base leading-tight">{item.name}</h3>
                  {item.price && <span className="text-emerald-600 font-black text-sm whitespace-nowrap">{item.price}</span>}
                </div>
                <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-4">{item.description}</p>
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

              <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Precio (opcional)</label>
                  <input 
                    type="text" 
                    value={form.price} 
                    onChange={e => setForm({...form, price: e.target.value})}
                    placeholder="Ej: $15.000 o Desde $10 USD"
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-colors"
                  />
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

    </div>
  );
}
