# Primera prueba de carga de Hosting

## Prueba de una cuenta y cinco sesiones

Ejecutar `node .\pruebas_carga\alumnos.cjs` desde PowerShell. El script abre
Chrome normal con un perfil temporal exclusivo de prueba. Iniciar sesion
manualmente con Google, entrar a Mis cursos y pulsar Enter en la terminal.
Playwright se conecta por CDP local solo despues del inicio de sesion.
Si Google vuelve a bloquearlo, detener la prueba y usar cuentas de prueba con
correo y clave; no desactivar protecciones ni compartir credenciales.

El curso debe llamarse exactamente `test`; se puede cambiar con
`$env:CURSO_PRUEBA = "nombre exacto"`. La cuenta debe estar inscrita.
Tras confirmar, se abren cinco sesiones en Chrome sin ventana, usando en memoria
las sesiones obtenidas. Se mide Mis cursos, la portada del curso y el comienzo
de la reproduccion del primer video disponible, manteniendola hasta terminar
el minuto. No guarda progreso ni inicia examenes. Una cuenta compartida no
representan cinco usuarios distintos y la PC/red pueden limitar las mediciones.

Los perfiles de acceso contienen temporalmente datos de sesion: el script cierra
el Chrome de prueba y elimina esos perfiles al completar la captura. Si falla
la conexion o hay archivos bloqueados, informa la ruta para borrarla despues de
cerrar ese Chrome. No usar el perfil habitual ni subir perfiles o tokens a Git.
La prueba autenticada todavia necesita ejecucion manual; no se han medido sus resultados.

Comparacion de cache: el script ahora hace dos visitas en cada contexto, conservando
IndexedDB, CacheStorage, sessionStorage y cache HTTP. Cada visita dispone de unos
30 segundos dentro del minuto. La segunda usa navegacion completa para comprobar
tambien la cache persistente al volver a cargar la aplicacion. La tabla agrega
`visita` (1: primera, 2: segunda); las solicitudes de red tambien llevan esta marca.
Para comparar con una cuenta y una sesion: `$env:SESIONES_PRUEBA = "1"` y ejecutar
el mismo script. Si falla la primera visita no se ejecuta la segunda de esa sesion.

Optimizacion posterior: SesionProvider consulta directamente el documento de
perfil mediante su listener. Solo ejecuta asegurarPerfil (transaccion de creacion)
si el servidor confirma que falta el documento. Se conservan la comprobacion de
correo verificado, los cambios de rol/plan/estado en tiempo real y el rechazo de
perfiles provenientes solo de cache o escrituras pendientes. Tres pruebas locales
con mocks verifican estos casos y el cierre de sesion (`npm run test:sesion`).
No se ha medido aun la mejora en la web desplegada: publicar Hosting y repetir
la comparacion para obtener resultados antes/despues.

Referencias: https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp
y https://developer.chrome.com/blog/remote-debugging-port

Alcance acordado: 5 usuarios virtuales durante un minuto, solicitando únicamente
el HTML público de https://noova-intranet.web.app/ cada cinco segundos como mínimo.
Un usuario virtual no representa una sesión de alumno autenticada.

No ejecuta JavaScript, descarga portadas, inicia sesiones, reproduce videos,
consulta Firestore ni crea intentos. Por tanto no valida la capacidad de Firebase
Functions, Microsoft, el tiempo de renderizado ni el flujo completo de alumno.
Las solicitudes consumen tráfico de Hosting.

## Ejecutar desde PowerShell en la carpeta del proyecto

Si k6 aún no está instalado:

```powershell
winget install --id Grafana.k6 --exact
```

Cerrar y volver a abrir PowerShell después de instalar. Luego:

```powershell
k6 version
k6 run .\pruebas_carga\hosting.k6.js
```

No requiere deploy ni emulador. Se ejecuta desde la computadora y consulta Hosting
real. Se puede detener con Ctrl+C. No imprimir cuerpos de respuestas o tokens.

## Interpretación

- `http_req_failed`: solicitudes HTTP fallidas. Se espera 0 %.
- `checks`: HTTP 200 y tipo HTML; se espera 100 %.
- `http_req_duration`: tiempo de la solicitud, incluido el transporte desde esta
  computadora. Objetivo inicial orientativo: p95 menor de 2 segundos.
- `http_reqs`: solicitudes totales; aproximadamente hasta 60 ciclos completos.

La prueba aborta si supera un 5 % de fallos, a partir de los primeros diez segundos.
Un resultado exitoso con cinco usuarios no establece capacidad máxima ni asegura
que videos o exámenes funcionen bajo carga. Repetir con sesiones de prueba sería
otra prueba que requiere alcance, cuentas y límites propios.

Referencia: https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/constant-vus/

Estado: script preparado; no ejecutado contra producción por el agente.
