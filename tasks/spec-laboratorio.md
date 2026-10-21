# Spec: Modo "Laboratorio (Mixboard)" en Nuevo Post (`/automatizacion-rrss/panel/crear`)

## Assumptions (Supuestos Base)
1. **Motor de generación en n8n**: La generación de imágenes sigue delegándose al webhook de n8n (`NEXT_PUBLIC_N8N_PREVIEW_URL`), que conecta con Gemini Image Generation. La app Next.js se encarga de armar el blueprint estructurado, analizar insumos y enviar el payload enriquecido (`promptEnglish`, `baseImageUrl`, `styleReferenceUrl`, `retouchTargetImageUrl`, `posterConfig`).
2. **Reutilización de arquitectura probada**: En lugar de duplicar un formulario de 1.500 líneas desde cero, extenderemos `PosterFormView.tsx` con una prop `isLabMode?: boolean` (y subcomponentes modulares para las herramientas Mixboard). Así, **Laboratorio** hereda el 100% de la estabilidad de **Afiche** (1 imagen o carrusel de 2 a 5 slides, preview en la card de Composición, aislamiento por slide, auto-extracción de textos y publicación como carrusel real).
3. **Estructuración del Blueprint**: La transformación de una idea simple en español a un prompt técnico estilo Mixboard (`TYPOGRAPHY & LAYOUT` con coordenadas, colores hexadecimales y jerarquía) la realizará un nuevo endpoint ligero en la app (`/api/ai/mixboard-blueprint`) operado por nuestros agentes de dirección de arte.
4. **Terminología**: En toda la interfaz, mensajes de carga y textos se hablará exclusivamente de **"nuestros agentes"** (cero menciones a "IA" o "Inteligencia Artificial", cumpliendo `AGENTS.md`).

---

## 1. Objective
Crear una tercera opción en la pantalla **Nuevo Post** llamada **🧪 Laboratorio (Mixboard)** (`activeCreationFlow === 'laboratorio'`).
- **Qué construimos**: Un entorno de diseño publicitario avanzado dentro de `/automatizacion-rrss/panel/crear` que conserva toda la mecánica de Afiche (Post individual, Historia o Carrusel de hasta 5 láminas, preview en card de Composición, textos por slide) y suma las 4 capacidades clave de Google Mixboard:
  1. **Generador de Blueprint (`TYPOGRAPHY & LAYOUT`)**: Convierte cualquier idea simple en español en un prompt maestro estructurado por zonas (`TOP CENTER`, `UPPER CENTER`, `HIGHLIGHT`, `BOTTOM RIGHT`), paleta hexadecimal y dirección de arte 3D/fotográfica, rellenando automáticamente las cajas de texto del cartel.
  2. **Mesa de Mezcla Visual (Producto + Referencia de Estilo)**: Permite combinar en cada slide la foto del producto real (`baseImageUrl`) con una imagen de inspiración estética (`styleReferenceUrl`) o activar el **Anclaje de Estilo del Slide 1** para mantener la misma línea gráfica en todo el carrusel.
  3. **Retoque Conversacional en Vivo debajo del Preview**: Una barra rápida bajo la imagen generada en la card de Composición para pedir ajustes puntuales sobre esa lámina (*"agranda el título"*, *"oscurece el fondo"*, etc.) sin perder el diseño base.
  4. **Payload Mixboard hacia n8n**: Envío estructurado de todas las referencias visuales y directrices de fusión al webhook.

---

## 2. Tech Stack & Commands
- **Framework**: Next.js (App Router), React 19, TypeScript, Tailwind CSS, Firebase (Auth, Firestore, Storage).
- **Commands**:
  ```bash
  # Verificación de tipos (obligatoria antes de cada commit)
  npx tsc --noEmit

  # Servidor de desarrollo
  npm run dev

  # Build de producción
  npm run build
  ```

---

