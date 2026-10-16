# Todo: Implementación Módulo "Imagen Comercial"

- [ ] Task 1: Soporte de fuentes personalizadas en `/render/preview`
  - Acceptance: `/render/preview` inyecta las etiquetas `@font-face` y `<link>` para cualquier fuente personalizada enviada en `data.customFonts`.
  - Verify: Comprobar que el HTML generado incluya la fuente inyectada y no lance errores.
  - Files: `src/app/render/preview/page.tsx`

- [ ] Task 2: Endpoints backend de Imagen Comercial
  - Acceptance:
    - `POST /api/imagen-comercial/generate-base`: Genera la imagen base limpia en formato 4:5, 1:1 o 9:16 con n8n/Flux.
    - `POST /api/imagen-comercial/upload-font`: Recibe archivo .ttf/.woff2, lo guarda en Firebase Storage y devuelve la URL.
  - Verify: Probar peticiones con curl/fetch y verificar respuesta con URLs públicas válidas.
  - Files:
    - `src/app/api/imagen-comercial/generate-base/route.ts`
    - `src/app/api/imagen-comercial/upload-font/route.ts`

- [ ] Task 3: Página interactiva `/panel/imagen-comercial` con Editor Drag & Drop y Carrusel
  - Acceptance:
    - Formulario de entrada con 3 bloques (Prompt/Escena, Textos, Logo).
    - Lienzo interactivo con drag and drop libre para textos y logo.
    - Selector de tipografías por capa + modal para subir fuente (.ttf) o pegar URL.
    - Carrusel de hasta 5 imágenes con navegación entre slides.
    - Botones de "Publicar Ahora", "Agendar" y "Descargar Alta Resolución (Butterfly Social)".
  - Verify: Carga fluida en el navegador, dragging sin parpadeos, cambio de fuentes en tiempo real.
  - Files: `src/app/automatizacion-rrss/panel/imagen-comercial/page.tsx`

- [ ] Task 4: Enlace en el sidebar del panel
  - Acceptance: El sidebar de `panel/layout.tsx` muestra "Imagen Comercial" con icono 🎨 bajo la categoría "CREACIÓN".
  - Verify: Navegación directa desde el menú lateral hacia `/automatizacion-rrss/panel/imagen-comercial`.
  - Files: `src/app/automatizacion-rrss/panel/layout.tsx`

- [ ] Task 5: Validación completa y Build
  - Acceptance: `npm run build` compila con éxito (Exit code 0) sin errores de tipos TypeScript.
  - Verify: Ejecutar `npm run build` en consola.
  - Files: Todos los modificados.
