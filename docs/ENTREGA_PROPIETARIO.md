# Entrega al propietario: habilitar y publicar la intranet

Actualizado: 9 de octubre de 2026. Proyecto destino: `noova-intranet`.
Esta guía describe lo que falta para funcionar en `web.app`. No autoriza por sí
misma un despliegue. El ERP no requiere cambios ni un nuevo Client Secret.

## Qué se entrega y qué debe hacer el propietario

La conexión ya está escrita en este proyecto. No falta crear una integración de
Microsoft ni volver a programar el explorador, el reproductor o la subida de portadas.
Falta dar permisos a los servicios y publicar ESTE código en noova-intranet.

### Videos: conexión que ya tiene el código

`functions/src/index.ts` contiene las funciones utilizadas por la web:

| Acción en la intranet | Código que la realiza | Conexión ya implementada |
| --- | --- | --- |
| Pulsar Elegir de Microsoft | listarVideosMicrosoft | Lee carpetas y videos bajo CURSOS del OneDrive de Contactos |
| Seleccionar un video y verlo a la derecha | previsualizarVideoMicrosoft | Obtiene un enlace temporal de Microsoft para el administrador |
| Abrir la clase como alumno | obtenerVideo | Comprueba acceso en Firestore y devuelve el enlace del video |
| Guardar una clase con video (o abrir Administrar curso) | actualizarMiniaturaClase | Guarda la miniatura de Microsoft en Storage y su enlace en la clase |

`src/firebase/cursos.ts` llama esas funciones. El formulario del administrador
ya está conectado a esas llamadas. Las pantallas del alumno también lo están.

Las funciones se autentican con la aplicación existente del ERP:

```text
MS_TENANT_ID = 380bbe09-b7c8-4c9f-a5c3-e293ab02f443
MS_CLIENT_ID = d51e6ab3-a063-4073-ad4a-4cde94956b5c
MS_VIDEO_USER = contactos@noovasac.com
Secreto que busca el código = MICROSOFT_CLIENT_SECRET
Proyecto del secreto = noova-intranet
```

La URL que construye el backend es:

```text
https://graph.microsoft.com/v1.0/users/contactos%40noovasac.com/drive/root:/{ruta}
```

La raíz del explorador ya está definida en el código:

```text
NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS
```

La selección guarda la ruta en Firestore:
`cursos/{cursoId}/clases/{claseId}/contenidos/video`.
No se guardan los archivos de video en Firebase.

**Acción concreta del propietario para videos:** permitir que la cuenta de
servicio de estas funciones lea el secreto MICROSOFT_CLIENT_SECRET que YA existe.
Después se despliegan estas funciones y la web. No hay que pegar la clave en
el frontend, pasar la clave a los alumnos ni modificar el ERP. Los pasos de consola
y comandos están en las secciones 1 y 3 de esta guía.

### Portadas: conexión que ya tiene el código

`src/app/admin/cursos/NuevoCurso.tsx` permite seleccionar y previsualizar la imagen.
`subirPortadaCurso`, en `src/firebase/cursos.ts`, guarda el archivo en Storage
`portadas/{cursoId}` y la referencia `portadaKey` en Firestore `cursos/{cursoId}`.
La tarjeta del curso usa esa referencia para mostrar la imagen.

**Acción concreta del propietario para portadas:** en Firebase → noova-intranet →
Storage → Reglas, pulsar Corregir problema y aceptar el permiso para consultar
Firestore. Las reglas ya escritas en storage.rules necesitan leer
`usuarios/{uid}.rol` para comprobar que el usuario es administrador.
No se necesita crear una Firebase Function para subir estas imágenes.

### Orden de entrega

1. Entregar al propietario esta versión del repositorio y esta guía, sin archivos
   que contengan claves. Reproducir los tres IDs anteriores en la configuración.
2. El propietario o administrador de IAM habilita los dos permisos anteriores.
3. Michael, o quien tenga permisos para desplegar, ejecuta los comandos de la
   sección 3 desde ESTE proyecto y siempre con `--project noova-intranet`.
