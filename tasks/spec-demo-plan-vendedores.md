# Spec: Auditoría de Feed de Instagram + Plan Demo Interactivo de 14 Días en Panel de Vendedores

## Assumptions (Supuestos Base)
1. **Público Objetivo**: Vendedores comerciales de Santisoft / SocialPilot que prospectan negocios locales y PyMEs (gastronomía, estética, retail, servicios profesionales, salud) vía WhatsApp o en reuniones presenciales.
2. **Entrada Flexible**: El vendedor puede generar la propuesta de dos formas:
   - **Modo Visión (Recomendado)**: Sube 1 o 2 capturas de pantalla del feed actual de Instagram del cliente. Nuestros agentes extraen automáticamente su estilo visual, platos/servicios, precios habituales y detectan fugas de conversión.
   - **Modo Manual**: Escribe nombre del negocio, rubro y agrega viñetas rápidas de productos y promociones clave.
3. **Estrategia Híbrida de Rendimiento**:
   - Generación instantánea (10-15s) de la **Auditoría de Feed** + **Plan Estratégico Completo de 14 Días** (14 posts de feed con copies y justificación de arte + 14 historias con stickers e interacción) + **4 Afiches Comerciales renderizados**.
   - Los otros 10 días se presentan con toda la pauta, copy y boceto de arte listos, con opción de renderizar su imagen bajo demanda en 8 segundos (*"Renderizar imagen de este día ahora"*).
4. **Compatibilidad y Aislamiento en `/m/[id]`**:
   - La vista pública del cliente (`/m/[id]`) incorporará el diseño interactivo probado en `demo-plan-mania` (tema claro, selector de días 1 al 14, tab de Post de Feed, Story interactiva, Dirección de Arte y Radar de Nicho).
   - **Regla Estricta de Aislamiento Público**: Esta página NO debe tener ningún enlace hacia el interior de la app o panel (`/automatizacion-rrss/...`). **Únicamente debe contener enlaces hacia Selección de Planes (`/planes`), Iniciar Sesión / Registro (`/login`), o contacto directo por WhatsApp con el vendedor**.
5. **Reglas de Oro de Copywriting**: En todo el flujo rige de forma inquebrantable `AGENTS.md`:
   - Español LATAM conversacional y directo ("tú a tú").
   - Cero muletillas de IA (*"En el vertiginoso mundo"*, *"En conclusión"*, etc.).
   - Siempre hablar de **"nuestros agentes"** o **"nuestro equipo de agentes especializados"** (cero menciones a "IA" o "Inteligencia Artificial").

---

## 1. Objective
Dotar al **Panel de Vendedores (`/vendedores`)** y a la **Página Pública de Propuesta (`/m/[id]`)** de un sistema de prospección de alto impacto que multiplique la tasa de cierre de ventas:
1. **Auditoría de Instagram Automatizada**: Analizar la captura del feed del cliente con agentes de visión para entregar un diagnóstico inmediato (puntaje 1-100, 3 fugas de venta actuales y 3 soluciones inmediatas).
2. **Plan de 14 Días Personalizado**: Generar un plan quincenal de alto impacto con radar de nicho, combinando posts con cartel publicitario (tipografías y layouts estratégicos) y fotografías limpias, más historias diarias interactivas.
3. **Generación de Muestras Visuales con Marca**: Crear las piezas clave con el logo y estética del cliente para provocar el efecto *"este equipo ya entendió mi negocio mejor que cualquier agencia"*.
4. **Mensaje de WhatsApp de Cierre**: Armar el copy de prospección personalizado para que el vendedor envíe la propuesta con 1 toque.

---

## 2. Tech Stack & Commands
- **Framework**: Next.js 15 (App Router), React 19, TypeScript.
- **Styling**: Tailwind CSS (esquema claro, limpio y accesible acorde al rediseño de Manía Restobar).
- **Backend / Database**: Firebase Firestore (`admin_demos`, `prospect_demos`), Firebase Storage para screenshots y afiches.
- **Modelos de Agentes**:
  - `gemini-3.7-flash` / Gemini Multimodal Vision (a través de `src/lib/gemini-free.ts`) para lectura de capturas de Instagram y extracción de catálogo.
  - Generación de imágenes publicitarias con tipografía integrada y afiches comerciales vía n8n webhook / Gemini Image Generation.
- **Commands**:
  ```bash
  # Verificación de tipos estática
  npx tsc --noEmit

  # Servidor local de desarrollo
  npm run dev

  # Compilación de producción
  npm run build
  ```

---

## 3. Project Structure
```text
src/
├── types/
│   └── demo-plan.ts                                  # Tipos TypeScript para Auditoría de Feed y Plan 14 Días
├── lib/
│   ├── feed-analyzer.ts                              # Orquestador del análisis de imagen del feed de Instagram
│   └── plan-14-days-generator.ts                     # Generador de los 14 días con radar de nicho y dirección de arte
├── app/
│   ├── api/
│   │   ├── vendedores/
│   │   │   ├── analyze-feed-screenshot/route.ts      # Endpoint: Visión multimodal sobre la captura del Instagram
│   │   │   └── generate-14day-plan/route.ts          # Endpoint: Generación del plan 14 días + auditoría + afiches iniciales
│   │   └── public/
│   │       └── muestras/
│   │           └── [id]/
│   │               └── render-day/route.ts           # Endpoint: Renderizado bajo demanda de un día específico
│   ├── vendedores/
│   │   └── page.tsx                                  # Panel del vendedor con nuevo tab/modal "Auditoría + Plan 14 Días"
│   └── m/
│       └── [id]/
│           └── page.tsx                              # Vista pública de propuesta enriquecida con Auditoría y Plan 14 Días
```

---

