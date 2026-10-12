# Firebase: configuración paso a paso

Actualizado: 12 de octubre de 2026. Guía del proyecto Firebase `noova-intranet`. Los videos viven en Microsoft; portadas y miniaturas, en Firebase Storage. Las funciones validan videos, progreso e inicio del examen. Las reglas están en `firestore.rules` y `storage.rules`; la configuración y publicación completas están en [ENTREGA_PROPIETARIO.md](ENTREGA_PROPIETARIO.md).

## 1. Modelo usado por las reglas

El perfil es `usuarios/{uid}` con `nombre`, `correo`, `rol` (`alumno` o `admin`), `plan` (`gratis` o `premium`), `creadoEn` y `estado` (`activo` o `suspendido`; si falta se trata como `activo`). El alta crea perfiles `alumno/gratis/activo`; el dueño solo puede cambiar su nombre. Un administrador lee los perfiles y cambia únicamente `plan` y `estado`; el `rol` se cambia desde la consola. Una cuenta `suspendido` pierde el acceso a catálogo, contenidos y administración.

- `categorias/{categoriaId}`: `nombre`, `descripcion`, `activa`, `creadoEn`, `actualizadoEn`.
- `cursos/{cursoId}`: `nombre`, `descripcion`, `categoriaId`, `nivel` (`basico`, `intermedio`, `avanzado`), `publicado`, `acceso` (`gratis`, `premium`), `portadaKey` opcional, `creadoEn`, `actualizadoEn`, `creadoPor`.
- `cursos/{cursoId}/clases/{claseId}`: `nombre`, `descripcion`, `orden`, `publicado`, `miniatura` opcional, `creadoEn`, `actualizadoEn`, `creadoPor`.
- `cursos/{cursoId}/clases/{claseId}/accesibilidad/texto`: `subtitulos`, `transcripcion`, `actualizadoEn`. Solo el admin lo lee/escribe directamente; `obtenerVideo` entrega el texto al alumno autorizado.
- `intentos/{examenId_uid}.duracionMin`: duración efectiva guardada por el servidor (0 significa sin límite). El alumno no puede modificarla; las reglas usan este valor o, para intentos antiguos, la duración del examen.
- `cursos/{cursoId}/clases/{claseId}/contenidos/{contenidoId}`: `nombre`, `tipo` (`video`, `documento`), `ruta`, `orden`, `acceso` (`gratis`, `premium`), `creadoEn`, `actualizadoEn`. Solo los administradores lo leen; el alumno pide el video a la función.
- `examenes/{examenId}` (con `claves/clave` aparte), `intentos/{examenId_uid}`, `usuarios/{uid}/progreso`, `usuarios/{uid}/inscripciones` y `usuarios/{uid}/notificaciones`: ver `DECISIONES_TECNICAS.md`.

El campo `usuarios/{uid}.plan` es la fuente del acceso Premium; no hay colección de entitlements por curso.

## 2. Comprueba el proyecto Firebase

1. En Firebase Console abre el proyecto **noova-intranet**. El repositorio lo identifica como proyecto por defecto en `.firebaserc` y en `src/firebase/config.ts`.
2. En **Firestore Database**, comprueba si ya existe la base `(default)`. `firebase.json` declara la ubicación `us-east1`; verifica que la base real coincida. Si no existe, créala en modo **Native** y selecciona `us-east1` antes de crear datos. La ubicación de una base existente no se cambia desde las reglas.
3. En **Authentication → Sign-in method**, habilita **Email/Password** y **Google**. Configura el correo de soporte y agrega los dominios de desarrollo y producción en **Settings → Authorized domains**.
4. Conserva la verificación de correo. El perfil se crea antes de que se verifique el correo, como hace el flujo actual. Luego la vista protegida exige un correo verificado; al confirmar, la app renueva el ID token con `getIdToken(true)`.

## 3. Publica las Firestore Rules

Desde la raíz del repositorio, primero verifica que `firebase use` apunte a `noova-intranet`. Luego publica únicamente las reglas:

```powershell
firebase use
firebase deploy --only firestore:rules --project noova-intranet
```

