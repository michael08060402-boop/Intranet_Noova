# Configuración y publicación de la intranet

Actualizado: 12 de octubre de 2026. Proyecto destino: `noova-intranet`.
Esta guía describe la configuración vigente y cómo publicar. El ERP no requiere cambios ni un nuevo Client Secret. El agente no realizó despliegues.

## Estado comunicado por el usuario

- Se creó el bucket de Storage y se confirmó la subida de portadas.
- Se otorgó acceso al secreto a la cuenta de servicio prevista para Functions.
- Se aplicó `storage.cors.json` al bucket y se confirmó que la caché acelera las portadas en localhost.
- Se entregaron comandos de publicación. Hay que verificar la última versión en web.app; no se afirma aquí que todos los cambios estén desplegados.

## Funciones vigentes

| Función | Usuario | Acción |
| --- | --- | --- |
| listarVideosMicrosoft | Admin activo y verificado | Explora carpetas y videos existentes bajo CURSOS |
| previsualizarVideoMicrosoft | Admin activo y verificado | Obtiene un enlace para el video seleccionado |
| actualizarMiniaturaClase | Admin activo y verificado | Guarda la miniatura de Microsoft en Storage |
| eliminarContenidoAdmin | Admin activo y verificado | Elimina curso/clase y sus subcolecciones de Firestore |
| obtenerVideo | Alumno autorizado | Valida inscripción, plan y clases anteriores; devuelve un enlace temporal |
| registrarClaseCompletada | Alumno autorizado | Guarda el marcado manual respetando el orden de las clases |
| iniciarExamenAlumno | Alumno autorizado | Crea el intento tras completar las clases, sin reiniciar intentos existentes |

Las cuatro funciones de Microsoft utilizan `MICROSOFT_CLIENT_SECRET`. Las demás no necesitan ese secreto. La subida de videos desde la computadora se retiró del código; se seleccionan archivos existentes.

## Configuración de Microsoft

Se reutiliza la aplicación de Entra del ERP:

```dotenv
MS_TENANT_ID=380bbe09-b7c8-4c9f-a5c3-e293ab02f443
MS_CLIENT_ID=d51e6ab3-a063-4073-ad4a-4cde94956b5c
MS_VIDEO_USER=contactos@noovasac.com
```

Estos valores van en `functions/.env.noova-intranet`, excluido de Git. El Client Secret está en Secret Manager de `noova-intranet`, con el nombre `MICROSOFT_CLIENT_SECRET`. No se coloca en el frontend, en este archivo de variables ni en Git.

Carpeta consultada, con dos espacios después de `11.`:

```text
NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS
```

## Permisos y almacenamiento

- La cuenta de servicio que efectivamente ejecuta las funciones debe tener `roles/secretmanager.secretAccessor` sobre el secreto. El código no establece una cuenta personalizada; confirmar la cuenta en el despliegue. La predeterminada prevista es `29412803376-compute@developer.gserviceaccount.com`.
- Storage necesita permiso para consultar Firestore y comprobar los roles. El usuario confirmó que la subida funciona después de corregir este acceso.
- Las portadas se guardan en `portadas/{cursoId}`; Firestore guarda `portadaKey`. Las miniaturas van a `portadas-clases/{cursoId}/{claseId}` y su URL al campo `miniatura` de la clase.
- CORS permite descargar las portadas mediante código desde los orígenes de `storage.cors.json`. Ya se aplicó al bucket. Si cambia el dominio o puerto, revisar esa lista.
- Dar permisos no publica el código. CORS no reemplaza las reglas de acceso.

Para volver a aplicar CORS cuando corresponda, desde una terminal con Google Cloud CLI y el archivo disponible:

```bash
gcloud storage buckets update gs://noova-intranet.firebasestorage.app --cors-file=storage.cors.json --project=noova-intranet
```

El comando reemplaza la configuración CORS del bucket. Si se añadieron otros orígenes o métodos, incorporarlos al archivo antes de aplicarlo.

## Preparar y comprobar el proyecto

Usar Node.js 22, Firebase CLI y el repositorio actualizado:

```powershell
npm ci
npm --prefix functions ci
firebase login
npm --prefix functions run build
npx tsc --noEmit
npm run test:videos
npm run test:reportes
npm run test:reglas
npm run build
```

`test:reglas` requiere Java 21 y usa exclusivamente el proyecto emulado `demo-noova`. La app, incluso desde localhost, llama a las funciones desplegadas y utiliza Firebase/Microsoft reales. No necesita scripts locales de Microsoft ni el emulador de Functions.

## Publicar cuando corresponda

Ejecutar primero las funciones y continuar solo cuando terminen correctamente:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT = "60"
firebase deploy --only "functions:obtenerVideo,functions:listarVideosMicrosoft,functions:previsualizarVideoMicrosoft,functions:actualizarMiniaturaClase,functions:eliminarContenidoAdmin,functions:registrarClaseCompletada,functions:iniciarExamenAlumno" --project noova-intranet
firebase deploy --only "firestore:rules,storage" --project noova-intranet
firebase deploy --only hosting --project noova-intranet
```

Hosting compila automáticamente mediante su predeploy. Todos los comandos apuntan a la intranet. Los índices están en `firestore.indexes.json`; desplegarlos si una consulta requiere un índice pendiente.

Si las funciones antiguas de subida se publicaron en algún momento, quitarlas del código no las elimina del servicio mediante este despliegue selectivo. Revisar la consola y retirarlas por separado solo si existen y se confirma que no tienen consumidores.

## Prueba final en web.app

1. Crear/editar un curso con portada y comprobar que aparece en catálogo, detalle, Mis cursos y Continúa aprendiendo.
2. Dejar cargar la portada y recargar para comprobar la caché. En localhost la consola indica su origen; la primera visita necesita descargarla.
3. Crear dos clases con videos de Microsoft y comprobar previsualización y miniaturas.
4. Inscribir un alumno activo con correo verificado. La clase 2 y el examen deben estar bloqueados hasta completar las clases anteriores, incluso por URL directa.
5. Completar clases manualmente, iniciar el examen y recargar sin reiniciar el tiempo. Probar herramientas, entrega y calificación.
6. Comprobar que el alumno no pueda explorar Microsoft como admin, escribir progreso directamente ni acceder a contenido Premium con plan gratis.
7. Descargar ambos reportes y revisar logo, fechas, totales y datos en Excel. Los botones dicen “(CSV)”, pero generan `.xlsx` para conservar el diseño; no aplican los filtros de pantalla.
8. Repetir con el servidor local apagado: web.app debe funcionar sin la computadora del desarrollador.

## Alcance pendiente

Culqi real, certificados, completar clases según video reproducido, adjuntos/tareas, limpieza de archivos al eliminar cursos y calificación en servidor no forman parte de esta entrega. Ver [PENDIENTES.md](PENDIENTES.md) y [PROGRESO_Y_EVALUACIONES.md](PROGRESO_Y_EVALUACIONES.md).
