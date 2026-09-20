"use client";

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  business: string;
  location?: string;
  metric?: string;
  avatarUrl?: string;
  initials: string;
  verified?: boolean;
}

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: "t1",
    quote: "Antes perdía 3 a 4 horas a la semana pensando qué publicar y diseñando. Ahora nuestros agentes preparan el contenido automáticamente y las publicaciones se ven mucho más profesionales.",
    name: "Valentina Riquelme",
    business: "Café & Pastelería Del Sol",
    location: "Santiago",
    metric: "Ahorro de ~4 hrs/semana",
    initials: "VR",
    verified: true,
  },
  {
    id: "t2",
    quote: "El módulo de Blog Automático es tremendo. En solo dos meses el sitio empezó a recibir visitas orgánicas y a posicionar palabras clave locales sin gastar un peso en anuncios.",
    name: "Marcelo Torres",
    business: "Consultora MT Growth",
    location: "Viña del Mar",
    metric: "+120% visitas orgánicas",
    initials: "MT",
    verified: true,
  },
  {
    id: "t3",
    quote: "No tengo perfil técnico y lo dejé configurado sola en 15 minutos. Ahora mis redes se mantienen activas de lunes a domingo con publicaciones constantes.",
    name: "Andrea Poblete",
    business: "Clínica Veterinaria San Patricio",
    location: "Concepción",
    metric: "100% publicaciones a tiempo",
    initials: "AP",
    verified: true,
  },
];

export default function TestimonialsSection() {
  return (
    <section id="clientes">
      <div className="wrap">
        <div className="section-head center" data-reveal>
          <span className="eyebrow">Clientes</span>
          <h2>Resultados <em>reales,</em> negocios reales.</h2>
        </div>
        <div className="t-grid" data-reveal>
          {TESTIMONIALS_DATA.map((t) => (
            <div key={t.id} className="t-card">
              {t.metric && (
                <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                  <span>📈</span>
                  <span>{t.metric}</span>
                </div>
              )}
              <p className="t-quote">"{t.quote}"</p>
              <div className="t-who">
                <div className="t-avatar">
                  {t.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.avatarUrl}
                      alt={t.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{t.initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="t-name flex items-center gap-1.5">
                    <span>{t.name}</span>
                    {t.verified && (
                      <span
                        title="Cliente verificado"
                        className="text-[12px] text-emerald-400 leading-none"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="t-biz">
                    {t.business} {t.location ? `· ${t.location}` : ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
