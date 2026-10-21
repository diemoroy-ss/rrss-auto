# Implementation Plan: Modo "Laboratorio (Mixboard)" en Nuevo Post

## Overview
Incorporar el modo **🧪 Laboratorio (Mixboard)** como tercera opción principal dentro de `/automatizacion-rrss/panel/crear`. Este modo conserva toda la funcionalidad probada de **Afiche** (soporte de 1 imagen o carrusel de 2 a 5 slides, preview directo en la card de Composición, aislamiento por slide y publicación multi-lámina) y añade 4 capacidades clave inspiradas en Google Mixboard:
1. **Arquitecto de Blueprint (`TYPOGRAPHY & LAYOUT`)** operado por nuestros agentes.
2. **Mesa de Mezcla Visual por Slide** (Producto Real + Referencia de Estilo + Anclaje de Línea Gráfica del Slide 1 en carruseles).
3. **Retoque Conversacional en Vivo** debajo del preview en la card de Composición.
4. **Payload Mixboard Enriquecido** hacia el webhook de n8n.

---

## Dependency Graph
```text
1. Tipos y Contratos Base (src/types/poster.ts)
       │
       ├── 2. Backend / Agentes
       │       ├── 2.1 Endpoint /api/ai/mixboard-blueprint (Generador de Blueprint TYPOGRAPHY & LAYOUT)
       │       └── 2.2 Enriquecimiento de /api/ai/generate-preview (styleReferenceUrl, lockStyleFromSlide1, retouch)
       │
       └── 3. Componentes UI del Laboratorio
               ├── 3.1 Componente modular src/components/crear/MixboardLabTools.tsx
               │       (Asistente Blueprint, Ranura de Referencia de Estilo, Barra de Retoque en Vivo)
               └── 3.2 Integración en PosterFormView.tsx (prop isLabMode) y page.tsx (3ra viñeta 'laboratorio')
```

---

## Architecture Decisions
1. **Extensión de `PosterFormView` en lugar de duplicación**:
   - `PosterFormView` ya resuelve el 100% de la sincronización de slides, auto-extracción de prompts, preview en la card de Composición, reutilización del Slide 1 y redacción de copy final.
   - Al pasar `isLabMode={activeCreationFlow === 'laboratorio'}` e inyectar subcomponentes limpios desde `MixboardLabTools.tsx`, garantizamos cero regresiones y mantenibilidad total.
2. **Blueprint Bidireccional**:
   - El endpoint `/api/ai/mixboard-blueprint` genera tanto el prompt técnico en formato `TYPOGRAPHY & LAYOUT` como el JSON de campos (`mainText`, `sloganText`, `priceText`, `ctaText`, `primaryColor`), sincronizando el formulario al instante.
3. **Anclaje de Estilo en Carruseles (`lockStyleFromSlide1`)**:
   - A diferencia de "Reutilizar la misma imagen del Slide 1" (que copia la imagen sin gastar cuota), el "Anclaje de Estilo Mixboard" en los Slides 2..5 envía la URL del Slide 1 como `styleReferenceUrl` para que nuestros agentes creen una escena **nueva** pero con idéntica paleta cromática, tipografía y atmósfera.

---

## Phases & Checkpoints

### Phase 1: Contratos de Datos y Agente de Blueprint
- **Task 1**: Extender `src/types/poster.ts` con los campos de Laboratorio (`styleReferenceUrl`, `styleReferenceTraits`, `lockStyleFromSlide1`, `mixboardPreset`, `isLabMode`).
- **Task 2**: Crear el endpoint `/api/ai/mixboard-blueprint/route.ts` para transformar ideas simples en español + preset visual en un Blueprint `TYPOGRAPHY & LAYOUT` completo (1 lámina o secuencia de carrusel).

#### Checkpoint 1: Foundation
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] El contrato de `PosterConfig` y `PosterSlideConfig` soporta todos los atributos Mixboard por slide.

---

### Phase 2:Componentes Visuales del Laboratorio & Retoque en Vivo
- **Task 3**: Crear `src/components/crear/MixboardLabTools.tsx` con:
  1. **Panel Arquitecto Blueprint** (Selector de Preset + Idea rápida + Botón *"🧪 Estructurar Blueprint con Nuestros Agentes"*).
  2. **Selector de Referencia de Estilo & Anclaje de Carrusel** (Subida de imagen de inspiración + chips de rasgos a imitar + toggle *"Anclar estética del Slide 1"*).
  3. **Barra de Retoque Conversacional en Vivo** (Input + chips rápidos debajo del preview en la card de Composición).
- **Task 4**: Integrar `MixboardLabTools` dentro de `src/components/crear/PosterFormView.tsx` cuando `isLabMode={true}`.

#### Checkpoint 2: Core UI
- [ ] En modo Laboratorio se visualizan los controles de Blueprint, Mezcla de Estilo y Retoque debajo del preview.
- [ ] En modo Afiche normal esos controles adicionales permanecen ocultos, manteniendo la vista clásica intacta.

---

### Phase 3: Selector en Nuevo Post y Pipeline hacia n8n
- **Task 5**: Actualizar `src/app/automatizacion-rrss/panel/crear/page.tsx` y `src/app/api/ai/generate-preview/route.ts`:
  - Añadir la 3ra tarjeta **🧪 Laboratorio (Mixboard)** en el selector superior de Nuevo Post.
  - Conectar la subida de `styleReferenceUrl` a Firebase Storage y el handler de retoque rápido sobre la lámina activa.
  - Enviar en el payload hacia n8n `styleReferenceUrl`, `styleReferenceTraits`, `retouchTargetImageUrl`, `retouchInstruction` y las directrices `STYLE REFERENCE & MIXBOARD FUSION` en el prompt enriquecido.

#### Checkpoint 3: End-to-End Verification
- [ ] `npx tsc --noEmit` con 0 errores.
- [ ] Flujo completo verificado: Selección de Laboratorio $\rightarrow$ Blueprint $\rightarrow$ Generación de 1 o 5 slides $\rightarrow$ Retoque en vivo en card de Composición $\rightarrow$ Previsualización Final de las 5 láminas $\rightarrow$ Publicación como Carrusel.

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Confusión entre "Reutilizar imagen del Slide 1" y "Anclar estilo del Slide 1" | Medio | Etiquetar claramente ambas opciones en Slides 2..5: una copia la imagen tal cual (0 consumo), la otra diseña una escena nueva imitando la línea gráfica del Slide 1. |
| Sobrecarga visual en la interfaz de Afiche | Medio | Mostrar las herramientas avanzadas únicamente cuando el usuario elige la pestaña **🧪 Laboratorio (Mixboard)** (`isLabMode === true`). |
| Pérdida de imagen original del producto al aplicar un retoque en vivo | Alto | Separar estrictamente `baseImageUrl` (foto del producto intacta) de `retouchTargetImageUrl` (el cartel generado en el preview que se desea ajustar). |