También puedes copiar `firestore.rules` a **Firestore Database → Rules** en Firebase Console y pulsar **Publish**. No abras reglas temporales con `allow read, write: if true`.

## 4. Perfil de usuario

El helper `asegurarPerfil` del proyecto crea `usuarios/{uid}` tras iniciar sesión. Su forma es:

```json
{
  "nombre": "Nombre del usuario",
  "correo": "correo-obtenido-de-currentUser.email",
  "rol": "alumno",
  "plan": "gratis",
  "estado": "activo",
  "creadoEn": "serverTimestamp()"
}
```

`serverTimestamp()` es el valor de servidor del SDK de Firestore, no el texto literal. El alta se puede hacer antes de verificar el correo, pero el valor de `correo` debe coincidir con el token de Firebase Authentication.

Para cuentas existentes, el flujo de inicio de sesión crea el perfil si falta. Las reglas no permiten que un cliente establezca su propio rol `admin` ni que lea el perfil de otra persona.

## 5. Crea el primer administrador

1. Crea la cuenta desde Authentication o regístrala por el flujo normal y verifica el correo.
2. Identifica su UID en **Authentication → Users**.
3. En Firestore Console edita `usuarios/{uid}` y cambia `rol` a `admin`; conserva `nombre`, `correo`, `plan`, `estado`, `creadoEn`. El perfil debe tener `plan: "gratis"` o `"premium"`.
4. Comprueba que esa cuenta puede abrir `/admin`. El registro público solo puede crear `rol: "alumno"` y `plan: "gratis"`.
5. Protege también la ruta `/admin` en la interfaz. Ocultar botones mejora la navegación, pero las reglas siguen siendo la protección que decide si se leen o escriben datos.

El Admin SDK y la consola pueden cambiar rol/plan porque no obedecen Firestore Rules. Si en el futuro un panel o webhook actualiza perfiles desde servidor, verifica allí el ID token o la firma del proveedor de pagos; el SDK de servidor requiere sus propios controles.

## 6. Crea datos de prueba en Firestore

En este orden, crea un documento de categoría activa, un curso asociado, una clase y un contenido. Usa IDs sencillos compatibles con las reglas (`A-Z`, `a-z`, números, guion y guion bajo). Los campos Timestamp deben ser timestamps reales.

- Categoría: `nombre`, `descripcion`, `activa: true`, `creadoEn`, `actualizadoEn`.
- Curso: `nombre`, `descripcion`, `categoriaId`, `nivel: "basico"`, `publicado: false`, `acceso: "gratis"`, `creadoPor` (UID admin), y fechas.
- Clase: `nombre`, `descripcion`, `orden: 0`, `publicado: false`, `creadoPor` (UID admin), y fechas.
- Contenido: `nombre`, `tipo: "video"`, `acceso: "gratis"`, `orden: 0`, `ruta` con la ruta del archivo en la biblioteca de SharePoint (por ejemplo `Ventsim/basico-1.mp4`), y fechas.

Las consultas del catálogo deben incluir `publicado == true`; las de categorías, `activa == true`. Los alumnos no consultan `contenidos` directamente: piden el enlace a `obtenerVideo`, que verifica inscripción, plan y clases anteriores. Firestore Rules no filtran consultas: si una consulta podría devolver un documento no permitido, Firestore rechaza toda la consulta. Si una combinación necesita índice, registra el índice sugerido en `firestore.indexes.json`.

No elimines una categoría mientras tenga cursos asociados; primero reasigna esos cursos o marca la categoría `activa: false`. La app borra cursos/clases mediante `eliminarContenidoAdmin`, que elimina también sus subcolecciones. Los archivos de Storage/Microsoft y registros externos permanecen; su limpieza automática está pendiente.

## 7. Prueba permisos antes de usar datos reales

En Firebase Console abre **Firestore Database → Rules → Rules Playground**. Comprueba como mínimo:

