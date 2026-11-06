# Implementation Plan: Auditoría de Feed de Instagram + Plan Demo Interactivo de 14 Días para Vendedores

## Overview
Implementar en el **Panel de Vendedores (`/vendedores`)** y en la **Vista Pública de Propuesta (`/m/[id]`)** una suite comercial de prospección consultiva. El sistema permite al vendedor subir 1 o 2 capturas de pantalla del feed actual de Instagram de un prospecto (o ingresar sus datos manualmente), para que nuestros agentes analicen su estética, extraigan su oferta y generen:
1. Una **Auditoría del Feed Actual** con puntaje visual, 3 fugas de venta y 3 correcciones estratégicas.
2. Un **Plan Estratégico de 14 Días** (idéntico en profundidad al desarrollado para Manía Restobar: posts con carteles de alta conversión y fotos limpias, historias diarias interactivas, horarios y justificación de arte).
3. **4 Muestras Publicitarias ya renderizadas** (Días 1, 3, 5 y 7) con opción de renderizar cualquiera de los 10 días restantes bajo demanda con 1 solo toque.
4. Un **Copy de WhatsApp de Cierre de Alto Impacto** con enlace interactivo directo.

---

## Dependency Graph
```text
1. Tipos y Contratos (src/types/demo-plan.ts)
       │
       ├── 2. Endpoints Backend / Agentes
       │       ├── 2.1 /api/vendedores/analyze-feed-screenshot (Gemini Multimodal Vision)
       │       ├── 2.2 /api/vendedores/generate-14day-plan (Estrategia 14 Días + 4 Afiches Ancla)
       │       └── 2.3 /api/public/muestras/[id]/render-day (Renderizado bajo demanda de días 2, 4, 6..14)
       │
       ├── 3. Panel de Vendedores (src/app/vendedores/page.tsx)
       │       ├── 3.1 Selector de Flujo: "⚡ Muestra Rápida" vs "📡 Auditoría + Plan 14 Días"
       │       ├── 3.2 Subida y análisis de captura de Instagram (pre-llenado automático de productos)
       │       └── 3.3 Generador de mensaje de WhatsApp adaptado a la Auditoría y Plan
       │
       └── 4. Página Pública Interactiva del Cliente (src/app/m/[id]/page.tsx)
               ├── 4.1 Tab 1: Diagnóstico de Instagram Actual (Antes vs. Después)
               ├── 4.2 Tab 2: Planificador Interactivo 14 Días (Estilo Manía Restobar)
               └── 4.3 Tab 3: Cierre y Activación (WhatsApp directo al vendedor / Contratar)
```

---

## Architecture Decisions
1. **Gemini Vision Nativo vía `generateFreeText`**:
   - `src/lib/gemini-free.ts` ya cuenta con soporte nativo de imágenes (`imageUrl` $\rightarrow$ `inlineData` base64). Utilizaremos esta capacidad para analizar la captura del feed sin dependencias adicionales.
2. **Estrategia Híbrida de Rendimiento**:
   - Generar 14 imágenes al mismo tiempo demora más de 2 minutos y satura conexiones móviles de los vendedores.
   - En su lugar, el endpoint genera en 12 segundos **los 14 días de contenido, copies e historias**, y renderiza de inmediato las **4 imágenes ancla principales**.
   - Los otros 10 días se pueden renderizar en cualquier momento con 1 clic usando el endpoint `/api/public/muestras/[id]/render-day`.
3. **Reutilización del Componente Probado de Manía Restobar**:
   - Adaptaremos la arquitectura modular de `src/app/demo-plan-mania/page.tsx` (con su tema claro `bg-slate-50`, selector de días 1 al 14, tab de post, tab de story 9:16 y justificación de arte) para que renderice dinámicamente cualquier `prospect_demos` que cuente con `plan14Days`.
4. **Cumplimiento Inflexible de `AGENTS.md`**:
   - Todos los copies generados usan tono tú a tú chileno/latinoamericano, cero muletillas de IA, y toda referencia tecnológica se atribuye a **"nuestros agentes"**.

---

## Phases & Checkpoints

### Phase 1: Tipos de Datos y Agente de Visión Multimodal
- **Task 1**: Crear `src/types/demo-plan.ts` con las interfaces completas (`FeedAuditDiagnosis`, `Plan14DayItem`, `FullDemoPlanData`).
- **Task 2**: Crear el endpoint `src/app/api/vendedores/analyze-feed-screenshot/route.ts` que recibe la captura de Instagram y devuelve el diagnóstico y catálogo preliminar.

#### Checkpoint 1: Foundation
- [ ] `npx tsc --noEmit` pasa con 0 errores.
- [ ] El endpoint de visión procesa una imagen y devuelve JSON estructurado con score, fortalezas, debilidades y productos detectados.

---

### Phase 2: Generador del Plan 14 Días y Renderizado Bajo Demanda
- **Task 3**: Crear `src/app/api/vendedores/generate-14day-plan/route.ts`:
  - Recibe datos del negocio, rubro, productos, diagnóstico y teléfono.
  - Orquesta a nuestros agentes para redactar los 14 posts de feed (con hooks, copies y directivas de arte) y las 14 historias diarias.
  - Renderiza las 4 imágenes ancla y guarda el documento en Firestore (`admin_demos`).
- **Task 4**: Crear `src/app/api/public/muestras/[id]/render-day/route.ts` para renderizar cualquier día restante bajo demanda.

#### Checkpoint 2: Generation Engine
- [ ] `npx tsc --noEmit` pasa con 0 errores.
- [ ] Se crea una propuesta con los 14 días en Firestore y las 4 imágenes iniciales cargadas.
- [ ] El renderizado bajo demanda genera la imagen de un día específico y actualiza Firestore en caliente.

---

### Phase 3: Panel de Vendedores (Creación y WhatsApp)
- **Task 5**: En `src/app/vendedores/page.tsx`:
  - Agregar la opción de **"📡 Auditoría de Instagram + Plan 14 Días"**.
  - Dropzone para subir la captura del Instagram con previsualización.
  - Botón de escaneo rápido con agentes que auto-completa el rubro, productos y diagnóstico.
  - Integración del mensaje de WhatsApp de prospección adaptado a la auditoría.

#### Checkpoint 3: Seller UI
- [ ] El vendedor puede subir una captura de Instagram y ver el diagnóstico previo en segundos.
- [ ] Puede generar el plan completo y copiar el mensaje de WhatsApp con 1 clic.

---

### Phase 4: Página Pública de la Propuesta (`/m/[id]`)
- **Task 6**: En `src/app/m/[id]/page.tsx`:
  - Si la propuesta contiene `plan14Days`, mostrar la experiencia interactiva completa:
    1. Sección superior: **Diagnóstico del Feed Actual** (Puntaje y 3 fugas detectadas).
    2. Sección central: **Planificador de 14 Días** (selector 1..14, post, story 9:16, dirección de arte).
    3. Botón *"Renderizar afiche"* en días no renderizados.
    4. Sección inferior: **Cierre y Activación**: Aislamiento estricto sin links al panel interno; solo botones a **Selección de Planes** (`/planes`), **Iniciar Sesión** (`/login`) y **WhatsApp directo del vendedor**.

#### Checkpoint 4: Final Verification
- [ ] `npx tsc --noEmit` con 0 errores.
- [ ] La propuesta en `/m/[id]` es 100% responsiva, en tema claro elegante y permite explorar los 14 días.
