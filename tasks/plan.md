# Implementation Plan: Imagen Comercial

## 1. Overview & Architecture
El módulo "Imagen Comercial" consta de 3 capas principales:
1. **Frontend / UI (`src/app/automatizacion-rrss/panel/imagen-comercial/page.tsx`):**
   - Formulario de entrada en 3 pasos: Prompt/Escena, Textos y Logo.
   - Lienzo Drag & Drop con soporte táctil y ratón para mover textos y logo en porcentajes `x, y`.
   - Gestor de diapositivas de carrusel (1 a 5 slides) con estado unificado.
   - Selector y cargador de fuentes dinámicas (fuentes predeterminadas + URL + subida `.ttf`/`.woff2` usando `FontFace`).
   - Modales de Publicar Ahora, Agendar y Descargar.
2. **Backend API Endpoints (`src/app/api/imagen-comercial/`):**
   - `generate-base`: Genera la imagen base limpia en 4:5, 1:1 o 9:16 invocando n8n con fallback a Flux.
   - `upload-font`: Sube archivos `.ttf`/`.woff2` a Firebase Storage y retorna la URL pública.
   - `render-preview`: Soporte en `/render/preview` para inyectar `@font-face` con las fuentes personalizadas cargadas en `preview_renders`.
3. **Integración con Navegación & Publicación:**
   - Enlace en sidebar `layout.tsx` bajo sección CREACIÓN.
   - Integración con `/api/publish-now` y Firestore `social_posts` para agendado y publicación inmediata.

---

## 2. Dependency Graph & Implementation Order
```
1. Backend & Render Support
   ├── 1.1 Soporte de @font-face y customFonts en /render/preview/page.tsx
   ├── 1.2 Endpoint API /api/imagen-comercial/generate-base
   └── 1.3 Endpoint API /api/imagen-comercial/upload-font
             │
             ▼
2. Frontend Core: Editor & Canvas
   ├── 2.1 Componente Drag & Drop para capas de texto y logo
   ├── 2.2 Gestor de fuentes dinámicas (FontFace API + selector)
   └── 2.3 Manejador de Carrusel (1 a 5 diapositivas)
             │
             ▼
3. Integración de Flujo Completo
   ├── 3.1 Vista principal /panel/imagen-comercial/page.tsx
   ├── 3.2 Acciones: Descarga HD (Butterfly Social), Publicar Ahora y Agendar
   └── 3.3 Registro en sidebar de panel/layout.tsx
```

---

## 3. Risks & Mitigations
- **Riesgo:** Fuentes externas no renderizadas a tiempo en Butterfly Social.
  - *Mitigación:* Se pre-cargan los `@font-face` en el `<head>` de `/render/preview` con `font-display: block` y se inyecta un sutil retardo de estabilidad antes de la captura.
- **Riesgo:** Discrepancia entre la posición en pantalla y la imagen exportada.
  - *Mitigación:* Se almacena la posición como porcentaje relativo (`x: 0-100`, `y: 0-100`) respecto al ancho/alto del lienzo, garantizando escala exacta en 1080px.
- **Riesgo:** Imágenes de carrusel que pierdan coherencia de estilo.
  - *Mitigación:* El generador de slide hereda el estilo visual, rubro y paleta de la primera diapositiva por defecto.
