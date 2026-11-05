# Subtitulos automaticos de los videos existentes

Se incorporaron los once WebVTT proporcionados a `functions/src/subtitulos-videos.json`.
Solo se empaquetan con Functions; no se incluyen en `public` ni en el bundle de
la web. `obtenerVideo` devuelve el texto despues de validar alumno, inscripcion,
plan, publicacion y secuencia. La previsualizacion lo devuelve solo al admin.

La asociacion inicial usa la ruta exacta dentro de
`NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS`, no el orden del listado.
No tenemos los IDs de Microsoft confirmados para estos once archivos: no se
implemento una asociacion persistente por ID. Si se renombra o mueve un video,
debe actualizarse esta correspondencia. Cambiar el orden del listado no afecta.

Correspondencias confirmadas:

1. Curso de Aplicacion Pumpsim 3D 01.mp4
2. Curso de Aplicacion Pumpsim Advanced 3D 03 - EXTRA.mp4
3. Curso de Aplicacion Pumpsim Advanced 3D 03.mp4
4. Proyecto Sin Nombre(1).mp4
5. Proyecto Sin Nombre(2).mp4
6. Proyecto Sin Nombre.mp4
7. Pumpsim 03.mp4: pendiente, sin WebVTT proporcionado.
8. Pumpsim02.mp4
9. Sesion 3 - Disco 01.mp4
10. Vuma 02.mp4
11. Vuma 03.mp4
12. Vuma 05.mp4

Funciona en clases existentes y nuevas sin adjuntar archivos desde el admin.
El reproductor incluye una pista en espanol y un boton CC visible sobre el video,
con estado activado/desactivado y acceso por teclado. El boton solo aparece si
hay subtitulos. El control propio de pantalla completa amplia el contenedor para
conservar CC; requiere soporte Fullscreen API del navegador. Los textos privados de una clase, si
existian, tienen prioridad. Los archivos no fueron corregidos editorialmente;
comprobar sincronizacion y terminologia en videos reales. Se verificaron encabezado
WebVTT y marcas de tiempo, asi como las once correspondencias con pruebas simuladas.

Publicar ambos endpoints modificados y Hosting para la previsualizacion:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT = "60"
firebase deploy --only "functions:obtenerVideo,functions:previsualizarVideoMicrosoft" --project noova-intranet
firebase deploy --only hosting --project noova-intranet
```

Sin cambios de permisos ni en ERP. El archivo 7 se puede incorporar despues y
requiere volver a publicar Functions. Videos futuros no incluidos no reciben
subtitulos automaticamente hasta registrar su correspondiente archivo.
