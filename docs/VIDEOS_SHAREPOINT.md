# Videos de las clases en SharePoint

Los videos viven en una biblioteca de SharePoint de Noova. La plataforma nunca muestra la vista de Microsoft: el alumno ve el video en el reproductor de la página de clase, y una Cloud Function de Firebase decide si puede verlo.

## Cómo funciona

1. En el panel de administración, cada clase guarda la ruta del archivo dentro de la biblioteca (por ejemplo `Ventsim/basico-1.mp4`) y quién puede verlo: todos los alumnos inscritos o solo el plan Premium. Se guarda en Firestore, en `cursos/{cursoId}/clases/{claseId}/contenidos/video`.
2. Cuando el alumno abre la clase, la página llama a la función `obtenerVideo` con su sesión de Firebase.
3. La función revisa que el correo esté verificado, que el curso y la clase estén publicados, que el alumno esté inscrito y que su plan alcance (si el curso o el video son premium, exige el plan Premium).
4. Si todo está bien, pide el archivo a Microsoft Graph con las credenciales de la aplicación de Entra y devuelve al navegador un enlace temporal. El video va directo de SharePoint al navegador; no pasa por Firebase.

Los alumnos no pueden leer `contenidos` desde el navegador (lo impiden las reglas de Firestore), así que la ruta del archivo no se expone.

## Qué hay que configurar una vez

### 1. Plan de Firebase

Las Cloud Functions requieren el plan Blaze (pago por uso, pide tarjeta). Después de activarlo, crea una alerta de presupuesto en Google Cloud (Facturación → Presupuestos y alertas) para enterarte si el gasto se dispara.

### 2. Aplicación en Microsoft Entra

1. Entra al portal de Azure → Microsoft Entra ID → Registros de aplicaciones → Nuevo registro. Nombre sugerido: `Noova Learn Mining`. Un solo inquilino.
2. Anota el **Id. de directorio (inquilino)** y el **Id. de aplicación (cliente)**.
3. Certificados y secretos → Nuevo secreto de cliente. Copia el **valor** al crearlo (después no se puede ver) y anota la fecha de vencimiento: cuando venza, los videos dejan de cargar hasta cambiarlo.
4. Permisos de API → Agregar un permiso → Microsoft Graph → Permisos de aplicación → `Sites.Selected` → Conceder consentimiento de administrador.

Se recomienda una aplicación nueva, solo para esto, y no reutilizar la del ERP. Con `Sites.Selected` la aplicación solo ve los sitios que le concedas.

#### Si prefieres reutilizar la aplicación del ERP

El ERP (módulo Nube) pide el token con el mismo flujo de esta función y lee sus ids de `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` y `GRAPH_DRIVE_ID` (este último es el id del sitio, y el ERP usa `/sites/{id}/drive`). Para reutilizarla, esos mismos valores van aquí como `MS_TENANT_ID`, `MS_CLIENT_ID` y `MS_CLIENT_SECRET`, y `MS_DRIVE_ID` es el id de la biblioteca: `GET https://graph.microsoft.com/v1.0/sites/{GRAPH_DRIVE_ID}/drive` devuelve su `id` (empieza con `b!`). Con eso te saltas los pasos 2 y 3.

Dos cuidados: la aplicación del ERP probablemente tiene permisos amplios, así que si la reutilizas esta función podría leer mucho más de lo necesario; y si los videos van dentro de la biblioteca de la Nube, los usuarios del ERP los verían en sus carpetas. Lo más limpio es una biblioteca aparte solo para videos.

### 3. Dar acceso a la biblioteca de videos

1. Elige o crea el sitio de SharePoint y la biblioteca donde irán los videos.
2. En Graph Explorer (o con PnP PowerShell), con una cuenta administradora, obtén el id del sitio: `GET https://graph.microsoft.com/v1.0/sites/{dominio}.sharepoint.com:/sites/{nombre-del-sitio}`.
3. Concede lectura a la aplicación sobre ese sitio: `POST https://graph.microsoft.com/v1.0/sites/{id-del-sitio}/permissions` con el cuerpo:

   ```json
   {
     "roles": ["read"],
     "grantedToIdentities": [
       { "application": { "id": "{id-de-aplicación}", "displayName": "Noova Learn Mining" } }
     ]
   }
   ```

   Esta llamada requiere que quien la haga tenga consentimiento para `Sites.FullControl.All` en Graph Explorer.
4. Obtén el id de la biblioteca: `GET https://graph.microsoft.com/v1.0/sites/{id-del-sitio}/drives`. Es el valor `id` de la biblioteca que usarás (empieza con `b!`).

### 4. Configurar y publicar la función

Desde la carpeta del proyecto:

```bash
cd functions
npm install
cd ..
firebase functions:secrets:set MS_CLIENT_SECRET --project noova-intranet
firebase deploy --only functions,firestore:rules --project noova-intranet
```

- `MS_CLIENT_SECRET` es el valor del secreto de cliente del paso 2.
- Al desplegar, Firebase pregunta `MS_TENANT_ID`, `MS_CLIENT_ID` y `MS_DRIVE_ID` (los tres ids anteriores) y los guarda en `functions/.env.noova-intranet`, que Git ignora. Quien despliegue desde otro equipo tendrá que escribirlos de nuevo.
- Las reglas de Firestore se publican junto con la función porque `contenidos` cambió (campo `ruta`, lectura solo para administradores).

## Cómo cargar un video

1. Sube el archivo a la biblioteca de SharePoint. Usa MP4 (H.264 con audio AAC) de 720p: SharePoint no ajusta la calidad a la conexión del alumno, así que cada uno descarga el archivo completo.
2. En el panel de administración, abre el curso → Nueva clase (o el lápiz de una clase) → escribe la ruta en "Video (ruta en SharePoint)", relativa a la biblioteca y sin barra al inicio, y elige quién puede verlo. Solo se aceptan archivos `.mp4` y `.webm`.
3. Publica la clase. Los alumnos inscritos la verán en su vista de clase.

## Límites

- El enlace de Microsoft caduca en poco tiempo (alrededor de una hora). Si el alumno deja la pausa mucho rato, aparece "No se pudo cargar el video" con el botón Reintentar.
- No hay botón de descarga ni menú del clic derecho, pero un alumno con conocimientos puede grabar la pantalla o sacar el enlace temporal del navegador. Lo que sí se evita es compartir un enlace permanente.
- Graph tiene límites de uso. Con muchos alumnos viendo a la vez puede responder con errores temporales; si pasa de forma habitual, conviene repartir los videos en otra biblioteca o solicitar a Microsoft más cuota. Solo cambia la parte de `functions/src/index.ts` que pide el archivo.
- El administrador no puede ver el video desde el panel todavía; solo los alumnos.

## Si un video no carga

Revisa los registros de la función: `firebase functions:log --only obtenerVideo --project noova-intranet`.

- "No se encontró el video en SharePoint": la ruta de la clase no existe en la biblioteca (nombre, carpeta o extensión).
- Error 403 de Graph: la aplicación no tiene concedido el permiso sobre el sitio (paso 3.3).
- Error 401 al pedir el token: el secreto venció o `MS_TENANT_ID` / `MS_CLIENT_ID` están mal.