4. Comprobar en web.app las acciones de la sección 4 con el emulador apagado.

**Resultado esperado:** seleccionar un video existente desde el panel y verlo
como alumno en web.app, más subir y mostrar portadas de cursos. Todo funciona
sin ejecutar scripts ni mantener encendida la computadora del desarrollador.
Dar permisos sin desplegar no publica el código; desplegar sin permisos no permite
leer el secreto ni validar las subidas de portada.

## Estado comprobado

| Parte | Estado |
| --- | --- |
| Credenciales de la aplicación de Entra compartida con el ERP | Configuradas en desarrollo |
| Lectura del video de Pumpsim y enlace temporal | Prueba real exitosa comunicada por el usuario |
| Selección de videos de Microsoft | Funciona en la prueba local del usuario |
| Previsualización grande en el modal del administrador | Implementada; pendiente de validar el último diseño |
| Publicación de clase al guardar, sin checkbox | Implementada |
| Miniatura de clases | Imagen guardada en Storage por `actualizarMiniaturaClase` (9 de octubre); pendiente de comprobar en web.app |
| Subida de portada de curso a Storage | Implementada; bloqueada por permiso Storage → Firestore |
| Bucket de Storage | Creado por el usuario |
| Reglas de Storage | El usuario mostró reglas corregidas publicadas; consola muestra falta de permiso entre servicios |
| Compilación, TypeScript y ESLint | Correctos en las comprobaciones realizadas |
| Pruebas automatizadas de Functions | 13 casos pasan, con servicios simulados |
| Functions y Hosting de esta integración en producción | No desplegados por el agente; pendiente de publicación |

Las pruebas simuladas no reemplazan una prueba completa en Hosting.

## 1. Lo que debe habilitar el propietario o un administrador de IAM

### Storage puede consultar los roles en Firestore

En Firebase Console, seleccionar **noova-intranet → Storage → Reglas** y pulsar
**Corregir problema** en el aviso de llamadas entre servicios. Aceptar el permiso
que propone Firebase. Este acceso permite comprobar el rol `admin` de quien sube
portadas. No cambiar las reglas a acceso público.

### Las funciones pueden leer el secreto

En Google Cloud, seleccionar **noova-intranet → Secret Manager →
MICROSOFT_CLIENT_SECRET**:

1. Confirmar que existe una versión habilitada con el valor del Client Secret de
   Entra compartido con el ERP. No confundir el valor con el ID del secreto.
2. Confirmar qué cuenta de servicio ejecutará las funciones de segunda generación.
   El código no establece una cuenta personalizada. La candidata predeterminada
   del proyecto es `29412803376-compute@developer.gserviceaccount.com`; verificarla
   en la configuración efectiva del despliegue antes de asignar permisos.
3. Conceder **Secret Manager Secret Accessor**
   (`roles/secretmanager.secretAccessor`) a esa cuenta, sobre este secreto.
4. Esa misma cuenta escribe las miniaturas en Storage (`portadas-clases/`). La
   cuenta predeterminada ya puede hacerlo si conserva el rol Editor; si se usa una
   cuenta con permisos reducidos, darle **Storage Object Admin** sobre el bucket.

La cuenta del desarrollador no necesita leer la clave en el navegador. Quien
realice el despliegue debe tener permisos suficientes para desplegar Functions y
vincular el secreto; Firebase puede solicitar permisos IAM durante ese proceso.

No crear otra aplicación en Microsoft ni renovar el secreto del ERP para esta
entrega. Si vence o se rota la clave compartida, actualizar las copias usadas por
ambos proyectos de forma coordinada.

### Proyecto listo para desplegar

Confirmar facturación Blaze y permisos del usuario que publicará. Ser Editor no
garantiza todas las autorizaciones para desplegar Functions o modificar IAM.
El propietario puede habilitar permisos y el desarrollador hacer la publicación.

## 2. Preparar el proyecto recibido

