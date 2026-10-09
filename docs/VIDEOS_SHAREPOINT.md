# Videos y portadas: configuración vigente

Para habilitación y publicación en web.app, ver [Entrega al propietario](ENTREGA_PROPIETARIO.md).

## Almacenamiento

- Videos: OneDrive empresarial de `contactos@noovasac.com`, mediante Microsoft Graph.
- Portadas de cursos: Firebase Storage de noova-intranet.
- Datos y referencias: Firestore de noova-intranet.
- Secreto: MICROSOFT_CLIENT_SECRET en Secret Manager del mismo proyecto.

Se reutiliza la aplicación de Entra del ERP. No se modifica el ERP.

```text
Tenant ID: 380bbe09-b7c8-4c9f-a5c3-e293ab02f443
Client ID: d51e6ab3-a063-4073-ad4a-4cde94956b5c
Usuario: contactos@noovasac.com
Carpeta: NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS
```

La carpeta contiene dos espacios después de `11.`. MS_DRIVE_ID y MS_CLIENT_SECRET
son nombres anteriores que esta integración ya no usa. MS_TENANT_ID,
MS_CLIENT_ID y MS_VIDEO_USER se configuran en functions/.env.noova-intranet.

## Flujo actual

1. Crear/editar curso permite elegir una portada de hasta 5 MB (JPG, PNG o WebP).
   El navegador la reduce a 1280 px de ancho en JPEG antes de subirla.
   Storage guarda portadas/{cursoId}; Firestore guarda portadaKey.
2. Dentro del curso, Nueva clase / Editar clase permite navegar las carpetas de
   CURSOS y seleccionar MP4 o WebM existente. No hay que escribir rutas ni subirlo
   nuevamente. La selección no mueve ni modifica el archivo de Microsoft.
3. El modal muestra el reproductor grande a la derecha y el formulario a la izquierda.
   En móvil se apilan. Al guardar correctamente se publica la clase, sin checkbox.
4. El video se guarda con acceso gratis para alumnos inscritos. El acceso Premium
   a nivel del curso sigue existiendo; no ha sido eliminado globalmente.
5. La miniatura del video es automática y se guarda una sola vez: al guardar la
   clase, actualizarMiniaturaClase copia la miniatura de Microsoft a Storage
   (portadas-clases/{cursoId}/{claseId}) y su enlace al campo `miniatura` de la clase.
   Las listas y el reproductor muestran esa imagen; ya no abren cada video. Las
   clases guardadas antes la generan al abrir Administrar curso.
6. obtenerVideo valida sesión, correo verificado, rol alumno, estado activo,
   publicación, inscripción y acceso. Devuelve un enlace temporal de Microsoft.

El backend incluye funciones de subida de archivos por sesiones de Graph, pero
quedaron fuera del formulario actual al elegirse el explorador de videos existentes.
La portada personalizada de clase se retiró; las reglas de `contenidos` todavía
aceptan `portadaKey` para no rechazar documentos antiguos que la tengan.

## Funciones del flujo actual

| Función | Usuario | Propósito |
| --- | --- | --- |
| listarVideosMicrosoft | Administrador activo verificado | Carpetas y MP4/WebM bajo CURSOS, con paginación |
| previsualizarVideoMicrosoft | Administrador activo verificado | Enlace del video seleccionado antes de guardar |
| obtenerVideo | Alumno autorizado | Enlace de reproducción |
| actualizarMiniaturaClase | Administrador activo verificado | Guarda la miniatura del video en Storage |

No se envía el Client Secret al navegador. Los enlaces temporales son accesibles
para quien los posea mientras sigan válidos; no equivalen a protección DRM.

## Rendimiento

- Cada instancia de la función reutiliza el enlace de un video durante 30 minutos
  (Microsoft lo mantiene válido cerca de una hora), así no consulta Graph en cada clase.
- Si el enlace vence con la clase abierta, el reproductor pide uno nuevo una vez y
  continúa en el segundo donde iba.
- SharePoint entrega el archivo tal cual, sin calidad adaptable. Subir los videos en
  H.264/AAC, 720p o 1080p, con `faststart` (por ejemplo
  `ffmpeg -i entrada.mp4 -c:v libx264 -crf 23 -preset slow -vf scale=-2:720 -c:a aac -b:a 128k -movflags +faststart salida.mp4`)
  hace que empiecen a reproducirse mucho antes.

## Pruebas con las funciones desplegadas

Desarrollo y Hosting llaman a las funciones de noova-intranet en us-east1.
No se utiliza el emulador de Functions ni los scripts locales de Microsoft.

```powershell
npm run dev
```

Abrir localhost:3000, entrar como administrador, seleccionar un video de Microsoft
y comprobar la previsualización. Después guardar la clase y reproducirla como alumno
inscrito. Estas pruebas usan datos reales de la intranet y Microsoft.
Las funciones deben estar desplegadas y su cuenta de servicio debe poder leer
MICROSOFT_CLIENT_SECRET en Secret Manager. La clave local ya no se utiliza.


