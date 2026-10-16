# Spec: Módulo "Imagen Comercial" (Estudio de Cartel Comercial, Fuentes Custom & Carruseles)

## 1. Objective
Permitir a los usuarios y administradores crear piezas gráficas comerciales de alto impacto (formatos 4:5, 1:1 y 9:16) en un flujo completo de diseño, personalización tipográfica y publicación:
1. **Generación / Carga de la Imagen Base:** Campo para el prompt descriptivo de la imagen (o selección de producto/foto del catálogo) y generación limpia (sin texto roto) mediante los modelos de imagen de la plataforma (`n8n` / `Flux`).
2. **Definición de Textos & Logo:** Especificar las capas de texto (ej. Badge superior de nicho, Titular principal de alto contraste, Beneficio/Precio, Sub-badge con llamado a la acción) y subir/seleccionar el logo corporativo con opción de fondo transparente o blanco.
3. **Editor Visual Interactivo (Drag & Drop):** Una vez generada la imagen base, previsualizarla en un lienzo interactivo donde el usuario pueda:
   - Mover libremente (arrastrar y soltar) cada capa de texto y el logo con coordenadas relativas (`0-100%`).
   - Modificar la tipografía independientemente por cada capa (`Montserrat`, `Bebas Neue`, `Anton`, `Playfair Display`, `Dancing Script`, `Outfit`).
   - **Soporte de Fuentes Personalizadas:** Posibilidad de cargar fuentes externas mediante **URL** (ej. Google Fonts / CDN) o subiendo directamente un archivo **.TTF / .WOFF2** desde el equipo, inyectando el `@font-face` en vivo y en el render final.
   - Ajustar tamaño, color, alineación, estilo píldora/cápsula y sombras.
   - Agregar o eliminar capas de texto sobre la marcha.
4. **Flujo de Carrusel Multi-Slide (Hasta 5 imágenes):**
   - Selector / tira de slides (`Slide 1` a `Slide 5`).
   - Botón `+ Generar siguiente imagen para carrusel` que preserva el estilo visual y paleta de la marca.
5. **Guardado en Biblioteca y Re-edición:**
   - Cada diseño (individual o carrusel) se guarda automáticamente en la **Biblioteca de Medios** (`generated_images` con `source: "imagen_comercial"` y el snapshot editable).
   - Desde la Biblioteca, el usuario verá la insignia `"🎨 Cartel Comercial"` y un botón `🎨 Editar Diseño` que reabre la pieza en `/automatizacion-rrss/panel/imagen-comercial?editId={id}` recuperando todas las capas de texto, tipografías y logo exactamente como las dejó.
6. **Acciones Post-Aprobación:**
   - 🚀 **Publicar Ahora:** Envío inmediato a las redes sociales conectadas (Instagram, Facebook, etc.).
   - 📅 **Agendar:** Programación con fecha y hora en el calendario de publicaciones.
   - 📥 **Descargar Alta Resolución:** Exportación en PNG de 1080px (vía Butterfly Social / Canvas).

---

## 2. Tech Stack & Dependencies
- **Framework:** Next.js 14.2 (App Router, React 18, TypeScript)
- **Estilos:** Tailwind CSS, Lucide React icons
- **Fuentes Dinámicas:** Web Font Loader / `@font-face` en memoria + subida de TTF a Firebase Storage para persistencia en el render de Butterfly Social.
- **Estado & Canvas Interactivo:** React State + Drag/Drop touch-friendly (coordenadas relativas `x: 0-100%`, `y: 0-100%`).
- **Persistencia & Renderizado:**
  - Firebase Firestore (`preview_renders`, `social_posts`)
  - Firebase Storage (`users/{uid}/commercial_images/`, `users/{uid}/custom_fonts/`)
  - Butterfly Social (`https://butterfly.santisoft.cl/link-previews/v1`) + Fallback Sharp SVG local
- **Generación de Imagen Base:** Webhook n8n (`https://n8n.santisoft.cl/webhook/img-rrss-auto`) + Pollinations Flux

---

## 3. Commands
- **Dev:** `npm run dev` (puerto 3003)
- **Build & Validación de Tipos:** `npm run build`
- **Lint:** `npm run lint`

---

