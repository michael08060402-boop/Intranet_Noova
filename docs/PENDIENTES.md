# Pendientes

Lista viva de lo que falta o se dejó a propósito para después. Lo más importante arriba.

## Por hacer cuando estén subidas las clases

- **Bloqueo de clases.** Que el alumno no pueda abrir una clase hasta terminar la anterior (y, si se decide, que el examen final pida haber visto todas). Depende de tener videos subidos y del progreso real del alumno.
- **Progreso real del alumno.** Hoy "Mis cursos" no sabe qué clases vio. Guardar el avance por clase en `progreso` y usarlo en el bloqueo y en los reportes.
- **Reportes de avance por clase.** Los reportes actuales cubren alumnos, cursos y resultados de exámenes. Falta avance por curso y por clase, que se arma con el progreso anterior.

## Certificados (por consultar)

Luis va a consultar si Noova puede emitir certificados. Mientras no haya respuesta no se construye nada. Si se aprueba, definir: quién firma, si vencen (recertificación), formato (PDF con código de verificación) y si se exige nota mínima. Las notas ya se guardan por examen, así que la base está.

## Exámenes

- **Exámenes en PDF o Word.** La opción aparece deshabilitada en el constructor. Requiere almacenamiento de archivos (R2, ver abajo) para subir el documento y para que el alumno suba su resolución.
- **Calificación inmediata.** Hoy el administrador pulsa "Calificar automáticamente" y recién ahí el alumno ve su nota y recibe el aviso. Para que sea instantánea hace falta una Cloud Function (plan Blaze) que lea la clave y califique al entregar.
- **Un solo intento por alumno.** Si hace falta repetir, el administrador reinicia el intento desde Entregas. Si se quieren varios intentos configurables, cambiar el modelo de `intentos`.
- **Nota mínima.** Se dejó 16 sobre 20 por defecto (editable en cada examen). Confirmar con la persona de SSO cuál es la exigida en cada capacitación.

## Notificaciones

- **Correo.** Las notificaciones son solo dentro de la plataforma (campana). Enviar correos requiere un backend (Cloud Functions o un servicio de correo).
- El administrador ve en su campana cuántas entregas esperan nota; no recibe correos.

## Videos, archivos y pagos

- **Cloudflare R2 + Worker** para subir videos y documentos y entregarlos con enlaces firmados. Ver `docs/FIREBASE_R2_SETUP.md`.
- **Culqi** para cobrar el plan Premium. Hoy el plan se cambia a mano desde Firestore.
- **Asignación de cursos** a alumnos o empresas (hoy todos ven lo publicado según su plan).

## Calidad y seguridad

- **Reglas de Firestore sin probar en emulador.** Las reglas de `examenes`, `intentos` y `notificaciones` se revisaron a mano y se compilaron las pantallas, pero no se ejecutaron contra el emulador. Probar con `firebase emulators:start` antes de publicar a producción, sobre todo: alumno no puede leer `claves`, no puede editar su nota, no puede entregar fuera de tiempo.
- **Seguridad de producción.** Hoy todo corre en el navegador del administrador; las reglas son la única barrera. Conviene mover la calificación y los avisos a Cloud Functions.
- **Diseño móvil del panel de administración.** En pantallas pequeñas el encabezado del admin se desborda y algunos botones quedan fuera de la vista. Se arregla en la fase visual.
