# Plan de Implementación: Agente Director de Arte & Composición Inteligente de Textos

## Objetivo
Implementar la capacidad autónoma para que nuestros agentes decidan la disposición visual de los textos (`split_left`, `top_banner`, `recipe_ingredients`) en fotos reales y planifiquen la composición asimétrica en imágenes generadas por ellos mismos.

---

## Fases de Implementación

### Fase 1: Módulo Central del Agente Director de Arte
- **Archivo:** `src/lib/agents/agent-art-director.ts`
- **Funcionalidad:**
  - Análisis multimodal de fotos reales (detección de cuadrantes, posición del plato, espacio libre).
  - Reglas de dirección de arte según objetivo comercial (combo, receta, lanzamiento, plato del día).
  - Generador de directivas de composición fotográfica para inyectar en prompts de generación.
  - Emparejamiento con la mejor plantilla de texto (`DEFAULT_TEXT_TEMPLATES`).

### Fase 2: Endpoint API para Decisión de Dirección de Arte
- **Archivo:** `src/app/api/laboratorio/analizar-direccion-arte/route.ts`
- **Funcionalidad:**
  - Endpoint `POST` seguro que recibe `imageUrl`, `productName`, `postObjective`, `price`, `rubro`.
  - Invoca al `AgentArtDirector` y devuelve el layout recomendado, la plantilla asociada, el razonamiento en una frase concisa, el kicker y los ingredientes sugeridos.

### Fase 3: Integración de Directivas de Composición en Prompts
- **Archivo:** `src/lib/prompt-templates.ts`
- **Funcionalidad:**
  - Soporte de directivas de encuadre asimétrico (`split_left`, `split_right`, `recipe_ingredients`, `top_banner`) para enriquecer cualquier estilo del laboratorio.

### Fase 4: Integración en Interfaz de Usuario
- **Archivos:**
  - `src/app/automatizacion-rrss/panel/plantillas-texto/page.tsx`: botón y tarjeta de "🎯 Decisión Automática por Nuestros Agentes" en el modal de prueba y catálogo.
  - `src/app/automatizacion-rrss/panel/laboratorio/page.tsx`: selector de composición inteligente activado por defecto con visualización de la justificación del agente.

### Fase 5: Verificación y Despliegue
- Ejecutar `npm run build` para garantizar cero errores de TypeScript y compilación.
- Pruebas de los diferentes escenarios (combo a la derecha, receta con ingredientes, plato centrado).
- Commit y push a `origin main`.
