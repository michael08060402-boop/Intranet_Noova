# Pendientes

Actualizado: 12 de octubre de 2026. Este archivo recoge trabajo pendiente, no funcionalidades ya implementadas. La guía de publicación es [ENTREGA_PROPIETARIO.md](ENTREGA_PROPIETARIO.md).

## Implementado y confirmado

- Portadas de cursos en Storage: el usuario confirmó la subida. Las nuevas se convierten a WebP, con un máximo de 1280 px en su lado mayor.
- Caché persistente de portadas y tres puntos durante la carga. El usuario aplicó CORS al bucket y confirmó una mejora en localhost.
- Explorador de videos de Microsoft, previsualización y reproducción con autorización. Las miniaturas se guardan como imágenes en Storage.
- Clases consecutivas y examen habilitado al completar todas las clases publicadas. El marcado sigue siendo manual; ver [PROGRESO_Y_EVALUACIONES.md](PROGRESO_Y_EVALUACIONES.md).
- Reportes de alumnos y resultados en Excel (.xlsx), con logo y diseño, sin filtros. Los botones conservan el texto “(CSV)” por solicitud del usuario; los archivos son Excel.
- Retirados los scripts locales de Microsoft, la subida de videos desde la computadora y los validadores de reglas que quedaron sin uso.
- Mejoras de accesibilidad: foco, salto al contenido, modales, mensajes, opción de examen sin límite y soporte para subtítulos/transcripción protegidos. Ver [ACCESIBILIDAD_WCAG.md](ACCESIBILIDAD_WCAG.md).

## Verificación y publicación pendientes

1. Comprobar la última versión en web.app: portada, caché, explorador, miniaturas y reproducción como alumno inscrito.
2. Probar con un alumno sin progreso que la segunda clase y el examen estén bloqueados, también entrando por URL; completar clases en orden y comprobar el desbloqueo.
3. Probar el examen: guardado de respuestas, recarga sin reiniciar el tiempo, herramientas, entrega al agotarse el tiempo y calificación. Falta ampliar las pruebas de reglas para entrega fuera de tiempo.
4. Descargar ambos reportes y comprobarlos en Excel con datos reales. Verificar totales, notas, fechas y que incluyen todos los registros aunque la pantalla esté filtrada.
5. Confirmar que las siete funciones vigentes y las reglas actuales estén publicadas. El agente no realizó despliegues; los comandos fueron entregados al usuario.
6. Completar los casos CP-01 a CP-13 con evidencia real, especialmente los flujos de videos y evaluaciones. La auditoría del 9 de octubre utilizó servicios simulados.
7. Sincronizar los manuales y los documentos Word/PDF de `documentacion-v0.3` con estos cambios. No se modificaron esos archivos binarios durante esta actualización.
8. Completar la revisión WCAG con NVDA/VoiceOver, zoom real, todas las rutas/estados y los videos reales. Preparar subtítulos revisados y audiodescripción cuando sea necesaria; el código no genera estos contenidos.

## Pendiente funcional

- Culqi: el pago sigue siendo una simulación. Falta cobro real, verificación del pago en el backend y activación/vencimiento del plan Premium.
- Certificados: definir autorización de emisión, firma, formato y condiciones; implementar generación y descarga.
- Completar clases según video reproducido: medir tramos vistos si se decide reemplazar el botón manual.
- Archivos adjuntos o tareas en PDF/Word: no implementados. El examen actual se crea con preguntas en la app.
- Calificación automática en el servidor: actualmente la administra el panel, aunque puede calcular puntajes de preguntas de opción múltiple.
- Correos de notificaciones: actualmente los avisos se muestran dentro de la plataforma.
- Limpieza de imágenes y registros asociados al eliminar cursos: el borrado recursivo elimina el curso y sus subcolecciones, pero no los archivos de Storage/Microsoft ni los registros externos.
- Elegir calculadoras individualmente por examen: actualmente se habilita o deshabilita todo el panel.
- Cambio de rol desde la app, asignación de cursos a alumnos/empresas y nombre/apellidos separados: pendientes si se requieren.

## Preparación y mantenimiento

- Optimizar los videos antes de colocarlos en Microsoft (H.264/AAC y faststart); ver [VIDEOS_SHAREPOINT.md](VIDEOS_SHAREPOINT.md).
- Volver a subir portadas antiguas si se quiere convertirlas a WebP; no se migran automáticamente.
- Validar las fórmulas de las calculadoras con el docente.
- Revisar App Check, política de contraseñas, configuración de correos de Authentication, copias de seguridad, alertas de costos y vencimiento del secreto compartido de Entra.
- Preparar dominio propio y CSP según las necesidades de publicación; revisar restricciones de la API key sin bloquear los servicios usados.
- Evaluar el arranque en frío de Functions con mediciones reales antes de cambiar instancias mínimas.
- Consolidar estilos de diálogos de confirmación repetidos cuando se revise su mantenimiento.

## Comprobaciones locales actuales

- `npm run test:videos`: 22 pruebas simuladas de Functions pasan, incluidos ajustes de tiempo y textos protegidos.
- `npm run test:reglas`: 28 pruebas en el emulador de Firestore pasan; necesita Java 21. Solo usa `demo-noova`.
- `npm run test:reportes`: 3 pruebas del archivo Excel pasan.
- `npm run test:accesibilidad`: 7 escenarios pasan en navegador con servicios simulados; axe no detecta infracciones en los estados cubiertos.
- TypeScript, ESLint de los archivos modificados y compilación de Functions correctos. La compilación de la web se verificó al implementar el reporte de alumnos; no equivale a validar la última versión desplegada.

Las pruebas simuladas y del emulador no sustituyen la prueba con Firebase y Microsoft reales. Los resultados históricos permanecen en [QA_2026-10-09.md](QA_2026-10-09.md).
