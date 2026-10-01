# Pendientes

Lista viva de lo que falta o se dejó a propósito para después. Lo más importante arriba.

## Antes de publicar lo último

- **Desplegar reglas e índices** (`firebase deploy --only firestore --project noova-intranet`). Sin esto no funcionan la inscripción, el avance ni el contador de inscritos del admin. Incluye `usuarios/{uid}/inscripciones`, el requisito de estar inscrito para guardar `progreso` y la consulta de grupo `inscripciones` del administrador (con su índice en `firestore.indexes.json`).
- **Imágenes de prueba.** Las portadas y miniaturas del panel del alumno usan `paisaje-mina.webp` como relleno. Están marcadas con `TEMPORAL` en el CSS; quitarlas cuando haya portadas reales.

## Por hacer cuando estén subidas las clases

- **Bloqueo de clases.** Que el alumno no pueda abrir una clase hasta terminar la anterior (y, si se decide, que el examen final pida haber visto todas). El progreso ya se guarda; falta decidir la regla y tener los videos.
- **Reportes de avance por clase.** Los reportes cubren alumnos, cursos y resultados de exámenes. Falta avance por curso y por clase, que ya se puede armar con `usuarios/{uid}/progreso` e `inscripciones`.
- **Duración de las clases.** La vista de clase y la lista de contenido no muestran duración porque aún no se guarda; agregarla cuando los videos estén en R2.

## Panel del alumno

- **Herramientas.** El botón del menú no lleva a ninguna parte; definir qué va ahí (calculadoras, simuladores, documentos) o quitarlo.
- **Foto de perfil.** El botón "Cambiar foto" de Mi perfil está deshabilitado hasta tener R2.
- **Nombre y apellidos.** Mi perfil los muestra separados, pero se guardan juntos en `nombre` porque las reglas no aceptan un campo `apellidos`. Si se quieren separados de verdad, agregar el campo a las reglas.

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
- **Culqi** para cobrar el plan Premium. Hoy el plan se cambia a mano desde Firestore. Lo decidido:
  - Pago por periodo, no suscripción automática, para aceptar tarjeta y Yape: 1 mes S/ 10, 3 meses S/ 24 y 6 meses S/ 36 (en `src/app/alumno/premium/planPremium.ts`).
  - La pantalla de pago (`/alumno/premium/pago`) es una simulación: valida el formulario pero no cobra ni cambia el plan.
  - Para la integración real hace falta el Worker (la llave secreta no puede ir en la página), un campo de vencimiento como `premiumHasta` en el perfil y las reglas, y una colección `pagos` para el historial.
- **Asignación de cursos** a alumnos o empresas (hoy todos ven lo publicado según su plan).

## Calidad y seguridad

- **Reglas de Firestore sin probar en emulador.** Las reglas de `examenes`, `intentos`, `notificaciones` e `inscripciones` se revisaron a mano y se compilaron las pantallas, pero no se ejecutaron contra el emulador. Probar con `firebase emulators:start` antes de publicar a producción, sobre todo: alumno no puede leer `claves`, no puede editar su nota, no puede entregar fuera de tiempo.
- **Seguridad de producción.** Hoy todo corre en el navegador del administrador; las reglas son la única barrera. Conviene mover la calificación y los avisos a Cloud Functions.
- **Diseño móvil del panel de administración.** En pantallas pequeñas el encabezado del admin se desborda y algunos botones quedan fuera de la vista. Se arregla en la fase visual.
