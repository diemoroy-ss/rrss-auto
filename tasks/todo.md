# Tasks: Auditoría de Feed de Instagram + Plan Demo Interactivo de 14 Días para Vendedores

- [x] Task 1: Definir tipos TypeScript en `src/types/demo-plan.ts`
  - Acceptance: Interfaces para `FeedAuditDiagnosis`, `PlanDayArtDirection`, `PlanDayPost`, `PlanDayStory`, `Plan14DayItem` y `FullDemoPlanData` creadas y exportadas sin errores.
  - Verify: `npx tsc --noEmit`
  - Files: `src/types/demo-plan.ts`

- [x] Task 2: Implementar endpoint `/api/vendedores/analyze-feed-screenshot`
  - Acceptance: Endpoint POST que recibe `screenshotUrl` o base64 de la captura de Instagram, llama a Gemini Multimodal Vision con directivas de `AGENTS.md`, y devuelve JSON con `overallScore`, `brandAestheticSummary`, `detectedStrengths`, `detectedFlaws` y `extractedProducts`.
  - Verify: `npx tsc --noEmit` y test con script mock.
  - Files: `src/app/api/vendedores/analyze-feed-screenshot/route.ts`

- [x] Task 3: Implementar endpoint `/api/vendedores/generate-14day-plan`
  - Acceptance: Endpoint POST que genera los 14 días con radar de nicho, post de feed, story diaria y dirección de arte, renderiza las 4 imágenes ancla principales (Días 1, 3, 5, 7) y guarda el documento en Firestore (`admin_demos`).
  - Verify: `npx tsc --noEmit`
  - Files: `src/app/api/vendedores/generate-14day-plan/route.ts`

- [x] Task 4: Implementar endpoint `/api/public/muestras/[id]/render-day`
  - Acceptance: Endpoint POST que recibe `dayNumber` y `demoId`, renderiza la imagen publicitaria faltante con el estilo y textos definidos por el agente director de arte, y actualiza el documento en Firestore.
  - Verify: `npx tsc --noEmit`
  - Files: `src/app/api/public/muestras/[id]/render-day/route.ts`

- [x] Task 5: Integrar en el Panel de Vendedores (`src/app/vendedores/page.tsx`)
  - Acceptance: Selector de tipo de muestra ("Muestra Rápida" vs "Auditoría + Plan 14 Días"), dropzone para subir captura de Instagram con escaneo en vivo de productos/diagnóstico, y constructor del mensaje de WhatsApp personalizado.
  - Verify: `npx tsc --noEmit`
  - Files: `src/app/vendedores/page.tsx`

- [x] Task 6: Actualizar la Página Pública de Propuesta (`src/app/m/[id]/page.tsx`)
  - Acceptance: Si `demoData.plan14Days` existe, renderiza la experiencia completa con tema claro (Diagnóstico del Feed, Navegador de los 14 Días con posts e historias interactivas, botón para renderizar días restantes y cierre con WhatsApp del vendedor).
  - Verify: `npx tsc --noEmit`
  - Files: `src/app/m/[id]/page.tsx`
