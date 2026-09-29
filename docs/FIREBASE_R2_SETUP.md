# Firebase y Cloudflare R2: configuración paso a paso

Esta guía corresponde a `noova-intranet` y al modelo descrito para Noova Learn Mining. Las reglas de Firestore ya están en `firestore.rules`. R2 almacena los archivos; Firestore conserva sus metadatos y la clave privada del objeto.

## 1. Modelo usado por las reglas

El perfil que ya usa la app es `usuarios/{uid}` con `nombre`, `correo`, `rol` (`alumno` o `admin`), `plan` (`gratis` o `premium`) y `creadoEn`. El alta crea perfiles `alumno/gratis`; el dueño solo puede cambiar su nombre. El rol y el plan se asignan desde un proceso confiable.

El esquema de catálogo aún no está conectado a Firestore en la interfaz. Las reglas preparan este modelo en español:

- `categorias/{categoriaId}`: `nombre`, `descripcion`, `activa`, `creadoEn`, `actualizadoEn`.
- `cursos/{cursoId}`: `nombre`, `descripcion`, `categoriaId`, `nivel` (`basico`, `intermedio`, `avanzado`), `publicado`, `acceso` (`gratis`, `premium`), `portadaKey` opcional, `creadoEn`, `actualizadoEn`, `creadoPor`.
- `cursos/{cursoId}/clases/{claseId}`: `nombre`, `descripcion`, `orden`, `publicado`, `creadoEn`, `actualizadoEn`, `creadoPor`.
- `cursos/{cursoId}/clases/{claseId}/contenidos/{contenidoId}`: `nombre`, `tipo` (`video`, `documento`), `rutaR2`, `orden`, `acceso` (`gratis`, `premium`), `creadoEn`, `actualizadoEn`.
- `usuarios/{uid}/progreso/{cursoId}_{claseId}`: `cursoId`, `claseId`, `completado`, `completadoEn`, `actualizadoEn`.

El campo `usuarios/{uid}.plan` es la fuente del acceso Premium en esta versión; no hay una colección de entitlements por curso. Un alumno gratis puede ver metadatos del catálogo publicado y contenidos marcados `gratis`. El plan premium permite además los contenidos `premium`. La vista de estudiante todavía presenta datos de ejemplo/vacíos y no consulta este catálogo.

## 2. Comprueba el proyecto Firebase

