# Pendientes

Lo que falta, ordenado por lo que lo desbloquea. Más detalle técnico en `DECISIONES_TECNICAS.md`.

## 1. Lo que impide avanzar (depende de Luis o de Noova)

1. **Habilitar permisos en noova-intranet:** Storage debe poder consultar Firestore y la cuenta de servicio de Functions debe leer MICROSOFT_CLIENT_SECRET. Ver [ENTREGA_PROPIETARIO.md](ENTREGA_PROPIETARIO.md).
2. **Confirmar facturación y permisos de publicación:** la aplicación de Entra compartida con el ERP y los IDs ya están identificados; no crear otra integración ni modificar el ERP.
3. **Publicar la intranet:** reglas actuales, tres funciones del flujo de videos y Hosting, siguiendo la guía de entrega. El propietario habilita IAM; quien tenga permisos puede publicar.
4. **Prueba completa en web.app:** portada de curso, explorador, previsualización, fotograma y reproducción como alumno. Lectura de Microsoft y selección local ya confirmadas; no equivale a producción validada.
5. **Decisión de pagos:** Culqi real o plan manual en esta versión (conversar con el Ing. Alfredo).
6. **Certificados:** Luis consulta si Noova puede emitirlos. Si se aprueba, definir quién firma, vencimiento, formato (PDF con código de verificación) y nota mínima.

## 2. Se puede hacer ahora, sin esperar nada

- **Gestión de alumnos desde el admin (RF-13):** el plan y el estado (activa/suspendida) ya se cambian desde Alumnos, con confirmación. Falta el rol, que hoy las reglas no dejan cambiar desde la app.
- **Pruebas de las reglas en el emulador:** hechas (CP-13), 23 pruebas el 05/10/2026. Se corren con `npm run test:reglas` (necesita Java 21) y están en `pruebas_emulador/reglas.test.mjs`: alumno sin acceso a `claves`, su nota, Premium ni `contenidos`; cuentas suspendidas y sin sesión bloqueadas; cierre, reapertura y eliminación de tickets; borrar solo las notificaciones propias; perfil solo con el correo verificado. Falta probar la entrega fuera de tiempo.
- **Casos de prueba CP-01 a CP-13** del documento de requisitos, ejecutados y registrados. Hechos: CP-03 y CP-13. Esperan los videos: CP-04 y CP-10.
- **Manual de usuario** (alumno y administrador) y actualización del documento de requisitos a la versión 0.3.
- **Revisar las fórmulas** de las calculadoras con quien dicta las clases (tabla de altitud, Vm 20 o 30 m/min, C = 130 y eficiencia 70 % por defecto).
- Reemplazar las imágenes de relleno (`paisaje-mina.webp`, marcadas `TEMPORAL` en el CSS) cuando haya portadas reales.

## 3. Antes de producción

- **App Check** para la función de videos: hoy cualquier usuario con sesión puede llamarla (valida plan e inscripción, pero App Check frena el uso desde fuera de la web).
- Dominio propio con HTTPS, copias de seguridad de Firestore y alerta de vencimiento del secreto de Entra.
- **Correos de Authentication** (cuando haya Blaze, que desbloquea las plantillas): remitente "Noova Learn Mining", asunto en español y "Responder a" `contactos@noovasac.com`; página propia `/accion` para verificar el correo y cambiar la contraseña con el diseño de la plataforma. El nombre público del proyecto ya se puede cambiar a "Noova Learn Mining".
- **Limpiar cuentas sin verificar:** función programada que borre de Authentication las cuentas que no verificaron su correo en 7 días (requiere Blaze). Mientras tanto se borran a mano.
- Mover la calificación y los avisos a Cloud Functions: hoy todo corre en el navegador del administrador y las reglas son la única barrera.

## 4. Siguiente versión

- **Bloqueo de clases:** no abrir una clase hasta terminar la anterior y, si se decide, pedir todas vistas para el examen final.
- **Duración de las clases** (se guarda cuando los videos estén en SharePoint).
- **Exámenes en PDF o Word:** requieren definir dónde se guardan los archivos (SharePoint, por la misma función de Firebase).
- **Calificación inmediata** con una Cloud Function que lea la clave al entregar.
- **Correos:** las notificaciones son solo dentro de la plataforma; enviar correo requiere backend.
- **Subida de videos desde el equipo:** backend de sesiones preparado, fuera del flujo actual. El explorador de videos existentes y la previsualización del administrador ya están implementados.
- **Asignación de cursos** a alumnos o empresas (hoy todos ven lo publicado según su plan).
- **Herramientas por curso:** hoy el administrador solo activa o desactiva las calculadoras por examen; se puede elegir cuáles.
- **Más herramientas:** cálculo de PUMA, fajas transportadoras y otras que pida el curso.
- **Culqi:** integración real con función de servidor, campo `premiumHasta` en el perfil y colección `pagos`.
- Nombre y apellidos separados (requiere agregar el campo a las reglas).