## 3. Project Structure
```text
src/
├── types/
│   └── poster.ts                                      # Extensión de PosterConfig y PosterSlideConfig para Laboratorio
├── lib/
│   └── poster-prompt-parser.ts                        # Parser bidireccional de bloques TYPOGRAPHY & LAYOUT
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── mixboard-blueprint/route.ts            # NUEVO: Agente estructurador de Blueprint Mixboard
│   │       └── generate-preview/route.ts              # Actualizado: Enriquecimiento con styleReferenceUrl y retoque
│   └── automatizacion-rrss/
│       └── panel/
│           └── crear/
│               └── page.tsx                           # Selector de 3 flujos ('estandar' | 'afiche' | 'laboratorio')
└── components/
    └── crear/
        ├── PosterFormView.tsx                         # Extendido con isLabMode para habilitar módulos Mixboard
        └── MixboardLabTools.tsx                       # NUEVO: Componente modular con Blueprint, Style Mix y Live Retouch
```

---

## 4. Code Style & Data Contracts
Extensión limpia de tipos en `src/types/poster.ts`:
```typescript
export type MixboardPresetId =
  | "dark_saas"
  | "retail_promo"
  | "editorial_clean"
  | "gastro_warm"
  | "corporate_pro";

export interface PosterSlideConfig {
  slideNumber: number;
  role: string;
  mainText: string;
  priceText?: string;
  sloganText?: string;
  ctaText?: string;
  imageExpectation?: string;
  imageUrl?: string;
  baseImageUrl?: string;
  allowImageRetouch?: boolean;
  // Campos Mixboard Laboratorio por lámina:
  styleReferenceUrl?: string;
  styleReferenceTraits?: ("palette" | "lighting" | "typography" | "layout")[];
  lockStyleFromSlide1?: boolean;
  lastRetouchInstruction?: string;
}
```

---

## 5. Testing & Verification Strategy
- **Type Check Estático**: `npx tsc --noEmit` con 0 errores en cada fase.
- **Pruebas Funcionales de Flujo**:
  1. Cambio entre las 3 pestañas (`Publicación Estándar`, `Afiche`, `Laboratorio`) sin pérdida de estado ni errores de renderizado.
  2. Uso del **Generador de Blueprint** con una frase corta en español $\rightarrow$ verifica que se construya el bloque `TYPOGRAPHY & LAYOUT` y se llenen automáticamente los campos de `Textos del Cartel`.
  3. Carga de `baseImageUrl` (Producto) + `styleReferenceUrl` (Referencia de Estilo) por slide y activación de `"Anclar estilo del Slide 1"` en Slides 2..5.
  4. Uso de la barra de **Retoque en Vivo** debajo del preview en la card de Composición.
  5. Previsualización final con las 5 láminas y agendamiento/publicación como `Carrusel`.

---

## 6. Boundaries
- **Always do**:
  - Ejecutar `npx tsc --noEmit` antes de confirmar cambios.
  - Usar siempre el término **"nuestros agentes"** en lugar de "IA" o "Inteligencia Artificial" (`AGENTS.md`).
  - Mantener intacto el comportamiento actual de `estandar` y `afiche`.
- **Ask first**:
  - Cambios en la estructura de colecciones de Firestore fuera de `social_posts`.
  - Agregar dependencias externas pesadas en `package.json`.
- **Never do**:
  - Sobreescribir `baseImageUrl` (foto original del producto) con la imagen generada del cartel.
  - Mezclar textos o prompts de un slide con otro a menos que el usuario lo pida expresamente.

---

## 7. Success Criteria
- [ ] En `/automatizacion-rrss/panel/crear` aparecen las 3 opciones: **Publicación Estándar**, **Afiche / Diseño con Textos** y **🧪 Laboratorio (Mixboard)**.
- [ ] En **Laboratorio**, el usuario puede elegir un preset estético, escribir una idea breve y hacer clic en **"Estructurar Blueprint con Nuestros Agentes"**, obteniendo el prompt técnico `TYPOGRAPHY & LAYOUT` y los campos de texto del cartel auto-completados.
- [ ] En cada slide, el usuario puede combinar **Imagen del Producto** + **Referencia de Estilo** (o activar **Anclar línea gráfica del Slide 1** para los slides 2 a 5).
- [ ] Una vez generada la imagen de un slide y mostrada en la card de **Composición**, aparece debajo el control de **Retoque Rápido** para iterar sobre esa misma imagen con nuestros agentes.
- [ ] Funciona tanto para 1 imagen (Post/Historia) como para Carrusel de 2 a 5 láminas, mostrándose todas las láminas en el modal final y guardándose como `Carrusel`.