1. En Firebase Console abre el proyecto **noova-intranet**. El repositorio lo identifica como proyecto por defecto en `.firebaserc` y en `src/firebase/config.js`.
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
  "creadoEn": "serverTimestamp()"
}
```

`serverTimestamp()` es el valor de servidor del SDK de Firestore, no el texto literal. El alta se puede hacer antes de verificar el correo, pero el valor de `correo` debe coincidir con el token de Firebase Authentication.

Para cuentas existentes, el flujo de inicio de sesión crea el perfil si falta. Las reglas no permiten que un cliente establezca su propio rol `admin` ni que lea el perfil de otra persona.

## 5. Crea el primer administrador

1. Crea la cuenta desde Authentication o regístrala por el flujo normal y verifica el correo.
2. Identifica su UID en **Authentication → Users**.
3. En Firestore Console edita `usuarios/{uid}` y cambia `rol` a `admin`; conserva `nombre`, `correo`, `plan`, `creadoEn`. El perfil debe tener `plan: "gratis"` o `"premium"`.
4. Comprueba que esa cuenta puede abrir `/admin`. El registro público solo puede crear `rol: "alumno"` y `plan: "gratis"`.
5. Protege también la ruta `/admin` en la interfaz. Ocultar botones mejora la navegación, pero las reglas siguen siendo la protección que decide si se leen o escriben datos.

El Admin SDK y la consola pueden cambiar rol/plan porque no obedecen Firestore Rules. Si en el futuro un panel o webhook actualiza perfiles desde servidor, verifica allí el ID token o la firma del proveedor de pagos; el SDK de servidor requiere sus propios controles.

## 6. Crea datos de prueba en Firestore

En este orden, crea un documento de categoría activa, un curso asociado, una clase y un contenido. Usa IDs sencillos compatibles con las reglas (`A-Z`, `a-z`, números, guion y guion bajo). Los campos Timestamp deben ser timestamps reales.

- Categoría: `nombre`, `descripcion`, `activa: true`, `creadoEn`, `actualizadoEn`.
- Curso: `nombre`, `descripcion`, `categoriaId`, `nivel: "basico"`, `publicado: false`, `acceso: "gratis"`, `creadoPor` (UID admin), y fechas.
- Clase: `nombre`, `descripcion`, `orden: 0`, `publicado: false`, `creadoPor` (UID admin), y fechas.
- Contenido: `nombre`, `tipo: "video"`, `acceso: "gratis"`, `orden: 0`, `rutaR2` con formato `cursos/{cursoId}/clases/{claseId}/{contenidoId}`, y fechas.

Prueba primero en borrador y publícalo solo cuando la carga de archivo y sus metadatos estén listos. Las consultas del catálogo deben incluir `publicado == true`; las de categorías, `activa == true`; y las de contenido para alumnos gratis, `acceso == "gratis"`. Firestore Rules no filtran consultas: si una consulta podría devolver un documento no permitido, Firestore rechaza toda la consulta. Si una combinación necesita índice, registra el índice sugerido en `firestore.indexes.json`.

No elimines una categoría mientras tenga cursos asociados; primero reasigna esos cursos o marca la categoría `activa: false`. Borrar un curso tampoco borra automáticamente sus clases ni los archivos R2: implementa una eliminación en cascada protegida o conserva el curso como borrador (`publicado: false`) y limpia objetos mediante un proceso de backend.

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
| Alumno premium leer contenido `premium` | Permitido |
| Administrador crear/editar contenido | Permitido |
| Cuenta sin correo verificado leer el catálogo | Denegado |

Repite las pruebas con el emulador de Firestore antes de publicar cambios importantes. El Firebase Admin SDK y otros clientes de servidor omiten estas reglas; en ellos debes validar identidad y rol en el propio backend.

### Revisión de intentos de abuso

El 29 de septiembre de 2026 se validó esta versión en Firestore Emulator con 27 aserciones: 27/27 aprobadas. El arnés fue temporal y quedó fuera del repositorio. La prueba comprueba reglas y consultas de Firestore; no valida una instancia real, la interfaz, Cloudflare R2, Culqi ni el backend que firmará URLs. Repite la matriz en el emulador antes de publicar cambios posteriores.

| Intento | Protección de estas reglas |
|---|---|
| Leer datos sin autenticación o sin correo verificado | Denegado para contenido y operaciones administrativas |
| Leer el perfil de otra persona | Denegado; el perfil solo permite lectura propia |
| Crear una cuenta admin/premium o cambiarse `rol`/`plan` | Denegado; el alta solo permite `alumno/gratis` y el dueño solo cambia su nombre |
| Leer un borrador o consultar catálogo sin filtrar publicación | Denegado; la consulta debe incluir `publicado == true` |
| Leer contenido premium con plan gratis | Denegado; el campo `plan` lo actualiza un proceso confiable |
| Crear clases/contenido bajo un curso inexistente | Denegado mediante comprobación de los documentos padre |
| Agregar campos desconocidos, strings largos o tipos incorrectos | Denegado por validadores y listas cerradas de campos |
| Cambiar `correo`, `rol`, `plan` o `creadoEn` desde el perfil propio | Denegado como campo inmutable para el cliente |
| Asignar Premium tras un pago | El backend debe verificar el evento de Culqi y actualizar `usuarios/{uid}.plan` |
| Usar Firebase Admin SDK sin verificar el llamante | Las rules no protegen este caso; el backend debe autenticar y autorizar cada operación |
| Reutilizar una URL R2 filtrada antes de vencer | La firma permite el acceso hasta su expiración; usar TTL corto y no registrarla |

El progreso solo acepta una combinación válida de curso y clase publicados. El cliente todavía puede declarar que completó una clase; ese dato sirve como progreso de la interfaz, no como evidencia fiable de que el video se reprodujo hasta el final.

## 8. Crea el bucket R2 privado

1. En Cloudflare abre **Storage & databases → R2** y crea el bucket `noova-learn-media` (los nombres de bucket usan minúsculas, números y guiones).
2. Déjalo **privado**. No habilites `r2.dev`, un dominio público ni una URL permanente para los videos premium.
3. Organiza las claves así:
   - Video/documento: `cursos/{cursoId}/clases/{claseId}/{contenidoId}`.
   - Portada: `portadas/{cursoId}`.
4. Guarda en Firestore únicamente esas claves. Nunca guardes una URL prefirmada: expira y es una credencial temporal.

## 9. Crea credenciales R2 con mínimo acceso

1. En **R2 → Overview → Manage R2 API Tokens**, crea un token S3 con acceso **Object Read & Write** limitado únicamente a `noova-learn-media`.
2. Copia **Access Key ID**, **Secret Access Key** y **Account ID** en un gestor seguro. El secreto no se puede volver a consultar después de cerrar la pantalla.
3. No pongas esas credenciales en `src/firebase/config.js`, código del navegador, variables `NEXT_PUBLIC_*`, Git ni un archivo entregable.
4. Como el frontend usa `output: "export"`, no tiene rutas API de Next.js para firmar accesos. Necesitas un backend separado: recomiendo un Cloudflare Worker que use el SDK S3 compatible y guarde las credenciales como Worker Secrets. No subas un video directamente a R2 desde el navegador usando las credenciales de cuenta.

El endpoint S3 de R2 tiene la forma `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` y la región del cliente S3 es `auto`.

## 10. Prepara el Worker para autorizar cargas y reproducción

1. Crea un Worker separado, por ejemplo `noova-learn-media-api`, con Wrangler: `npx wrangler init noova-learn-media-api`.
2. En ese Worker instala un cliente S3 compatible y un generador de presigned URLs (`@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`).
3. Guarda las credenciales con Wrangler, desde la carpeta del Worker:

```powershell
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

   `wrangler secret put` publica una versión del Worker inmediatamente; hazlo primero en un Worker de desarrollo. Configura `R2_ACCOUNT_ID`, `R2_BUCKET_NAME` y `FIREBASE_PROJECT_ID` como variables del Worker. Para desarrollo local usa `.dev.vars`, agrégalo a `.gitignore` y nunca lo compartas.
