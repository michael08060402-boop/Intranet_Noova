# Accesibilidad: cambios y verificación

Actualizado: 12 de octubre de 2026. Objetivo: WCAG 2.2 AA. Esta revisión mejora
el código y verifica estados concretos; no es una certificación de conformidad.

## Qué se hizo y para qué

| Tema | Cambio | Utilidad |
| --- | --- | --- |
| Navegación por teclado | Enlace “Saltar al contenido principal”, visible al recibir foco | Evita recorrer el menú en cada página |
| Foco visible | Anillo azul con separación blanca en enlaces, botones y campos; soporte de colores forzados | Permite identificar dónde está el teclado, sobre fondos claros y oscuros |
| Calculadoras del examen | Panel convertido en diálogo nativo; Escape cierra y el foco vuelve al botón | Evita recorrer controles tapados y perder la posición al cerrar |
| Tiempo del examen | El administrador define el tiempo; el alumno no lo modifica | Adaptaciones de tiempo para WCAG 2.2.1 pendientes |
| Tiempo seguro | El servidor guarda `duracionMin` en el intento; el alumno no puede cambiarlo después | Recargar conserva el tiempo elegido; las reglas validan esa misma duración |
| Estado del examen | Guardado anunciado con `role=status`; avisos de cinco minutos, un minuto y agotamiento | El lector de pantalla informa cambios sin anunciar cada segundo |
| Preguntas y errores | Respuestas asociadas al enunciado; campos de preguntas obligatorios; errores asociados al formulario | Permite comprender qué se responde y localizar datos pendientes |
| Subtítulos | El admin adjunta WebVTT en español (hasta 100 KB); el reproductor usa `track kind=captions` | Permite leer diálogo y sonidos relevantes sin depender del audio |
| Transcripción | Campo de texto (hasta 50 000 caracteres) y sección desplegable junto al reproductor | Permite consultar el contenido hablado y su descripción visual |
| Privacidad del contenido | Textos guardados en `cursos/{cursoId}/clases/{claseId}/accesibilidad/texto`; lectura directa solo admin | Evita exponer una clase Premium en los datos públicos del catálogo |
| Entrega de textos al alumno | `obtenerVideo` los devuelve después de validar inscripción, plan y orden de clases | Mantiene la misma autorización que el video |
| Texto ampliado y móvil | Controles con mínimos de tamaño, campos limitados al contenedor, texto que se ajusta y barra del examen que se reorganiza | Reduce recortes y desbordamiento al ampliar texto o usar una pantalla estrecha |
| Movimiento | Se reduce animación/transición si el sistema solicita menos movimiento | Evita animaciones innecesarias para quienes las desactivan |
| Títulos | El título de la pestaña sigue el encabezado principal de cada página | Ayuda a identificar la página con lector de pantalla y múltiples pestañas |
| Portadas | Agrupación accesible conserva los textos de las etiquetas dentro de la portada | Evita ocultar “Inscrito” o “Premium” dentro de un elemento tratado como imagen única |
| Descargas | Aclaración visible de que el archivo con diseño es Excel (.xlsx) | Reduce confusión mientras los botones conservan el texto “CSV” solicitado |

El servidor guarda el tiempo definido por el administrador en cada nuevo intento.
Los intentos existentes conservan su tiempo y no se reinician.
Las adaptaciones de tiempo para WCAG 2.2.1 quedan pendientes de definir.

## Uso de subtítulos y transcripción

Los campos de carga de subtitulos y transcripcion y el boton CC personalizado
se retiraron por solicitud del usuario. Los textos ya guardados se conservan;
las pistas existentes pueden usar los controles nativos del reproductor.

## Pruebas ejecutadas

- 7 escenarios automatizados de navegador pasan.
- Axe analiza once pantallas en escritorio y 320 px, registro/recuperación, el
  examen iniciado, modal de clase y las cinco calculadoras con datos de ejemplo.
  No detecta infracciones A/AA en los estados probados.
- Se verifica salto por teclado, Escape, retorno del foco, adjuntar WebVTT, texto
  al 200 %, espaciado ampliado y reflow de los formularios a 320 × 256 px.
- 22 pruebas simuladas de Functions y 28 pruebas de reglas de Firestore pasan;
  incluyen tiempo sin límite, rechazo de entregas tardías con tiempo estándar y
  protección de los textos de accesibilidad.
- TypeScript y ESLint de los archivos modificados pasan. La compilación de la web
  y de Functions se verificó durante el trabajo; repetir antes de publicar cambios.

Los escenarios del navegador usan componentes reales con Firebase y sesión
simulados. No prueban cuentas reales ni constituyen una auditoría completa de
todas las combinaciones de datos o de todos los criterios WCAG.

```powershell
npm ci
npm run test:accesibilidad
npm run test:videos
npm run test:reglas
```

La prueba de navegador usa Microsoft Edge si está instalado en Windows. En otro
equipo, instalar el Chromium de Playwright con `npx playwright install chromium`.
El emulador de reglas requiere Java 21 y usa solo `demo-noova`.

## Publicación

No se desplegó desde el agente. Para aplicar tiempo y textos protegidos, publicar
primero las funciones, luego las reglas y finalmente la web:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT = "60"
firebase deploy --only "functions:obtenerVideo,functions:iniciarExamenAlumno" --project noova-intranet
firebase deploy --only "firestore:rules" --project noova-intranet
firebase deploy --only hosting --project noova-intranet
```

La app local también usa las funciones y reglas desplegadas. Publicar únicamente
Hosting no habilita los nuevos campos ni los cambios de tiempo en el servidor.

## Verificación manual pendiente antes de declarar conformidad

- NVDA/VoiceOver con usuarios reales: lectura y orden de foco, mensajes, menús y
  formularios, incluidos los estados de error de conexión.
- Zoom real del navegador al 200 % y 400 %, además de las simulaciones automatizadas.
- Recorrido completo de las rutas y sus estados, incluyendo soporte, Premium,
  notificaciones, calificación y datos largos en tablas.
- Subtítulos reales, sincronización, contenido visual esencial y audiodescripción.
- Evaluar los documentos descargables y sus contenidos, no solo la interfaz web.

Referencias: [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
[guía de criterios](https://www.w3.org/WAI/WCAG22/quickref/) y
[tiempo ajustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).