## 4. Code Style & Data Contracts

### 4.1. Interfaces Principales (`src/types/demo-plan.ts`)
```typescript
export interface FeedAuditDiagnosis {
  overallScore: number; // 0 a 100
  brandAestheticSummary: string;
  detectedStrengths: string[]; // 3 aciertos actuales
  detectedFlaws: string[];     // 3 fugas de venta o fallas visuales
  suggestedPillars: string[];  // 3 a 4 pilares recomendados
  extractedProducts: {
    name: string;
    description?: string;
    estimatedPrice?: string;
    isPromotion?: boolean;
  }[];
}

export interface PlanDayArtDirection {
  layout: "split_left" | "split_right" | "top_banner" | "bottom_third" | "recipe_ingredients" | "clean_photo";
  layoutLabel: string;
  fontStyle: "bold_modern" | "elegant_serif" | "serif_script_mix" | "clean_minimal" | "script_handwritten";
  fontLabel: string;
  reasoning: string;
}

export interface PlanDayPost {
  format: "Post" | "Reel" | "Carrusel";
  headline: string;
  productName: string;
  price: string;
  isPromo: boolean;
  hasText: boolean;
  artDirection: PlanDayArtDirection;
  hook: string;
  copy: string;
  cta: string;
  imageUrl?: string;
  compositionDirective: string;
  isRendered: boolean;
}

export interface PlanDayStory {
  time: string;
  objective: string;
  hook: string;
  interactiveType: "Encuesta" | "Deslizador" | "Caja de Preguntas" | "Cuenta Regresiva" | "Link WhatsApp" | "Votación 2x1";
  interactiveLabel: string;
  slideTexts: string[];
  visualRecommendation: string;
}

export interface Plan14DayItem {
  day: number;
  weekday: string;
  nicheTrend: string;
  nicheInsight: string;
  post: PlanDayPost;
  story: PlanDayStory;
}

export interface FullDemoPlanData {
  id?: string;
  prospectName: string;
  prospectBusiness: string;
  prospectPhone?: string;
  rubro: string;
  feedScreenshotUrl?: string;
  feedAudit?: FeedAuditDiagnosis;
  plan14Days: Plan14DayItem[];
  anchorRenderedDays: number[]; // ej. [1, 3, 5, 7]
  sellerName?: string;
  sellerPhone?: string;
  createdAt: string;
}
```

---

## 5. Testing & Verification Strategy
1. **Type Check**: `npx tsc --noEmit` debe pasar con 0 errores antes y después de cada integración.
2. **Prueba de Extracción Visual (Vision Test)**:
   - Cargar una captura de pantalla de un feed gastronómico o comercial (ej. Manía Restobar o similar).
   - Verificar que el endpoint `/api/vendedores/analyze-feed-screenshot` devuelva JSON válido con:
     - Score numérico entre 40 y 90.
     - 3 aciertos y 3 fugas de venta realistas y aplicadas al negocio.
     - Lista de al menos 3 a 5 productos o platos extraídos visualmente de la foto.
3. **Prueba de Generación del Plan 14 Días**:
   - Generar el plan completo y comprobar que los 14 días tengan copies 100% humanizados (sin clichés de IA) y justificaciones de arte variadas.
   - Verificar que los 4 días ancla generen su imagen publicitaria correctamente.
4. **Prueba de Renderizado Bajo Demanda**:
   - Desde la vista `/m/[id]` o desde el panel de vendedores, pinchar un día no renderizado (ej. Día 10) y hacer clic en *"Renderizar imagen de este día"*.
   - Confirmar que actualice el documento en Firestore y muestre la imagen sin recargar la página.
5. **Prueba Móvil en `/m/[id]`**:
   - Verificar visualización fluida y carga instantánea en pantallas de 375px a 1440px en modo claro.

---

## 6. Boundaries
- **Always do**:
  - Aplicar las directrices de `AGENTS.md`: Tono cercano, humano, "tú a tú", sin muletillas corporativas ni de IA.
  - Hablar exclusivamente de **"nuestros agentes"** en cualquier texto visible para el vendedor o el cliente.
  - Mantener retrocompatibilidad con las muestras existentes creadas en `/vendedores` y `/m/[id]`.
- **Ask first**:
  - Modificar esquemas de autenticación o reglas de seguridad críticas en Firestore.
  - Aumentar el límite de imágenes pre-renderizadas automáticas por encima de 4 (para proteger cuotas y tiempo de respuesta).
- **Never do**:
  - Bloquear la interfaz del vendedor con esperas síncronas de más de 30 segundos.
  - Exponer claves secretas de API en componentes cliente (`use client`).

---

## 7. Success Criteria
- [ ] En `/vendedores` existe un botón o tarjeta destacada: **"Auditoría de Feed + Plan 14 Días"**.
- [ ] El vendedor puede arrastrar/subir una captura de Instagram del cliente; nuestros agentes detectan los productos, precios y las fugas de conversión en menos de 8 segundos.
- [ ] El vendedor puede pulsar **"Crear Plan Demo 14 Días"** y obtener el enlace público en menos de 20 segundos.
- [ ] En `/m/[id]`, el prospecto puede revisar la **Auditoría de su Feed** y navegar por los **14 Días** (con el mismo nivel de detalle, copies, stories y dirección de arte que creamos para Manía Restobar).
- [ ] La vista pública `/m/[id]` está 100% aislada: no contiene links al panel ni a la app interna, únicamente a **Selección de Planes**, **Iniciar Sesión** y **WhatsApp del Vendedor**.
- [ ] El cliente y el vendedor pueden renderizar cualquiera de los días restantes con 1 clic directo.
- [ ] El generador de mensajes de WhatsApp produce un copy de prospección irresistible con enlace directo a la propuesta.