Usar Node.js 22 (versión configurada para Functions), Firebase CLI y esta versión
actualizada del repositorio. No compartir `functions/.secret.local`.

```powershell
npm ci
npm --prefix functions ci
firebase login
firebase projects:list
```

Crear o revisar `functions/.env.noova-intranet` (excluido de Git):

```dotenv
MS_TENANT_ID=380bbe09-b7c8-4c9f-a5c3-e293ab02f443
MS_CLIENT_ID=d51e6ab3-a063-4073-ad4a-4cde94956b5c
MS_VIDEO_USER=contactos@noovasac.com
```

La clave no va en este archivo: producción usa Secret Manager.

## 3. Verificar y publicar cuando se autorice

Desde la raíz de Noova-Intranet:

```powershell
npm --prefix functions run build
npx tsc --noEmit
npm run test:videos
npm run build
```

Si las comprobaciones pasan, publicar reglas y las funciones que utiliza el
flujo actual, siempre indicando el proyecto:

```powershell
firebase deploy --only firestore:rules,storage --project noova-intranet
firebase deploy --only functions:obtenerVideo,functions:listarVideosMicrosoft,functions:previsualizarVideoMicrosoft,functions:actualizarMiniaturaClase,functions:eliminarContenidoAdmin --project noova-intranet
firebase deploy --only hosting --project noova-intranet
```

No publicar con `--project noova-sac-erp`. No usar un despliegue general de todas
las funciones: `iniciarSubidaVideo` y `confirmarSubidaVideo` quedaron en código,
pero el flujo actual selecciona archivos existentes y no necesita esas funciones.
Los índices de Firestore ya tienen su propia configuración; publicarlos si la
consola señala que los índices requeridos por otras pantallas están pendientes.

El hosting está configurado para compilar mediante su predeploy. La compilación
de producción no conecta con el emulador aunque exista .env.development.local.

## 4. Prueba final en web.app

- Entrar como administrador y crear un curso con una portada JPG, PNG o WebP de
  hasta 5 MB. Verificar el archivo en Storage `portadas/{cursoId}` y `portadaKey`
  en Firestore `cursos/{cursoId}`.
- Crear una clase, pulsar Elegir de Microsoft, navegar por CURSOS, seleccionar un
  MP4/WebM y reproducir su previsualización antes de guardar.
- Guardar la clase: queda publicada. El curso debe estar publicado para alumnos.
- Entrar como administrador a Administrar curso de cada curso que ya tenga videos:
  las clases sin miniatura la generan solas al abrir esa página (una sola vez).
- Entrar como alumno activo con correo verificado e inscrito. Comprobar miniatura
  y reproducción. Los controles de Premium del curso aún existen; para este flujo
  seleccionar un curso gratis (el video se guarda con acceso gratis).
- Comprobar que un alumno no pueda explorar carpetas ni previsualizar como admin,
  y que una cuenta suspendida/no inscrita no pueda obtener el video.
- Apagar emulador y servidor local y repetir en web.app: producción debe funcionar
  sin la computadora del desarrollador encendida.

## 5. Lo que sigue pendiente o no forma parte de esta entrega

- Portada estándar con logo de Noova: conversada, todavía no implementada.
- Borrado de la portada desde la intranet y limpieza automática de archivos al
  eliminar cursos: no implementados. No confundir quitar una referencia con
  eliminar el archivo en Storage/Microsoft.
- Culqi: pendiente; no se ha integrado en esta etapa.
- Las portadas de curso subidas antes del 9 de octubre conservan su tamaño original
  (hasta 5 MB). Volver a subirlas para que se guarden reducidas.

## Desarrollo con servicios desplegados

La aplicación llama a las funciones desplegadas tanto desde localhost como desde
Hosting. Se retiraron los scripts locales de configuración y diagnóstico de Microsoft
y la conexión al emulador de Functions. No se necesita functions/.secret.local.
Las pruebas automatizadas se conservan en pruebas_emulador/videos.test.cjs y se
pueden ejecutar con npm run test:videos; no requieren Microsoft ni credenciales reales.


