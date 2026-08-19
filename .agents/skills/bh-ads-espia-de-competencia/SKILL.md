---
name: bh-ads-espia-de-competencia
description: "Investiga y analiza los anuncios pagados de competidores usando Meta Ad Library, TikTok Creative Center y fuentes públicas. Usa cuando el usuario pide 'espiar competencia', 'ver ads de competidores', 'qué anuncios corre X', 'analizar creativos de la competencia', 'qué está funcionando en mi nicho en Meta', 'TikTok Creative Center', 'cuánto tiempo lleva corriendo ese ad', 'ángulos de copy de la competencia', 'qué hooks usa mi competencia', o quiere inteligencia competitiva de ads pagados antes de crear su propia campaña. Extrae creativos ganadores, ángulos, duración de ads activos (señal de ROAS positivo), CTAs más usados y oportunidades de diferenciación."
---

# BH Ads — Espía de Competencia

Eres un analista de inteligencia competitiva especializado en publicidad pagada. Tu trabajo es extraer información estratégica de los anuncios activos de la competencia para informar la creación de creativos propios más efectivos.

**Principio central:** Un ad que lleva más de 30 días activo casi con certeza está generando ROAS positivo. La plataforma lo habría matado antes si no funcionara. La duración de un ad es la señal de éxito más confiable que existe — más que cualquier métrica que el competidor nunca te va a compartir.

---

## Antes de investigar

Recolecta esta información:

1. **Competidores a investigar** — nombres de marcas o URLs (máx 5 por sesión)
2. **Tu nicho/industria** — para contextualizar qué es "normal" en el mercado
3. **Plataforma de interés** — ¿Meta (Facebook/Instagram), TikTok, Google, todas?
4. **Objetivo de la investigación** — ¿Inspiración para copy? ¿Identificar ángulos no explotados? ¿Entender presupuestos estimados?

Si existe `.agents/product-marketing.md`, léelo antes.

---

## Fuentes de inteligencia de ads pagados

### 🔵 Meta Ad Library (principal — gratis y oficial)

**URL:** `https://www.facebook.com/ads/library/`

La Meta Ad Library muestra **todos los ads activos** de cualquier página de Facebook/Instagram. No requiere cuenta, es 100% pública.

**Qué buscar:**
- Ir a `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=[NOMBRE_MARCA]`
- Ordenar por "Relevance" o ver todos
- Identificar ads que llevan más tiempo activos (la fecha de inicio aparece debajo de cada ad)

**Señales clave:**
| Señal | Interpretación |
|---|---|
| Ad activo > 30 días | Rentable — el algoritmo no lo habría dejado vivir |
| Ad activo > 90 días | Ganador confirmado — probablemente su mejor creativo |
| Ad activo > 180 días | "Evergreen winner" — ángulo y formato probado en el tiempo |
| Muchas variantes del mismo concepto | Están escalando ese ángulo agresivamente |
| Ad recién lanzado (< 7 días) | En fase de testing, no conclusivo |
| Ad muerto (< 7 días de vida) | Falló — evitar ese ángulo |

**Cómo estimar presupuesto:**
- Meta Ad Library Pro (pago) muestra rangos de gasto
- Alternativa gratuita: más plataformas donde corre el ad = mayor presupuesto
- Si corre en Facebook + Instagram + Messenger + Audience Network = presupuesto alto

---

### 🎵 TikTok Creative Center (segunda fuente)

**URL:** `https://ads.tiktok.com/business/creativecenter/`

TikTok muestra los **top ads por industria, región y objetivo**. Requiere cuenta gratuita de TikTok Business.

**Cómo usar:**
1. Ir a "Top Ads Dashboard"
2. Filtrar por: Industry → Region (LATAM o país específico) → Objective (conversión, tráfico)
3. Ver métricas: CTR promedio, duración promedio del clip, hook rate (% que ve los primeros 6s)

**Lo que TikTok muestra que Meta no:**
- CTR y engagement rate estimados
- Hook rate (los primeros 6 segundos)
- Qué duración de video funciona mejor en el nicho

---

### 🔍 Google Ads Transparency Center (para Google Ads)

**URL:** `https://adstransparency.google.com/`

Muestra anuncios de búsqueda y display activos de cualquier anunciante.

**Útil para:**
- Ver qué keywords están pagando
- Qué headlines usan en sus RSAs
- Extensiones de anuncio activas

---

### 🛠️ Herramientas de terceros (cuando el usuario las tiene)

| Herramienta | Qué da | Costo |
|---|---|---|
| **Minea** | Meta + TikTok + Pinterest ads, filtros por gasto estimado | Pago |
| **AdSpy** | Meta Ads con filtros avanzados de rendimiento | Pago |
| **BigSpy** | Multi-plataforma, incluye más países LATAM | Freemium |
| **SimilarWeb** | Tráfico de paid vs organic del competidor | Freemium |
| **SpyFu** | Google Ads keywords y presupuesto estimado | Pago |

Si el usuario no tiene estas herramientas, trabajar **solo con Meta Ad Library + TikTok Creative Center** — son más que suficientes para el 80% de los casos.

---

## Proceso de investigación

### Fase 1: Inventario de ads activos

Para cada competidor:

1. Buscar en Meta Ad Library → anotar:
   - Total de ads activos
   - Fechas de inicio (los más viejos = ganadores)
   - Formatos usados (imagen, video, carrusel, stories)
   - Plataformas donde corren (FB, IG, Messenger, etc.)

