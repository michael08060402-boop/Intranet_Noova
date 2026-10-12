# Clases consecutivas y examen final

Implementado el 12 de octubre de 2026. El avance se marca manualmente; no se mide
todavía el porcentaje del video reproducido.

- La primera clase publicada está habilitada. Cada siguiente requiere completar
  todas las anteriores, según `orden` y el ID como desempate.
- `registrarClaseCompletada` verifica alumno activo, correo verificado,
  inscripción, plan y clases anteriores antes de guardar el progreso.
- Para desmarcar una clase completada hay que desmarcar primero las posteriores.
- `obtenerVideo` aplica la misma condición antes de consultar Microsoft.
- `iniciarExamenAlumno` requiere todas las clases publicadas completadas y al
  menos una clase. Crea un único intento en una transacción; reanudarlo no cambia
  su inicio ni sus respuestas. Los intentos previos se conservan.
- Las reglas rechazan crear intentos y escribir progreso directamente desde el
  navegador. Las respuestas y entregas siguen usando las reglas existentes.
- El servidor guarda el tiempo definido por el administrador en cada nuevo intento.
  El alumno no puede elegir otro tiempo. Los intentos existentes se conservan.
- Los borradores no cuentan. Publicar otra clase o cambiar el orden puede cambiar
  los requisitos para iniciar un examen nuevo.

## Publicación necesaria, incluso para probar desde localhost

Desplegar primero las funciones, luego las reglas y finalmente Hosting:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT = "60"
firebase deploy --only "functions:obtenerVideo,functions:registrarClaseCompletada,functions:iniciarExamenAlumno" --project noova-intranet
firebase deploy --only "firestore:rules" --project noova-intranet
firebase deploy --only hosting --project noova-intranet
```

No se requiere cambiar credenciales de Microsoft ni el ERP. El agente no realizó
estos despliegues.

## Prueba manual

Crear un curso gratuito publicado con dos clases publicadas y un examen. Con un
alumno nuevo e inscrito, comprobar que la segunda clase y el examen estén bloqueados,
también entrando por sus URL. Completar manualmente la primera clase, comprobar que
se habilite la segunda y luego completar la segunda para desbloquear el examen.
Iniciar el examen y recargar: el tiempo y las respuestas guardadas deben conservarse.

Verificación local: compilación de Functions, TypeScript y ESLint correctos;
22 pruebas simuladas de Functions y 28 pruebas de reglas en el emulador pasan,
incluidas las nuevas comprobaciones de tiempo y textos protegidos.