## 4. Project Structure & Files to Touch
```
src/
├── app/
│   ├── automatizacion-rrss/panel/
│   │   ├── layout.tsx                     → Agregar enlace "Imagen Comercial" bajo sección CREACIÓN
│   │   └── imagen-comercial/
│   │       └── page.tsx                   → Vista principal con inputs, editor Drag & Drop, fuentes custom y carrusel
│   ├── render/preview/
│   │   └── page.tsx                       → Inyección de fuentes custom en el HTML headless para Butterfly Social
│   └── api/
│       ├── imagen-comercial/
│       │   ├── generate-base/route.ts     → Endpoint para generar imagen base limpia
│       │   └── upload-font/route.ts       → Endpoint para guardar fuentes .ttf/.woff2 en Storage
│       ├── publish-now/route.ts           → Publicación directa
│       └── tasks/schedule/route.ts        → Agendamiento en calendario
tasks/
├── spec-imagen-comercial.md               → Esta especificación
├── plan.md                                → Plan de implementación ordenado
└── todo.md                                → Lista de tareas desglosada
```

---

## 5. Detailed Workflows & Components

### A. Subida y Uso de Fuentes Personalizadas (.TTF / .WOFF2 o URL)
1. **Modal / Dropdown "Añadir Fuente Personalizada":**
   - Opción 1: Pegar URL de Google Fonts o CDN (ej: `https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap`).
   - Opción 2: Subir archivo `.ttf` o `.woff2` desde la computadora.
2. **Carga en el Cliente:**
   - La fuente se carga dinámicamente con `FontFace` API en el navegador para que el usuario la vea aplicada inmediatamente en el lienzo.
3. **Persistencia en el Render:**
   - Si es archivo local, se sube a Firebase Storage (`users/{uid}/custom_fonts/{fontName}.ttf`).
   - En el documento de `preview_renders`, se incluye el array `customFonts: [{ name, url }]`.
   - `/render/preview` inyecta las etiquetas `<link>` o `<style> @font-face { ... } </style>` para que **Butterfly Social** dibuje la fuente exactamente igual.

### B. Modo Carrusel (1 a 5 Diapositivas)
1. Pestañas de diapositivas en la parte superior del lienzo: `[ 1 ] [ 2 ] [ + Añadir Slide ]` (hasta un máximo de 5).
2. Cada diapositiva tiene su propia imagen base y sus propias capas de texto y logo.
3. El usuario puede alternar entre diapositivas y editar cada una individualmente.
4. Al terminar:
   - Puede descargar el carrusel completo (carpeta o serie de imágenes).
   - O presionar **Publicar Ahora** / **Agendar** seleccionando "Tipo: Carrusel", enviando la serie completa a la colección `social_posts`.

### C. Publicar Ahora & Agendar
1. **Modal de Publicación:**
   - Vista previa del copy/caption para redes sociales (generado automáticamente a partir de los textos comerciales o editable por el usuario).
   - Selector de perfiles conectados (Instagram, Facebook).
   - Botón `🚀 Publicar en Redes Ahora`.
   - Botón `📅 Agendar para más tarde` (con fecha y hora).

---

## 6. Boundaries
- **Siempre:**
  - Respetar la regla de oro de `AGENTS.md`: nunca mencionar "IA" o "Inteligencia Artificial" en la interfaz; hablar de "nuestros agentes" y herramientas comerciales.
  - Soportar hasta un máximo estricto de 5 imágenes por carrusel para respetar los límites de la plataforma.
  - Usar coordenadas relativas porcentuales (`0-100%`) para garantizar equivalencia perfecta entre el editor y el render de exportación.
  - Validar tipos con `npm run build` antes de commitear.
- **Consultar primero:**
  - Cambiar dependencias externas adicionales.
- **Nunca:**
  - Generar textos superpuestos en el modelo de difusión de imagen; la tipografía siempre se compone en capas con Butterfly Social.

---

## 7. Success Criteria
1. El usuario puede crear una pieza individual o un carrusel de hasta 5 imágenes.
2. Cada slide permite generar imagen base limpia con el modelo de la app, definir textos y logo.
3. El editor Drag & Drop permite arrastrar y soltar cada capa de texto y el logo con precisión.
4. El usuario puede seleccionar tipografías del catálogo o subir una fuente propia (.TTF / URL) que se refleja en tiempo real en la pantalla y en el render final de Butterfly Social.
5. El usuario puede Publicar Ahora, Agendar en su calendario, o Descargar en alta resolución.
