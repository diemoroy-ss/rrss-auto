const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createPlanExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Santisoft AI Systems';
  workbook.created = new Date();

  // Función para estilizar hojas
  function setupSheet(sheet, title, columns, data) {
    // Configuración para impresión
    sheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9, // A4 / Letter
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    };

    // Título principal
    sheet.mergeCells(1, 1, 1, columns.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 34;

    // Subtítulo con fecha
    sheet.mergeCells(2, 1, 2, columns.length);
    const subCell = sheet.getCell(2, 1);
    subCell.value = `Santisoft RRSS • Plan de Pruebas de Certificación Pre-Producción • ${new Date().toLocaleDateString('es-CL')}`;
    subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Fila vacía
    sheet.getRow(3).height = 8;

    // Encabezados de tabla
    sheet.getRow(4).height = 26;
    columns.forEach((col, idx) => {
      sheet.getColumn(idx + 1).width = col.width;
      const headerCell = sheet.getCell(4, idx + 1);
      headerCell.value = col.header;
      headerCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      headerCell.alignment = { vertical: 'middle', horizontal: col.align || 'left', wrapText: true };
      headerCell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Filas de datos
    let currentRow = 5;
    data.forEach((item, rIdx) => {
      const row = sheet.getRow(currentRow);
      row.height = item.height || 28;
      const isAlt = rIdx % 2 === 1;

      columns.forEach((col, cIdx) => {
        const cell = sheet.getCell(currentRow, cIdx + 1);
        cell.value = item[col.key] || '';
        cell.font = { 
          name: 'Segoe UI', 
          size: 9.5, 
          bold: col.key === 'id' || col.key === 'module' || false,
          color: { argb: col.key === 'id' ? 'FF1E293B' : 'FF334155' } 
        };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: col.align || 'left', 
          wrapText: true 
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isAlt ? 'FFF8FAFC' : 'FFFFFFFF' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
      currentRow++;
    });

    // Pie de página de la hoja
    sheet.headerFooter.oddFooter = "&L Santisoft QA &R Página &P de &N";
  }

  // ─────────────────────────────────────────────────────────────
  // HOJA 1: SMOKE TEST P0 & ENTORNO
  // ─────────────────────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet('1. Entorno y Smoke P0');
  setupSheet(sheet1, '1. VERIFICACIÓN DE ENTORNO Y SMOKE TESTS CRÍTICOS (P0)', [
    { header: '#', key: 'id', width: 8, align: 'center' },
    { header: 'Área / Componente', key: 'area', width: 20 },
    { header: 'Verificación / Paso a Ejecutar', key: 'steps', width: 42 },
    { header: 'Resultado Esperado (Criterio de Aceptación)', key: 'expected', width: 44 },
    { header: 'Estado', key: 'status', width: 14, align: 'center' },
    { header: 'Observaciones / Notas', key: 'notes', width: 26 },
  ], [
    { id: '0.1', area: 'Variables de Entorno', steps: 'Verificar CRON_SECRET en hosting de prod (Cloud Run/Vercel)', expected: 'Definido e idéntico en hosting y Cloud Tasks. Sin valor default.', status: '[  ]', notes: 'Agregado en .env.local' },
    { id: '0.2', area: 'Google Cloud Tasks', steps: 'Comprobar dispatch de tareas programadas en gcp-tasks.ts', expected: 'Headers incluyen Authorization con Bearer CRON_SECRET.', status: '[  ]', notes: '' },
    { id: '0.3', area: 'Credenciales Firebase', steps: 'Validar Service Account y variables NEXT_PUBLIC_FIREBASE_*', expected: 'Apuntan al proyecto de producción (rrss-santisoft).', status: '[  ]', notes: '' },
    { id: '0.4', area: 'OAuth Redes Sociales', steps: 'Comprobar Redirect URIs en Meta Developers, Google y TikTok', expected: 'Dominio oficial de producción registrado sin fallas de origen.', status: '[  ]', notes: '' },
    { id: '0.5', area: 'WhatsApp Bot (EvoAPI)', steps: 'Verificar conexión de la instancia de WhatsApp en Evolution API', expected: 'Opera con su número original configurado, sin desvinculación.', status: '[  ]', notes: '' },
    { id: '0.6', area: 'Compilación TypeScript', steps: 'Ejecutar npx tsc --noEmit en la terminal', expected: 'Finaliza con código de salida 0 (0 errores en todo el proyecto).', status: '✅ VALIDADO', notes: 'Verificado por agente (0 errores)' },
    { id: '1.1', area: 'Autenticación', steps: 'Iniciar sesión con cuenta cliente (Usuario A)', expected: 'Ingreso directo al panel, tokens válidos en Firebase Auth sin errores en consola.', status: '[  ]', notes: '' },
    { id: '1.2', area: 'Publicación Inmediata', steps: 'Crear -> Post con Imagen -> Publicar Ahora', expected: 'Publica exitoso en redes conectadas (FB/IG/etc.) y post pasa a status "published".', status: '[  ]', notes: '' },
    { id: '1.3', area: 'Agendamiento Automático', steps: 'Crear -> Agendar post para dentro de 10 minutos', expected: 'Cloud Tasks despacha tarea a /api/tasks/execute-post y publica puntualmente.', status: '[  ]', notes: '' },
    { id: '1.4', area: 'Detalle de Post', steps: 'Panel -> Abrir post confirmado -> Clic en "Publicar Ahora"', expected: 'Publicación inmediata con modal de confirmación y actualización en tiempo real.', status: '[  ]', notes: '' },
    { id: '1.5', area: 'Publicar Historia', steps: 'Detalle de post -> Publicar como Historia', expected: 'Valida ratio 9:16 vertical o alerta de adaptación. Publica en Stories.', status: '[  ]', notes: '' },
    { id: '1.6', area: 'Reprogramación', steps: 'Panel -> Reagendar post programado', expected: 'Actualiza fecha/hora en Firestore y cancela/crea tarea en Cloud Tasks.', status: '[  ]', notes: '' },
    { id: '1.7', area: 'Pasarela de Pago', steps: 'Planes -> Elegir plan -> Simular checkout en pasarela', expected: 'Retorno exitoso a /planes/exito y rol/plan actualizado en Firestore users.', status: '[  ]', notes: '' },
    { id: '1.8', area: 'Cuotas de Consumo', steps: 'Generar post con imagen comercial / video', expected: 'Contador de cupos (imágenes, videos, posts del mes) se descuenta en vivo.', status: '[  ]', notes: '' },
  ]);

  // ─────────────────────────────────────────────────────────────
  // HOJA 2: REGRESIONES RECIENTES
  // ─────────────────────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet('2. Regresiones Recientes');
  setupSheet(sheet2, '2. PRUEBAS DE REGRESIÓN DE CAMBIOS RECIENTES Y SEGURIDAD', [
    { header: '#', key: 'id', width: 8, align: 'center' },
    { header: 'Módulo', key: 'module', width: 18 },
    { header: 'Prueba / Caso de Prueba', key: 'test', width: 44 },
    { header: 'Comportamiento Esperado', key: 'expected', width: 44 },
    { header: 'Resultado', key: 'status', width: 14, align: 'center' },
    { header: 'Notas / Hallazgos', key: 'notes', width: 24 },
  ], [
    { id: '2.1.1', module: 'Seguridad API', test: 'Llamar a POST /api/publish-now sin Authorization header', expected: 'Responde 401 Unauthorized y no ejecuta ninguna publicación.', status: '[  ]', notes: '' },
    { id: '2.1.2', module: 'Aislamiento Tenancy', test: 'Usuario B intenta publicar postId perteneciente a Usuario A', expected: 'Responde 403 Forbidden por validación de autoría.', status: '[  ]', notes: '' },
    { id: '2.1.3', module: 'Seguridad Tareas', test: 'Usuario no-admin envía payload con isTestMode: true', expected: 'El flag es ignorado; no publica en redes oficiales de santisoft.', status: '[  ]', notes: '' },
    { id: '2.1.4', module: 'Endpoints Cron', test: 'Llamar a /api/tasks/execute-post con secreto incorrecto', expected: 'Responde 401 Unauthorized de forma estricta.', status: '[  ]', notes: '' },
    { id: '2.2.1', module: 'Publicados', test: 'Abrir /panel/publicados con cuenta con actividad', expected: 'Carga por defecto los últimos 30 días, estadísticas y grilla limpia.', status: '[  ]', notes: '' },
    { id: '2.2.2', module: 'Historial Extendido', test: 'Hacer clic en selector "Todo el historial (N)"', expected: 'Despliega hasta 150 publicaciones históricas registradas.', status: '[  ]', notes: 'Nuevo selector' },
    { id: '2.2.3', module: 'Filtros y Búsqueda', test: 'Filtrar por red social y por fecha en calendario', expected: 'Filtrado instantáneo en cliente; "Limpiar fecha" restaura 30 días.', status: '[  ]', notes: '' },
    { id: '2.3.1', module: 'Radar de Nicho', test: 'Generar análisis de nicho desde /panel/radar', expected: 'Pestañas Ideas, Tendencias, Preguntas y Ganchos cargan con datos claros.', status: '[  ]', notes: '' },
    { id: '2.3.2', module: 'Radar -> Crear', test: 'Clic en "Desarrollar este post" (Imagen o Reel)', expected: 'Redirige a Crear con tema, gancho y formato pre-completados.', status: '[  ]', notes: '' },
    { id: '2.3.3', module: 'Radar -> Estrategia', test: 'Clic en botón "Crear Planificación con Radar"', expected: 'Redirige a /panel/estrategia?goal=X&useRadar=true con meta seleccionada.', status: '[  ]', notes: 'Parámetro ?goal=X' },
    { id: '2.3.4', module: 'Estrategia Sin Rubro', test: 'Entrar a Estrategia con una marca que no tiene rubro', expected: 'Muestra alerta clara indicando configurar el rubro con botón directo.', status: '[  ]', notes: '' },
    { id: '2.4.1', module: 'Imagen Comercial', test: 'Entrar a /panel/imagen-comercial', expected: 'Campos en blanco y pregunta inicial "¿Qué quieres hacer?" (Post/Historia/Carrusel).', status: '[  ]', notes: '' },
    { id: '2.4.2', module: 'Post / Historia', test: 'Seleccionar Post (1:1 o 4:5) o Historia (9:16)', expected: 'Muestra exactamente 1 slide con ratio fijo, sin botón de agregar más.', status: '[  ]', notes: '' },
    { id: '2.4.3', module: 'Carrusel Multi-Slide', test: 'Seleccionar Carrusel y elegir hasta 5 imágenes', expected: 'Crea los slides correspondientes navegables con pestañas 1 a 5.', status: '[  ]', notes: '' },
    { id: '2.4.4', module: 'Generación con Idea', test: 'Opción "Necesito que me diseñen": ingresar idea y textos', expected: 'Genera prompt por cada slide y distribuye textos en capas tipográficas.', status: '[  ]', notes: '' },
    { id: '2.4.5', module: 'Render 5 Slides', test: 'Renderizar carrusel completo de 5 imágenes', expected: 'Cero error 413 (Payload Too Large); guarda en Storage y Biblioteca.', status: '[  ]', notes: 'Fix payload size' },
    { id: '2.5.1', module: 'Vendedores', test: 'Paso 4: elegir "Imagen Comercial" con idea y textos', expected: 'Genera diseño con capas tipográficas y botón para editar en Imagen Comercial.', status: '[  ]', notes: '' },
    { id: '2.5.2', module: 'Muestra Pública', test: 'Abrir enlace /m/[id] en ventana de incógnito', expected: 'Carga sin login, con propuesta personalizada, botón copiar copy y WhatsApp.', status: '[  ]', notes: '' },
    { id: '2.6.1', module: 'Teléfono Contacto', test: 'Revisar landing, footer, modales y WhatsApp flotante', expected: 'Único número visible: +569 3442 8848. Número anterior (83656443) eliminado.', status: '[  ]', notes: '' },
  ]);

  // ─────────────────────────────────────────────────────────────
  // HOJA 3: BARRIDO POR MÓDULOS DEL PANEL
  // ─────────────────────────────────────────────────────────────
  const sheet3 = workbook.addWorksheet('3. Barrido Módulos Panel');
  setupSheet(sheet3, '3. BARRIDO FUNCIONAL POR MÓDULOS DE USUARIO', [
    { header: '#', key: 'id', width: 8, align: 'center' },
    { header: 'Módulo del Panel', key: 'module', width: 22 },
    { header: 'Acciones a Ejecutar', key: 'actions', width: 44 },
    { header: 'Criterio de Validación', key: 'expected', width: 42 },
    { header: 'Estado', key: 'status', width: 14, align: 'center' },
    { header: 'Observaciones', key: 'notes', width: 22 },
  ], [
    { id: '3.1', module: 'Panel (Dashboard)', actions: 'Revisar timeline, alternar filtros, aprobar posts en lote', expected: 'Carga fluida de publicaciones agendadas, sin warnings.', status: '[  ]', notes: '' },
    { id: '3.2', module: 'Crear Post', actions: 'Probar modo agente vs manual; subir archivos propios', expected: 'Vista previa precisa, selector de redes, validación de caracteres.', status: '[  ]', notes: '' },
    { id: '3.3', module: 'Estrategia', actions: 'Generar plan de 7 días, 14 días y mes completo', expected: 'Distribución inteligente según catálogo y fechas de publicación.', status: '[  ]', notes: '' },
    { id: '3.4', module: 'Biblioteca Visual', actions: 'Filtrar imágenes por categoría y reutilizar en post', expected: 'Abre modal con imagen asignada y lista para publicar.', status: '[  ]', notes: '' },
    { id: '3.5', module: 'Catálogo de Productos', actions: 'Crear producto con foto, editar precio y activar carta', expected: 'Persiste en Firestore y se sincroniza con el generador.', status: '[  ]', notes: '' },
    { id: '3.6', module: 'Menú Digital QR', actions: 'Generar código QR y escanear desde teléfono móvil', expected: 'Abre carta pública optimizada para celular con precios actualizados.', status: '[  ]', notes: '' },
    { id: '3.7', module: 'Blog & Artículos SEO', actions: 'Redactar artículo con agentes, programar y publicar', expected: 'Genera contenido con etiquetas SEO y estructura adecuada.', status: '[  ]', notes: '' },
    { id: '3.8', module: 'Métricas de Redes', actions: 'Revisar gráficas de engagement y botón llevar a estrategia', expected: 'Exporta contexto de métricas al generador estratégico.', status: '[  ]', notes: '' },
    { id: '3.9', module: 'Estilos y Prompts', actions: 'Explorar biblioteca de estilos y seleccionar uno en Crear', expected: 'Aplica el prompt estructurado al motor gráfico de la app.', status: '[  ]', notes: '' },
    { id: '3.10', module: 'POC Video Remotion', actions: 'Generar Reel vertical con escenas y subtítulos', expected: 'Composición de video sin desfases de audio o render.', status: '[  ]', notes: '' },
    { id: '3.11', module: 'Configuración Marca', actions: 'Editar datos de contacto, logo PNG y colores de marca', expected: 'Se reflejan inmediatamente en banners y firmas de copy.', status: '[  ]', notes: '' },
    { id: '3.12', module: 'Multiperfil', actions: 'Cambiar entre Marca A y Marca B en el selector superior', expected: 'Aislamiento total: cada marca muestra solo sus propios datos.', status: '[  ]', notes: '' },
  ]);

  // ─────────────────────────────────────────────────────────────
  // HOJA 4: ADMINISTRACIÓN Y TRANSVERSAL
  // ─────────────────────────────────────────────────────────────
  const sheet4 = workbook.addWorksheet('4. Admin y Transversal');
  setupSheet(sheet4, '4. MÓDULOS ADMINISTRATIVOS, RESPONSIVE Y SEGURIDAD', [
    { header: '#', key: 'id', width: 8, align: 'center' },
    { header: 'Área / Vista', key: 'area', width: 20 },
    { header: 'Prueba de Validación', key: 'test', width: 44 },
    { header: 'Resultado Esperado', key: 'expected', width: 44 },
    { header: 'Estado', key: 'status', width: 14, align: 'center' },
    { header: 'Observaciones', key: 'notes', width: 22 },
  ], [
    { id: '4.1', area: 'Admin Agenda', test: 'Entrar con cuenta santisoftai@gmail.com a /admin/agenda', expected: 'Lista global de posts programados de todos los clientes.', status: '[  ]', notes: '' },
    { id: '4.2', area: 'Admin Logs', test: 'Probar filtros por día, semana y rango de fechas', expected: 'Carga de eventos con paginación y sin errores de spread.', status: '[  ]', notes: 'Corregido' },
    { id: '4.3', area: 'Admin Pagos', test: 'Verificar listado de pagos y suscripciones', expected: 'Muestra montos, planes y estados de pago actualizados.', status: '[  ]', notes: '' },
    { id: '4.4', area: 'Admin Modelos', test: 'Cambiar configuración de modelo en /admin/modelos-ia', expected: 'StatusModal confirma el cambio correctamente (sin error onClose).', status: '[  ]', notes: 'Corregido' },
    { id: '4.5', area: 'Protección Admin', test: 'Usuario normal intenta ingresar a cualquier ruta /admin/*', expected: 'Bloqueo inmediato o redirección hacia su panel privado.', status: '[  ]', notes: '' },
    { id: '5.1', area: 'Diseño Móvil', test: 'Navegar en vista móvil (375px - 414px) en Crear y Panel', expected: 'Menú responsivo, formularios adaptados y botones accesibles.', status: '[  ]', notes: '' },
    { id: '5.2', area: 'Tono y Copywriting', test: 'Revisar textos públicos, correos y paneles de usuario', expected: 'Cero menciones de "Inteligencia Artificial" o "IA"; siempre "nuestros agentes".', status: '[  ]', notes: 'Regla AGENTS.md' },
    { id: '5.3', area: 'Rendimiento y Cache', test: 'Probar recarga de páginas y navegación entre rutas', expected: 'Transiciones rápidas, componentes memoizados sin re-renders.', status: '[  ]', notes: '' },
    { id: '5.4', area: 'Criterio Go/No-Go', test: 'Evaluación final antes del despliegue oficial', expected: 'P0 y P1 100% en OK para autorizar pase a producción.', status: '[  ] GO', notes: 'Listo para prod' },
  ]);

  // Rutas de salida del archivo
  const desktopPath = path.join('C:', 'Users', 'diemo', 'Desktop', 'Plan-de-Pruebas-Santisoft.xlsx');
  const projectPath = path.join(process.cwd(), 'Plan-de-Pruebas-Santisoft.xlsx');
  const oneDrivePath = path.join('C:', 'Users', 'diemo', 'OneDrive', 'Plan-de-Pruebas-Santisoft.xlsx');

  await workbook.xlsx.writeFile(desktopPath);
  console.log(`Guardado en Escritorio: ${desktopPath}`);

  await workbook.xlsx.writeFile(projectPath);
  console.log(`Guardado en Proyecto: ${projectPath}`);

  try {
    if (fs.existsSync(path.join('C:', 'Users', 'diemo', 'OneDrive'))) {
      await workbook.xlsx.writeFile(oneDrivePath);
      console.log(`Guardado en OneDrive: ${oneDrivePath}`);
    }
  } catch (e) {
    // ignore
  }

  console.log('¡Archivo Excel generado exitosamente!');
}

createPlanExcel().catch(err => {
  console.error('Error generando Excel:', err);
  process.exit(1);
});