| Caso | Resultado esperado |
|---|---|
| Sin sesión leer cursos | Denegado |
| Alumno ver curso publicado | Permitido con correo verificado y perfil `alumno` |
| Alumno consultar cursos sin filtrar publicación | Denegado |
| Alumno ver un borrador | Denegado |
| Alumno crear/modificar/eliminar curso o categoría | Denegado |
| Alumno cambiar su `rol` o `plan` | Denegado |
| Alumno gratis leer contenido `premium` | Denegado |
| Alumno premium leer `contenidos` directamente | Denegado; la reproducción se autoriza en `obtenerVideo` |
| Alumno escribir progreso directamente | Denegado; usar `registrarClaseCompletada` |
| Alumno crear un intento directamente | Denegado; usar `iniciarExamenAlumno` |
| Alumno consultar su intento aún inexistente | Consulta por `uid` y `examenId`: devuelve vacío y escucha su creación |
| Administrador crear/editar contenido | Permitido |
| Administrador listar alumnos y cambiar `plan`/`estado` | Permitido |
| Administrador cambiar el `rol` de un perfil | Denegado |
| Administrador editar un curso cuya categoría quedó inactiva | Permitido; solo se exige categoría activa al crear el curso o moverlo |
| Alumno con `estado: "suspendido"` leer el catálogo | Denegado |
| Cuenta sin correo verificado leer el catálogo | Denegado |

Repite las pruebas con el emulador de Firestore antes de publicar cambios importantes. El Firebase Admin SDK y otros clientes de servidor omiten estas reglas; en ellos debes validar identidad y rol en el propio backend.

### Revisión de intentos de abuso

Las reglas actuales, incluidas las restricciones de progreso e inicio del examen, pasaron 28 pruebas en el emulador el 12 de octubre de 2026. Se ejecutan con `npm run test:reglas` (Java 21, proyecto `demo-noova`). Repetirlas al cambiar las reglas. Una prueba del emulador no valida Firebase real, la interfaz, Culqi ni Microsoft; falta ampliar la cobertura de entrega fuera de tiempo.

| Intento | Protección de estas reglas |
|---|---|
| Leer datos sin autenticación o sin correo verificado | Denegado para contenido y operaciones administrativas |
| Leer el perfil de otra persona | Denegado; solo lo lee su dueño o un administrador |
| Crear una cuenta admin/premium o cambiarse `rol`/`plan`/`estado` | Denegado; el alta solo permite `alumno/gratis/activo` y el dueño solo cambia su nombre |
| Leer un borrador o consultar catálogo sin filtrar publicación | Denegado; la consulta debe incluir `publicado == true` |
| Leer contenido premium con plan gratis | Denegado; el campo `plan` lo actualiza un proceso confiable |
| Crear clases/contenido bajo un curso inexistente | Denegado mediante comprobación de los documentos padre |
| Agregar campos desconocidos, strings largos o tipos incorrectos | Denegado por validadores y listas cerradas de campos |
| Cambiar `correo`, `rol`, `plan`, `estado` o `creadoEn` desde el perfil propio | Denegado como campo inmutable para el cliente |
| Usar la app con una cuenta `suspendido` | Denegado; deja de contar como alumno o administrador para las reglas |
| Asignar Premium tras un pago | El backend debe verificar el evento de Culqi y actualizar `usuarios/{uid}.plan` |
| Usar Firebase Admin SDK sin verificar el llamante | Las rules no protegen este caso; el backend debe autenticar y autorizar cada operación |
| Compartir el enlace temporal de un video | Caduca en poco tiempo y se pide de nuevo con la sesión del alumno (ver `VIDEOS_SHAREPOINT.md`) |

El progreso solo acepta una combinación válida de curso y clase publicados. El cliente todavía puede declarar que completó una clase; ese dato sirve como progreso de la interfaz, no como evidencia fiable de que el video se reprodujo hasta el final.

## 8. Mantenimiento

- Para bloquear una cuenta, cambia `usuarios/{uid}.estado` a `suspendido`: las reglas dejan de reconocerla. Un ID token ya emitido sigue válido en Firebase Auth hasta que expire; para cortar también el inicio de sesión, deshabilita la cuenta en Authentication.
- Configura exportación o copias de seguridad de Firestore antes de producción.
- Las reglas no protegen SharePoint: la autorización de cada video se repite en la función `obtenerVideo`.
- Al validar un pago, solo un proceso confiable (función de servidor) debe cambiar `usuarios/{uid}.plan` a `premium`; nunca se marca una compra como pagada desde el cliente.
