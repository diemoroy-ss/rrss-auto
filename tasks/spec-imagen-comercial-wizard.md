# Spec: Asistente Guiado y Flujo Estructurado en Imagen Comercial

## 1. Objective
Transformar la experiencia de entrada en el módulo **Imagen Comercial** ([`src/app/automatizacion-rrss/panel/imagen-comercial/page.tsx`](file:///c:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/app/automatizacion-rrss/panel/imagen-comercial/page.tsx)) para que:
1. **Estado inicial limpio**: Al abrir `/panel/imagen-comercial` (sin parámetros `?edit=...` de la Biblioteca), los campos de escena visual y capas de texto estén completamente en blanco (sin textos pre-cargados de ejemplo).
2. **Asistente de Configuración Previa ("¿Qué quieres hacer hoy?")**: Antes de desplegar el editor completo de lienzo y capas, presentar un flujo guiado e intuitivo donde el usuario define:
   - **Paso A — Tipo de Publicación y Formato**:
     - **Post** (1 slide fijo, sin botón de añadir slide; formato seleccionable `4:5` o `1:1`).
     - **Historia** (1 slide fijo, sin botón de añadir slide; formato `9:16` automático).
     - **Carrusel** (Selector de cantidad de imágenes: **2 a 5 slides**; formato seleccionable `4:5` o `1:1`).
   - **Paso B — Origen del Diseño**:
     - **Opción 1: "Necesito que nuestros agentes diseñen la propuesta (tengo una idea)"**:
       - El usuario ingresa su **idea general o tema** (ej. *"Promoción de 2x1 en pizzas artesanales este fin de semana"* o *"Por qué automatizar tus redes ahorra tiempo"*).
       - **Configuración de Textos**: ¿Llevará texto sobre las imágenes? (`Sí` / `No`).
         - Si elige **Sí**: puede seleccionar entre:
           1. *"Que nuestros agentes propongan y estructuren los textos según mi idea"*.
           2. *"Escribir yo mismo los textos que quiero en cada imagen"*.
       - Al confirmar, **nuestros agentes** generan el prompt visual optimizado en inglés (sin letras rotas en el fondo) para el Post, Historia o cada uno de los $N$ slides del Carrusel, y estructuran automáticamente las capas de texto (`textLayers`: Píldora/Header, Título principal, Bajada/Cta) listas y posicionadas para renderizar con Butterfly Social.
     - **Opción 2: "Ya tengo la descripción clara / prompts listos"**:
       - Se despliegan los $N$ cuadros de descripción (1 para Post/Historia, o $2..5$ para Carrusel).
       - El usuario pega o escribe sus prompts (o indica los textos que desea incluir).
       - Si el prompt incluye bloques de `TYPOGRAPHY & LAYOUT`, el extractor inteligente carga automáticamente las capas de texto de cada slide.
   - **Paso C — Paso al Editor Drag & Drop**:
     - Una vez completado el asistente, se abre el editor con la cantidad exacta de slides configurados, sus prompts listos y sus capas de texto ordenadas.
     - Si es **Post** o **Historia**, la barra de diapositivas no muestra el botón `+ Añadir Slide`.
     - Si es **Carrusel**, muestra las $N$ diapositivas configuradas y un botón destacado **"✨ Generar todos los fondos del carrusel ($N$)"** además del botón individual por slide.
     - Incluye un botón **"⚙️ Cambiar configuración / Nuevo diseño"** en la cabecera por si el usuario desea volver al asistente inicial.

---

## 2. Assumptions Surface
1. **Edición desde Biblioteca (`?edit=ID`)**: Si el usuario entra desde la Biblioteca para editar un cartel o carrusel existente, se salta el asistente inicial y se abre directamente el editor con los datos guardados de ese diseño.
2. **Al momento de Publicar**: Como el usuario ya eligió al inicio si es **Post**, **Historia** o **Carrusel**, el modal de publicación ya sabe exactamente qué tipo de contenido es (pre-seleccionando automáticamente Post, Historia o Carrusel sin volver a preguntarle a menos que quiera cambiarlo).
3. **Regla de Terminología (`AGENTS.md`)**: En toda la interfaz y en los copys/prompts generados nunca se menciona "IA" ni "Inteligencia Artificial"; siempre se utiliza **"nuestros agentes"** y **"nuestro editor"**.

---

## 3. Tech Stack & Architecture
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons.
- **Backend Endpoint Nuevo**: [`src/app/api/imagen-comercial/plan-slides/route.ts`](file:///c:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/app/api/imagen-comercial/plan-slides/route.ts)
  - Utiliza Gemini (`getFreeModel` / `generateFreeText` de `src/lib/gemini-free.ts`) junto con el contexto de marca (`businessName`, `rubro`) para transformar la idea del usuario en un array JSON estructurado de $N$ slides:
    - `prompt`: Descripción visual detallada para el generador de fondos (escena limpia, iluminación comercial, espacio negativo para tipografía).
    - `textLayers`: Capas de texto jerárquicas (etiqueta píldora superior, titular de impacto, subtítulo/detalle y llamado a la acción) con coordenadas `x, y`, tamaños, colores y estilos calibrados para el lienzo y Butterfly Social.

---

## 4. Commands
- **Dev Server**: `npm run dev` (activo en puerto 3003)
- **Typecheck**: `npx tsc --noEmit`
- **Git Push**: `git add ... && git commit -m "..." && git push origin main`

---

## 5. Project Structure
```text
src/
├── app/
│   ├── api/
│   │   └── imagen-comercial/
│   │       ├── plan-slides/
│   │       │   └── route.ts        # [NUEVO] Agente planificador de prompts y capas por slide
│   │       ├── generate-base/
│   │       │   └── route.ts        # Generador de imagen base limpia
│   │       ├── render-final/
│   │       │   └── route.ts        # Renderizador HD con Butterfly Social + Guardado en Biblioteca
│   │       └── upload-asset/
│   │           └── route.ts        # Subida de fotos/logos a Firebase Storage
│   └── automatizacion-rrss/
│       └── panel/
│           └── imagen-comercial/
│               └── page.tsx        # [MODIFICAR] Asistente inicial + Editor sincronizado
```

---

## 6. Boundaries
- **Always do**:
  - Inicializar los slides en blanco (`prompt: ""`, `textLayers: []`).
  - Respetar el límite de 1 único slide cuando se elige `Post` o `Historia`, ocultando el botón de agregar slide.
  - Respetar la cantidad de slides elegida ($2..5$) en `Carrusel` y permitir generar todos los fondos en lote o uno por uno.
  - Mantener la compatibilidad total con Butterfly Social en `/render/preview` y la auto-extracción de textos desde prompts estructurados.
- **Never do**:
  - Usar términos como "IA" o "Inteligencia Artificial" en la UI o textos generados.
  - Mostrar datos hardcodeados de ejemplo al iniciar un diseño nuevo.

---

## 7. Success Criteria
- [ ] Al entrar a **Imagen Comercial**, los campos vienen limpios y se presenta primero el asistente **"¿Qué quieres hacer hoy?"**.
- [ ] El usuario puede elegir **Post**, **Historia** o **Carrusel** (con selector de 2 a 5 imágenes para carrusel) y su formato correspondiente (`4:5` / `1:1` para Post y Carrusel; `9:16` para Historia).
- [ ] Si elige **"Necesito que diseñen las imágenes (tengo una idea)"**, puede describir su idea, indicar si quiere texto (propuesto por nuestros agentes o escrito por él mismo), y nuestros agentes generan los prompts de cada slide y cargan las capas de texto listas para el editor.
- [ ] Si elige **"Ya tengo la descripción clara"**, puede ingresar los prompts/textos de los slides directamente y pasar al editor con las capas de texto auto-extraídas o configuradas.
- [ ] En el editor, si es Post o Historia solo existe 1 slide sin opción de añadir más; si es Carrusel, están los $N$ slides y un botón para generar los fondos de todos los slides de una vez.