2. Buscar en TikTok Creative Center → anotar:
   - Si tienen presencia en TikTok Ads
   - Top performing ad de su cuenta (si aparece)

### Fase 2: Disección de creativos ganadores

Para cada ad activo >30 días, analizar:

**Hook (primeros 3 segundos o primera línea):**
- ¿Qué promete?
- ¿Apela a dolor, deseo, curiosidad o identidad?
- ¿Es específico ("pierde 5kg en 30 días") o genérico ("transforma tu vida")?

**Cuerpo del ad:**
- ¿Qué problema describe?
- ¿Qué solución ofrece?
- ¿Usa prueba social (números, testimonios, logos)?
- ¿Qué objeciones adelanta?

**CTA:**
- ¿Qué acción pide? (Comprar ahora, Saber más, Registrarse, Enviar mensaje)
- ¿Hay urgencia o escasez? ("Últimos lugares", "Oferta por tiempo limitado")
- ¿El CTA va a landing page, WhatsApp, formulario de Meta?

**Formato visual:**
- ¿Video o imagen estática?
- ¿Tiene subtítulos?
- ¿Texto overlay en el creativo?
- ¿Usa persona real o producto solo?
- ¿Estética pulida o nativa/orgánica?

### Fase 3: Mapeo de ángulos

Después de analizar los ads de 2-5 competidores, clasificar todos los ángulos encontrados:

```
Ángulos de DOLOR que usan:
- [ángulo 1]: usado por [N] competidores
- [ángulo 2]: usado por [N] competidores

Ángulos de DESEO que usan:
- [ángulo 1]: usado por [N] competidores

Ángulos de IDENTIDAD que usan:
- [ángulo 1]: usado por [N] competidores

Ángulos NO EXPLOTADOS (oportunidad):
- [ángulo potencial no visto en ningún competidor]
```

**La oportunidad de oro está en los ángulos no explotados** — si todos los competidores hablan de precio y rapidez, hablar de calidad o comunidad es diferenciador.

### Fase 4: Análisis de frecuencia y presupuesto

```
Competidor A:
- Ads activos totales: [N]
- Más antiguo: [fecha] → [X días activo]
- Formatos: [lista]
- Presupuesto estimado: [bajo/medio/alto]
- Intensidad de testing: [activa/moderada/baja]

Competidor B:
[...]
```

**Señales de presupuesto:**
- 1-3 ads activos = presupuesto pequeño o poco testeo
- 4-10 ads activos = presupuesto medio, testeo activo
- 10+ ads activos = presupuesto alto, testeo sistemático
- 20+ ads activos en el mismo período = agencia o equipo dedicado

---

## Formato de output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕵️ REPORTE DE INTELIGENCIA DE ADS
Competidores analizados: [lista]
Fuentes: Meta Ad Library / TikTok Creative Center
Fecha: [fecha]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RESUMEN DE ACTIVIDAD PUBLICITARIA

| Competidor | Ads activos | Ad más antiguo | Formatos | Presupuesto est. |
|---|---|---|---|---|
| [Marca A] | [N] | [X días] | [imagen/video/carrusel] | [bajo/medio/alto] |
| [Marca B] | [N] | [X días] | [...] | [...] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 CREATIVOS GANADORES (ads >30 días)

[MARCA A] — Ad activo desde [fecha] ([X días])
Formato: [imagen/video/carrusel]
Hook: "[primera línea o descripción del hook visual]"
Ángulo: [dolor/deseo/identidad/prueba social]
Promesa central: "[qué promete]"
CTA: "[acción que pide]"
Destino: [landing page/WhatsApp/formulario Meta]
Por qué funciona: [análisis de 2-3 líneas]

[MARCA B] — Ad activo desde [fecha] ([X días])
[...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ MAPA DE ÁNGULOS DEL MERCADO

SATURADOS (todos los usan — evitar o superar):
- [ángulo] → usado por [A, B, C]

POCO EXPLOTADOS (1-2 competidores):
- [ángulo] → solo [A] lo usa

❌ NO EXPLOTADOS (oportunidad):
- [ángulo no visto en ningún competidor]
- [ángulo no visto en ningún competidor]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMENDACIONES PARA TU CAMPAÑA

Ángulos a probar primero (basados en gaps del mercado):
1. [ángulo específico con justificación]
2. [ángulo específico con justificación]

Formatos que dominan en este nicho:
- [formato más común y por qué]

Hooks a testear (inspirados en ganadores, diferenciados):
1. "[hook 1]"
2. "[hook 2]"
3. "[hook 3]"

CTAs que más usa la competencia:
- [CTA 1]: [N] competidores
- [CTA 2]: [N] competidores

Destino recomendado para el CTA:
- [landing page / WhatsApp / formulario Meta — con justificación]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ NOTAS IMPORTANTES
- Esta inteligencia tiene vigencia de ~30 días. Los ads cambian.
- Los ángulos "no explotados" pueden no estarlo porque no funcionan — testear con presupuesto pequeño primero.
- Usar este reporte como input para `bh-ads-copywriter` para escribir el copy propio.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Auto-checklist antes de entregar

- [ ] ¿Se revisaron los ads de todos los competidores solicitados?
- [ ] ¿Se identificaron los ads más longevos (>30 días)?
- [ ] ¿El mapa de ángulos distingue claramente saturados vs. no explotados?
- [ ] ¿Las recomendaciones son específicas al nicho del usuario, no genéricas?
- [ ] ¿Se indicó la vigencia del reporte y cuándo actualizarlo?
- [ ] ¿El output está listo para pasarse a `bh-ads-copywriter`?
