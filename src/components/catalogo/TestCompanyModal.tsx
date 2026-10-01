"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../contexts/ProfileContext';
import { TEST_COMPANY_TEMPLATES, TestCompanyTemplate } from '../../lib/test-company-templates';

interface TestCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToken: string;
  onCompanyCreated: () => void;
}

export default function TestCompanyModal({
  isOpen,
  onClose,
  userToken,
  onCompanyCreated,
}: TestCompanyModalProps) {
  const router = useRouter();
  const { profiles, activeProfile, setActiveProfile, loadProfiles } = useProfile();
  const [tab, setTab] = useState<'templates' | 'custom' | 'existing'>('templates');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ name: string; profileId: string; productsCount: number } | null>(null);

  // Custom Form State
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('🏢');
  const [customRubro, setCustomRubro] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPromos, setCustomPromos] = useState('');
  const [customPhone, setCustomPhone] = useState('+56 9 1234 5678');
  const [autoGenProducts, setAutoGenProducts] = useState(true);

  const availableIcons = ['🍔', '☕', '💇‍♀️', '🩺', '🏋️', '🍕', '🍣', '🌮', '🐾', '👗', '🍰', '🚗', '🏢', '✨'];

  const testProfiles = profiles.filter((p) => p.isTestProfile === true || p.id.startsWith('prof_test_'));

  if (!isOpen) return null;

  const handleCreateFromTemplate = async (template: TestCompanyTemplate) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/test-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: template.name,
          icon: template.icon,
          rubro: template.rubro,
          businessDescription: template.businessDescription,
          promotions: template.promotions,
          phone: template.phone,
          website: template.website,
          menuDigitalEnabled: template.menuDigitalEnabled,
          menuTheme: template.menuTheme,
          sampleProducts: template.sampleProducts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear empresa de prueba');

      await loadProfiles();
      setActiveProfile(data.profile.id);
      onCompanyCreated();
      setSuccessInfo({
        name: data.profile.name,
        profileId: data.profile.id,
        productsCount: data.productsCreated || 0,
      });
    } catch (e: any) {
      setError(e.message || 'Error inesperado al crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) {
      setError('Por favor indica el nombre de la empresa');
      return;
    }
    setLoading(true);
    setError('');

    // Si marcó autogenerar productos sugeridos según rubro
    const sampleProducts = autoGenProducts
      ? [
          {
            name: `Servicio / Producto Estrella de ${customName}`,
            description: `Nuestra opción más solicitada en ${customRubro || 'nuestro local'}. Calidad garantizada y atención personalizada.`,
            type: 'producto',
            category: 'Especialidades',
            price: '$12.990',
            offerPrice: '$9.990',
            includePriceInCopy: true,
            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
            tags: ['Destacado', 'Oferta', 'Calidad'],
            keepOriginalPhoto: true,
            fontStyle: 'bold_modern',
          },
          {
            name: `Pack Promocional ${customRubro || 'Especial'}`,
            description: `Ideal para conocer todos los beneficios de nuestra propuesta. Incluye asesoría y entrega rápida.`,
            type: 'producto',
            category: 'Promociones',
            price: '$19.990',
            offerPrice: '$16.990',
            includePriceInCopy: true,
            imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
            tags: ['Pack', 'Ahorro', 'Recomendado'],
            keepOriginalPhoto: true,
            fontStyle: 'bold_modern',
          },
          {
            name: `Atención / Asesoría de Entrada`,
            description: `Evaluación personalizada sin compromiso para guiarte en lo que necesitas.`,
            type: 'servicio',
            category: 'Servicios',
            price: '$8.500',
            offerPrice: '$0',
            includePriceInCopy: true,
            imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572244?auto=format&fit=crop&w=800&q=80',
            tags: ['Diagnostico', 'Gratis', 'Asesoria'],
            keepOriginalPhoto: true,
            fontStyle: 'clean_minimal',
          },
        ]
      : [];

    try {
      const res = await fetch('/api/admin/test-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: customName,
          icon: customIcon,
          rubro: customRubro,
          businessDescription: customDesc,
          promotions: customPromos,
          phone: customPhone,
          menuDigitalEnabled: true,
          menuTheme: 'dark_modern',
          sampleProducts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear empresa de prueba');

      await loadProfiles();
      setActiveProfile(data.profile.id);
      onCompanyCreated();
      setSuccessInfo({
        name: data.profile.name,
        profileId: data.profile.id,
        productsCount: data.productsCreated || 0,
      });
    } catch (e: any) {
      setError(e.message || 'Error inesperado al crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestProfile = async (profileId: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la empresa de prueba "${name}"? Se borrarán sus productos del catálogo y sus posts agendados de prueba.`)) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/test-company', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');

      await loadProfiles();
      // Si el activo era este, volver al default
      if (activeProfile?.id === profileId) {
        setActiveProfile('default');
      }
      onCompanyCreated();
    } catch (e: any) {
      setError(e.message || 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl shadow-inner">
              🧪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Empresas de Prueba (Modo Admin)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  santisoftai
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Crea empresas piloto con productos y fotos reales para probar estrategias y ver cómo lucen los posts generados por nuestros agentes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition-all font-light"
          >
            ×
          </button>
        </div>

        {/* Success Banner */}
        {successInfo && (
          <div className="m-6 mb-0 p-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/10 border-2 border-emerald-300 rounded-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    ¡Empresa de prueba &quot;{successInfo.name}&quot; creada y activada!
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Se cargaron {successInfo.productsCount} productos y servicios en su catálogo con fotos, precios y ofertas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSuccessInfo(null);
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  👁️ Ver Catálogo
                </button>
                <button
                  onClick={() => {
                    setSuccessInfo(null);
                    onClose();
                    router.push('/automatizacion-rrss/panel/estrategia');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <span>🚀 Probar Estrategia</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="m-6 mb-0 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
            ⚠️ {error}
          </div>
        )}

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-4 gap-3 bg-slate-50/50 shrink-0">
          <button
            onClick={() => { setTab('templates'); setError(''); }}
            className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
              tab === 'templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>⚡</span>
            <span>Plantillas con Catálogo Listo (1 Clic)</span>
          </button>
          <button
            onClick={() => { setTab('custom'); setError(''); }}
            className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
              tab === 'custom'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>✏️</span>
            <span>Crear a Medida</span>
          </button>
          <button
            onClick={() => { setTab('existing'); setError(''); }}
            className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
              tab === 'existing'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>📂</span>
            <span>Empresas de Prueba ({testProfiles.length})</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TEMPLATES */}
          {tab === 'templates' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-black text-slate-900">
                  Selecciona una plantilla de nicho realista
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Cada plantilla viene configurada con nombre de marca, rubro, descripción, promociones y 4 productos/servicios con fotos reales, precios y ofertas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEST_COMPANY_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all bg-white flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl p-2 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                            {tmpl.icon}
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {tmpl.name}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {tmpl.badge}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 font-medium mb-3 line-clamp-2">
                        {tmpl.businessDescription}
                      </p>

                      {/* Mini Preview de Productos */}
                      <div className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                          <span>📦 4 Productos/Servicios Incluidos:</span>
                          <span className="text-emerald-600 font-bold">Con fotos reales</span>
                        </div>
                        <div className="space-y-1">
                          {tmpl.sampleProducts.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                              <span className="truncate max-w-[200px]">• {p.name}</span>
                              <span className="font-bold text-slate-900 shrink-0">
                                {p.offerPrice ? (
                                  <span className="text-emerald-600">{p.offerPrice}</span>
                                ) : (
                                  p.price
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1 font-semibold mb-4 border border-amber-100">
                        🎁 Promo: {tmpl.promotions}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCreateFromTemplate(tmpl)}
                      disabled={loading}
                      className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{loading ? 'Creando empresa...' : '✨ Crear Empresa con Catálogo Listo'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM */}
          {tab === 'custom' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Crea una empresa de prueba personalizada
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Define el nombre, rubro y características de cualquier negocio para probar cómo reaccionan nuestros agentes al crear contenido.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Empresa de Prueba *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej: Sushibar Tokio Fusión (Prueba)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rubro / Tipo de Negocio
                  </label>
                  <input
                    type="text"
                    value={customRubro}
                    onChange={(e) => setCustomRubro(e.target.value)}
                    placeholder="Ej: Sushi Nikkei & Delivery"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp de Prueba
                  </label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Icono Representativo
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setCustomIcon(ic)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        customIcon === ic
                          ? 'bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción breve del negocio & propuesta de valor
                </label>
                <textarea
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Ej: Rollos de autor con pesca fresca del día, salsas japonesas artesanales y despacho rápido a todo el sector oriente."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Promociones u ofertas activas (Opcional)
                </label>
                <input
                  type="text"
                  value={customPromos}
                  onChange={(e) => setCustomPromos(e.target.value)}
                  placeholder="Ej: Envío gratis en compras sobre $20.000 y 20% OFF días jueves."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="autoGen"
                  checked={autoGenProducts}
                  onChange={(e) => setAutoGenProducts(e.target.checked)}
                  className="mt-0.5 accent-indigo-600 rounded"
                />
                <label htmlFor="autoGen" className="text-xs text-slate-700 font-medium cursor-pointer">
                  <span className="font-bold text-indigo-950">Autocargar 3 productos de prueba sugeridos</span>. Podrás editarlos o cambiarlos con fotos reales en el catálogo en cualquier momento.
                </label>
              </div>

              <button
                onClick={handleCreateCustom}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Creando empresa de prueba...' : '🚀 Crear Empresa de Prueba'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: EXISTING TEST COMPANIES */}
          {tab === 'existing' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-black text-slate-900">
                  Empresas de prueba en tu cuenta
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Conmuta rápidamente entre empresas de prueba o elimina las que ya no necesites para limpiar tu catálogo y calendario de posts.
                </p>
              </div>

              {testProfiles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <span className="text-4xl">🏢</span>
                  <h4 className="text-sm font-bold text-slate-700 mt-2">Aún no has creado empresas de prueba</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Usa la pestaña de plantillas para generar una en 1 clic con catálogo precargado y probar estrategias.
                  </p>
                  <button
                    onClick={() => setTab('templates')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white font-black text-xs rounded-xl"
                  >
                    Ver Plantillas Rápidas
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {testProfiles.map((p) => {
                    const isActive = activeProfile?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                          isActive
                            ? 'bg-indigo-50/50 border-indigo-300 shadow-xs'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-slate-100 rounded-xl">{p.icon || '🏢'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900">{p.name}</h4>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                                  Activa Ahora
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                🧪 Prueba
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {p.rubro || 'Sin rubro asignado'} {p.promotions ? `• ${p.promotions}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isActive && (
                            <button
                              onClick={() => {
                                setActiveProfile(p.id);
                                onClose();
                              }}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all"
                            >
                              Seleccionar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveProfile(p.id);
                              onClose();
                              router.push('/automatizacion-rrss/panel/estrategia');
                            }}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black rounded-xl text-xs transition-all flex items-center gap-1"
                            title="Ir a generar estrategia con esta empresa"
                          >
                            <span>🚀 Estrategia</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTestProfile(p.id, p.name)}
                            disabled={loading}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-sm"
                            title="Eliminar empresa de prueba y sus productos"
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
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium shrink-0">
          <span>Las empresas de prueba quedan aisladas y no afectan las cuentas reales ni las cuotas de clientes.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