4. Crea dos operaciones HTTPS: `POST /upload-url` y `POST /playback-url`. Ambas reciben `Authorization: Bearer <Firebase ID token>`.
5. Verifica criptográficamente el ID token con Firebase Admin SDK; no basta con decodificar el JWT. Consulta `usuarios/{uid}` para comprobar `rol` y `plan`.
6. En `/upload-url`, exige `rol == "admin"`, valida los IDs, tipo MIME y tamaño permitido; luego firma un `PUT` por pocos minutos para una clave exacta `cursos/{cursoId}/clases/{claseId}/{contenidoId}`. Firma también el `Content-Type` esperado.
7. El navegador hace el `PUT` directamente a la URL prefirmada. Solo después de confirmar que la carga terminó, el backend o la app autorizada registra `contenidos/{contenidoId}` en Firestore con `rutaR2` y metadatos. Si falla la carga, no publiques el curso y limpia el objeto/documento incompleto.
8. En `/playback-url`, comprueba que el curso y la clase están publicados y que el contenido es `gratis` o que `usuarios/{uid}.plan == "premium"`. Recién entonces firma un `GET` temporal. Renueva la URL si vence durante una sesión larga.
9. Usa expiraciones cortas. Una URL prefirmada funciona como una credencial al portador: cualquiera que la reciba puede usarla hasta que expire.
10. Tras validar el pago de Culqi, solo un backend confiable debe cambiar `usuarios/{uid}.plan` a `premium`. Nunca marques una compra como pagada desde el cliente.

R2 admite carga simple de hasta 5 GiB por objeto; para videos grandes o cargas reanudables utiliza multipart. Define además un límite de producto para el tamaño del video y controla el uso/costo del bucket.

## 11. Configura CORS de R2

En el bucket abre **Settings → CORS Policy** y agrega los orígenes reales. No uses `*` para la aplicación autenticada. Ejemplo para desarrollo y producción:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://TU-DOMINIO-DE-PRODUCCION"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type", "Range"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

Usa solamente los métodos y headers que realmente firmen tus URLs. El origen debe coincidir exactamente con el host y esquema del navegador. CORS no reemplaza autorización: el Worker y la URL prefirmada controlan quién puede acceder.

## 12. Revocación, backups y mantenimiento

- El modelo actual no tiene un campo de desactivación. Para bloquear una cuenta, deshabilítala en Firebase Authentication o agrega un estado controlado por backend y actualiza las reglas para exigirlo.
- Una URL R2 ya prefirmada no se puede revocar individualmente antes de su expiración. Usa vencimientos cortos y no la registres en logs.
- Configura export/backups de Firestore antes de producción. R2 requiere una estrategia de respaldo independiente; verifica periódicamente que puedes recuperar los objetos.
- Las Firestore Rules no protegen R2. La autorización de cada operación R2 debe repetirse en el Worker.
- Las reglas actuales no implementan la UI, las operaciones CRUD, el Worker, la integración de Culqi ni la carga multipart. Esos son los siguientes cambios de aplicación después de configurar el proyecto y acordar el contrato de datos.
