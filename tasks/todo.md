# Task List: Modo "Laboratorio (Mixboard)" en Nuevo Post

## Phase 1: Contratos de Datos y Agente de Blueprint
- [x] **Task 1: Extender tipos en `src/types/poster.ts`**
  - **Description**: Añadir a `PosterSlideConfig` y `PosterConfig` los campos necesarios para el Laboratorio Mixboard (`styleReferenceUrl`, `styleReferenceTraits`, `lockStyleFromSlide1`, `mixboardPreset`, `isLabMode`) y actualizar `buildPosterPromptSuffix` para incluir directrices de referencia de estilo.
  - **Acceptance criteria**:
    - [x] `PosterSlideConfig` y `PosterConfig` incluyen las propiedades opcionales de estilo y preset sin romper el código existente.
    - [x] `DEFAULT_POSTER_CONFIG` inicializa valores seguros por defecto.
  - **Verification**: `npx tsc --noEmit`
  - **Dependencies**: None
  - **Files likely touched**: `src/types/poster.ts`
  - **Estimated scope**: Small (1 file)

- [x] **Task 2: Crear endpoint `/api/ai/mixboard-blueprint/route.ts`**
  - **Description**: Crear el endpoint donde nuestros agentes toman una idea breve en español, el rubro del negocio, el preset visual elegido (`dark_saas`, `retail_promo`, `editorial_clean`, `gastro_warm`, `corporate_pro`) y los textos opcionales, y devuelven un prompt técnico estructurado con `TYPOGRAPHY & LAYOUT` + campos extraídos (`mainText`, `sloganText`, `priceText`, `ctaText`, `primaryColor`) para 1 slide o para las $N$ láminas del carrusel.
  - **Acceptance criteria**:
    - [x] El endpoint responde con `prompt` en formato `TYPOGRAPHY & LAYOUT (Exact Spanish text)` y los campos de texto listos para hidratar el formulario.
    - [x] Soporta tanto generación para el slide activo como secuencia narrativa para carrusel.
    - [x] Ningún mensaje menciona "IA", solo "nuestros agentes".
  - **Verification**: `npx tsc --noEmit`
  - **Dependencies**: Task 1
  - **Files likely touched**: `src/app/api/ai/mixboard-blueprint/route.ts`
  - **Estimated scope**: Small (1 file)

---

## Phase 2: Componentes Visuales del Laboratorio & Retoque en Vivo
- [x] **Task 3: Construir componente `src/components/crear/MixboardLabTools.tsx`**
  - **Description**: Crear los 3 módulos visuales exclusivos del Laboratorio:
    1. `MixboardBlueprintBar`: Selector de los 5 Presets de Dirección de Arte + input de idea rápida + botón *"🧪 Estructurar Blueprint con Nuestros Agentes"*.
    2. `MixboardStyleReferenceSlot`: Subida de imagen de Referencia de Estilo (`styleReferenceUrl`), selector de rasgos a absorber (*Paleta*, *Iluminación*, *Tipografía*, *Composición*) y, en Slides $\ge 2$, switch *"🔗 Anclar línea gráfica del Slide 1"*.
    3. `MixboardLiveRetouchBar`: Barra interactiva debajo del preview en la card de Composición con input de ajuste puntual + chips rápidos de 1 clic (*Más contraste*, *Fondo más oscuro*, *Destacar producto*, *Tonos cálidos*).
  - **Acceptance criteria**:
    - [x] Los 3 subcomponentes son limpios, responsivos y usan terminología de "nuestros agentes".
    - [x] Permiten subir imagen de referencia y disparar el retoque sobre el slide activo.
  - **Verification**: `npx tsc --noEmit`
  - **Dependencies**: Task 1, Task 2
  - **Files likely touched**: `src/components/crear/MixboardLabTools.tsx`
  - **Estimated scope**: Small (1 file)

- [x] **Task 4: Integrar `MixboardLabTools` en `src/components/crear/PosterFormView.tsx`**
  - **Description**: Añadir la prop `isLabMode?: boolean` (y handlers de subida de referencia y retoque en vivo) en `PosterFormView.tsx`. Cuando `isLabMode` es `true`, mostrar el Arquitecto de Blueprint arriba, la ranura de Referencia de Estilo dentro de la card de Imagen del Producto, y la Barra de Retoque en Vivo debajo del preview de la imagen generada en la card de Composición.
  - **Acceptance criteria**:
    - [x] Si `isLabMode` es `false` (modo Afiche clásico), la interfaz se mantiene idéntica a la actual.
    - [x] Si `isLabMode` es `true`, se habilitan las 3 herramientas Mixboard sincronizadas por cada slide individual.
  - **Verification**: `npx tsc --noEmit`
  - **Dependencies**: Task 3
  - **Files likely touched**: `src/components/crear/PosterFormView.tsx`
  - **Estimated scope**: Small (1 file)

---

## Phase 3: Selector en Nuevo Post y Pipeline hacia n8n
- [x] **Task 5: Añadir 3ra opción "🧪 Laboratorio (Mixboard)" en `page.tsx` y enriquecer `/api/ai/generate-preview/route.ts`**
  - **Description**:
    - En `src/app/automatizacion-rrss/panel/crear/page.tsx`: Ampliar `activeCreationFlow` a `'estandar' | 'afiche' | 'laboratorio'`, renderizar la 3ra viñeta **🧪 Laboratorio (Mixboard)** en el grid superior, agregar el handler de subida de `styleReferenceUrl` y el handler de retoque rápido de la lámina activa.
    - En `src/app/api/ai/generate-preview/route.ts`: Incluir en el prompt enriquecido y en el payload hacia n8n los campos `styleReferenceUrl`, `styleReferenceTraits`, `retouchTargetImageUrl`, `retouchInstruction` e `isMixboardLab`.
  - **Acceptance criteria**:
    - [x] El selector superior muestra las 3 tarjetas: Publicación Estándar, Afiche y Laboratorio (Mixboard).
    - [x] Al generar o retocar desde Laboratorio, n8n recibe todos los insumos visuales y las instrucciones estructuradas.
    - [x] Funciona para 1 imagen y para carruseles de 2 a 5 láminas de principio a fin.
  - **Verification**: `npx tsc --noEmit` y commit + push a `origin/main`.
  - **Dependencies**: Task 4
  - **Files likely touched**: `src/app/automatizacion-rrss/panel/crear/page.tsx`, `src/app/api/ai/generate-preview/route.ts`
  - **Estimated scope**: Medium (2 files)
