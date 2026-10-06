# Plan de Implementación: Landing Page Comercial "Cómo Funciona / Qué Hacemos"

## Objetivo
Desarrollar una landing page comercial de alto impacto y orientada a clientes en `/como-funciona`, explicando todo lo que hacen nuestros agentes especializados para el negocio del cliente sin lenguaje técnico, con comparativa de mercado, ejemplos visuales de fotos reales con arte comercial y doble llamado a la acción (muestra gratis en vivo + WhatsApp comercial).

---

## Fases de Implementación

### Fase 1: Arquitectura y Estructura de la Página
- **Ruta:** `src/app/como-funciona/page.tsx`
- **Componentes base:** Integración con `BrandHeader`, `BrandFooter`, `DotCanvas`, `PageTracker` y `WebChatWidget`.
- **Estructura semántica:** 9 secciones modulares con diseño responsive, variables CSS de la marca (`#FF6B00`, fondo oscuro elegante, tipografía Inter).

### Fase 2: Componentes Interactivos Clave
1. **Hero Comercial con Notificación WhatsApp:** Mockup visual que simula la interacción del agente con el dueño del negocio.
2. **Comparador Antes y Después de Foto Real:** Visualización interactiva para demostrar cómo la foto casera del cliente se transforma en un cartel comercial de alto impacto sin deformar el plato.
3. **Selector Interactivo de Estilos:** Split Lateral con precio, Encabezado Gourmet y Ficha de Receta con ingredientes.
4. **Simulador de Comando por WhatsApp:** Demostración de cómo se aprueba una semana entera de posts con un mensaje.
5. **Tabla Comparativa de Mercado:** Nosotros vs Agencia Tradicional vs Hacerlo Solo los fines de semana.
6. **Módulo de Conversión Doble:** 
   - Generación express de muestra comercial (conecta con `/api/public/muestras`).
   - Botón directo de chat comercial a WhatsApp con mensaje preconfigurado.

### Fase 3: Integración de Navegación y Enlaces
- Añadir enlace sutil o botón "Cómo Funciona" en `BrandHeader` para que cualquier visitante de la web pueda descubrir esta presentación sin reemplazar la portada actual.

### Fase 4: Verificación, Build y Despliegue
- Validación con `npm run build` para asegurar cero errores de compilación o SSR.
- Verificación de diseño en móviles y escritorio.
- Commit y push a `origin/main`.
