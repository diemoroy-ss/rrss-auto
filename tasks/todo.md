# Tareas: Agente Director de Arte & Composición Inteligente

- [x] Task 1: Crear el módulo central `AgentArtDirector` en `src/lib/agents/agent-art-director.ts`
  - Acceptance: Exporta `decideArtDirection(input)` y `getCompositionDirective(layout)`. Maneja visión de imágenes reales y planificación de prompts para imágenes a generar.
  - Verify: Compilación TypeScript sin errores y tipos estructurados.
  - Files: `src/lib/agents/agent-art-director.ts`

- [x] Task 2: Crear el endpoint de análisis en `src/app/api/laboratorio/analizar-direccion-arte/route.ts`
  - Acceptance: Endpoint POST que responde con `{ layoutPosition, templateId, template, reasoning, kicker, ingredients, compositionDirective }`.
  - Verify: Manejo adecuado de errores y fallback si no se proporciona imagen.
  - Files: `src/app/api/laboratorio/analizar-direccion-arte/route.ts`

- [x] Task 3: Enriquecer prompts de generación con directivas de composición en `src/lib/prompt-templates.ts`
  - Acceptance: Función para inyectar encuadre asimétrico (`split_left`, `recipe_ingredients`, etc.) en cualquier prompt comercial de comida.
  - Verify: Prompts enriquecidos incluyen instrucciones precisas de "hero dish strictly in the right 50%" y "no text in image".
  - Files: `src/lib/prompt-templates.ts`

- [x] Task 4: Integrar botón de "🎯 Decisión Automática por Nuestros Agentes" en el probador de `plantillas-texto/page.tsx`
  - Acceptance: En el modal de prueba, al pulsar "🎯 Decidir con nuestros agentes", el agente analiza la foto o plato y auto-selecciona el layout óptimo mostrando su justificación.
  - Verify: El canvas y los campos (kicker, ingredientes, precio) se actualizan en vivo.
  - Files: `src/app/automatizacion-rrss/panel/plantillas-texto/page.tsx`

- [x] Task 5: Integrar dirección de arte inteligente en `crear/page.tsx`, `PosterSection.tsx` y `real-product-compositor.ts`
  - Acceptance: Al generar imágenes con texto o carteles, el modo automático de agentes está activo por defecto e inyecta la composición adecuada.
  - Verify: Generación y previsualización consistente.
  - Files: `src/types/poster.ts`, `src/components/crear/PosterSection.tsx`, `src/lib/real-product-compositor.ts`, `src/app/api/posts/generate-styled-image/route.ts`

- [x] Task 6: Build de producción y verificación de calidad
  - Acceptance: `npm run build` pasa exitosamente con código 0 y sin errores.
  - Verify: Ejecución de build y commit en git.
  - Files: Todos los modificados.
