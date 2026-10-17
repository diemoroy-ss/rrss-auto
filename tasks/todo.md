# Plan & Tasks: Asistente Guiado de Imagen Comercial

## Plan Técnico
1. **Endpoint de Planificación con Agentes (`/api/imagen-comercial/plan-slides`)**:
   - Recibe: `contentType` (`post` | `historia` | `carrusel`), `slideCount` ($1..5$), `aspectRatio` (`4:5` | `1:1` | `9:16`), `idea` (string), `includeText` (boolean), `textMode` (`agent` | `manual`), `customTexts` (array opcional de textos por slide), `businessName`, `rubro`.
   - Devuelve un array `slides` donde cada elemento contiene:
     - `prompt`: Prompt visual limpio optimizado para generación de fondo (con espacio negativo y estética comercial).
     - `textLayers`: Capas de texto estructuradas (`id`, `text`, `x`, `y`, `size`, `color`, `backgroundColor`, `isPill`, `isBold`, `boxWidth`, `textAlign`, `shadowLevel`) listas para el lienzo y Butterfly Social.
2. **Refactorización de Estado Inicial y Asistente en `imagen-comercial/page.tsx`**:
   - Eliminar textos y prompts hardcodeados por defecto: `DEFAULT_SLIDE` pasa a tener `prompt: ""` y `textLayers: []`.
   - Añadir estado `isWizardCompleted` (inicia en `false`, o `true` si viene con `?edit=ID` desde la Biblioteca).
   - Construir la vista del **Asistente Inicial ("¿Qué quieres hacer hoy?")**:
     - Selector visual de **Post**, **Historia** o **Carrusel**.
     - Selector de formato (`4:5` o `1:1` para Post/Carrusel; `9:16` fijo para Historia) y selector de número de slides ($2..5$) cuando es Carrusel.
     - Selector de modo de diseño:
       - **"Necesito que nuestros agentes lo diseñen (Tengo una idea)"**: Campo de idea + toggle "¿Llevará texto en la imagen?" + opción "Que nuestros agentes propongan los textos" vs "Escribir yo mismo los textos" + botón **"✨ Crear Propuesta de Prompts y Textos con Agentes"**.
       - **"Ya tengo la descripción clara de lo que necesito"**: Muestra los $N$ bloques (Slide 1 a $N$) con su campo de descripción/prompt (con auto-extracción de `TYPOGRAPHY & LAYOUT` en tiempo real) y campo de texto opcional + botón **"Continuar al Editor →"**.
3. **Ajustes en el Editor Principal (`imagen-comercial/page.tsx`)**:
   - Mostrar badge del modo activo (`POST 1:1`, `HISTORIA 9:16`, `CARRUSEL 5 SLIDES`) y botón `"⚙️ Cambiar formato / Nueva idea"` para volver al asistente si lo desea.
   - Si `contentType` es `post` o `historia`, ocultar el botón `+ Añadir Slide` para mantener 1 único slide.
   - Si es `carrusel` ($>1$ slide), añadir botón **"✨ Generar todos los fondos ($N$ slides)"** que itera y genera las imágenes base de todos los slides del carrusel con nuestros agentes.
   - Pre-configurar automáticamente `publishFormat` (`post` vs `historia`) según lo elegido en el asistente.

---

## Lista de Tareas
- [x] **Task 1**: Crear endpoint [`src/app/api/imagen-comercial/plan-slides/route.ts`](file:///c:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/app/api/imagen-comercial/plan-slides/route.ts) para generar prompts y capas de texto por slide usando nuestros agentes.
  - *Acceptance*: El endpoint responde con `slides` conteniendo `prompt` y `textLayers` bien posicionados según el formato y si lleva texto o no.
- [x] **Task 2**: Actualizar [`src/app/automatizacion-rrss/panel/imagen-comercial/page.tsx`](file:///c:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/app/automatizacion-rrss/panel/imagen-comercial/page.tsx) con estado inicial en blanco y el Asistente Guiado previo al editor.
  - *Acceptance*: Al entrar a Imagen Comercial se ve el asistente limpio; permite elegir Post/Historia/Carrusel, formato, origen (idea vs descripción clara) y textos.
- [x] **Task 3**: Integrar la generación por lote de fondos para carrusel y bloquear adición de slides en Post/Historia dentro del editor.
  - *Acceptance*: En Post/Historia solo hay 1 slide sin botón de agregar; en Carrusel se pueden generar todos los fondos de una vez o individualmente, y los textos quedan listos para Butterfly Social.
- [x] **Task 4**: Verificar compilación TypeScript y desplegar a `origin/main`.
