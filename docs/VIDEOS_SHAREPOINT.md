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

1. Crear/editar curso permite subir portada de hasta 5 MB (JPG, PNG o WebP).
   Storage guarda portadas/{cursoId}; Firestore guarda portadaKey.
2. Dentro del curso, Nueva clase / Editar clase permite navegar las carpetas de
   CURSOS y seleccionar MP4 o WebM existente. No hay que escribir rutas ni subirlo
   nuevamente. La selección no mueve ni modifica el archivo de Microsoft.
3. El modal muestra el reproductor grande a la derecha y el formulario a la izquierda.
   En móvil se apilan. Al guardar correctamente se publica la clase, sin checkbox.
4. El video se guarda con acceso gratis para alumnos inscritos. El acceso Premium
   a nivel del curso sigue existiendo; no ha sido eliminado globalmente.
5. La portada del video es automática: Microsoft devuelve su miniatura para el
   reproductor y las listas buscan un fotograma al 20 % de la duración. Portada del
   curso como respaldo cuando está disponible. No se guarda un fotograma en Storage.
6. obtenerVideo valida sesión, correo verificado, rol alumno, estado activo,
   publicación, inscripción y acceso. Devuelve un enlace temporal de Microsoft.

El backend incluye funciones de subida de archivos por sesiones de Graph, pero
quedaron fuera del formulario actual al elegirse el explorador de videos existentes.
La portada personalizada de clase también quedó fuera del flujo final. Las reglas
locales todavía admiten su referencia; no se utiliza desde el modal.

## Funciones del flujo actual

| Función | Usuario | Propósito |
| --- | --- | --- |
| listarVideosMicrosoft | Administrador activo verificado | Carpetas y MP4/WebM bajo CURSOS, con paginación |
| previsualizarVideoMicrosoft | Administrador activo verificado | Enlace del video seleccionado antes de guardar |
| obtenerVideo | Alumno autorizado | Reproducción y miniatura |

No se envía el Client Secret al navegador. Los enlaces temporales son accesibles
para quien los posea mientras sigan válidos; no equivalen a protección DRM.

## Pruebas locales

```powershell
powershell -STA -ExecutionPolicy Bypass -File .\scripts\configurar-videos-local.ps1
```

Cuando el script espere, copiar el valor completo del secreto, volver y pulsar
Enter sin pegar. Lo guarda en functions/.secret.local (ignorado por Git/deploy).

En dos terminales:

```powershell
npm run emulador:videos
```

```powershell
npm run dev
```

Abrir localhost:3000. Solo Functions se emula; sesión, Firestore y Storage usan el
proyecto real noova-intranet, y Microsoft también es real. Crear cursos/clases
modifica datos reales de esta intranet. La UI del emulador está en 127.0.0.1:4000.
Tras cambiar el backend reiniciar el comando del emulador para recompilar.

La compilación de producción no usa el emulador. Hosting necesita Functions
publicadas y acceso de su cuenta de servicio al secreto remoto.

## Verificación y problemas conocidos

- La lectura de Pumpsim y la selección de videos fueron confirmadas por el usuario.
- Compilación de Functions, TypeScript, ESLint y 13 pruebas simuladas pasaron.
- La portada no pudo subirse: la consola confirmó que falta habilitar Storage →
  Firestore. Acciones exactas en ENTREGA_PROPIETARIO.md.
- El último diseño y los fotogramas deben comprobarse en navegador.
- No se ha publicado esta integración de Functions/Hosting por el agente.
- Las imágenes incluyen progreso y límite de 45 segundos para no bloquear el modal.
- Los videos dependen de la vigencia del secreto compartido de Entra.
- La lista de clases carga videos para buscar fotogramas; validar consumo/rendimiento
  con cursos grandes antes de dar por terminada la prueba de producción.
## Eliminación desde administración

El botón Eliminar permite borrar cursos con clases y clases con videos, previa
confirmación. eliminarContenidoAdmin exige administrador activo verificado y
elimina recursivamente el documento y sus subcolecciones de Firestore. No elimina
archivos de Microsoft ni portadas de Storage. Inscripciones, progreso y exámenes
guardados fuera del curso permanecen como registros históricos; no se borran
automáticamente. Reiniciar el emulador para probar; publicar la función al llevar
a Hosting. Las pruebas automatizadas ahora incluyen 16 casos.
