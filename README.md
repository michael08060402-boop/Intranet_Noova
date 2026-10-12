# Noova Learn Mining

Intranet de capacitación minera de Contratistas Generales Noova S.A.C. (Noova Consulting). Alumnos y administradores acceden con correo o Google; los cursos se gestionan desde el panel de administración.

Estado al 12 de octubre de 2026: acceso por roles, gestión de cursos y categorías, videos de Microsoft, portadas WebP con caché, clases consecutivas con marcado manual, examen final con temporizador y herramientas, reportes Excel con logo, soporte, notificaciones internas y calculadoras. El usuario confirmó la subida de portadas y la mejora de carga después de configurar CORS. La última versión requiere comprobación completa en web.app; el agente no realizó despliegues. La guía de configuración y publicación está en [`docs/ENTREGA_PROPIETARIO.md`](docs/ENTREGA_PROPIETARIO.md). Los pendientes reales —pagos, certificados, seguimiento del video y otras mejoras— están en [`docs/PENDIENTES.md`](docs/PENDIENTES.md).

## Tecnologías

- Next.js 16 (App Router) con TypeScript, exportado como sitio estático (`output: "export"`).
- Firebase: Authentication (correo y Google), Firestore, Storage, Functions y Hosting.
- Iconos con `lucide-react`. Estilos en CSS junto a cada página o componente.
- Videos de las clases: SharePoint (Microsoft Graph) detrás de una Cloud Function de Firebase; ver `docs/VIDEOS_SHAREPOINT.md`. Las portadas de cursos se guardan en Firebase Storage y sus referencias en Firestore. Culqi (pagos) está planificado; la guía de Firebase está en `docs/FIREBASE_SETUP.md`.

## Puesta en marcha

Usar Node.js 22, también configurado para Functions.

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. La configuración pública de Firebase está en `src/firebase/config.ts`.

| Comando | Qué hace |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Genera el sitio estático en `out/`. |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run test:videos` | Prueba autorización, videos y avance con servicios simulados. |
| `npm run test:reglas` | Prueba reglas de Firestore en `demo-noova` (requiere Java 21). |
| `npm run test:reportes` | Verifica los archivos Excel generados. |
| `npm run test:accesibilidad` | Prueba teclado, axe, texto ampliado y móvil con servicios simulados. |

Las mejoras y límites de la revisión WCAG están en [`docs/ACCESIBILIDAD_WCAG.md`](docs/ACCESIBILIDAD_WCAG.md): navegación por teclado, mensajes, ajuste de tiempo, subtítulos y transcripción protegida. No se declara conformidad completa sin revisar el contenido real y recorrer la aplicación con tecnologías de apoyo.

Localhost usa las funciones desplegadas, Firestore y Storage reales de la intranet.
No necesita scripts locales de Microsoft ni el emulador de Functions. La primera
carga de una portada la descarga; después se reutiliza desde la caché del navegador
mientras esté disponible. La configuración CORS está en `storage.cors.json`.

## Estructura

```text
src/
├── app/                  Rutas (cada carpeta es una URL)
│   ├── page.tsx            /          acceso (login, registro, recuperar)
│   ├── admin/              /admin     panel, cursos, evaluaciones, alumnos y reportes
│   └── alumno/             /alumno    inicio, mis cursos, explorar, exámenes y herramientas
├── components/           Piezas reutilizables, agrupadas por zona
│   ├── acceso/             sesión, guardia por rol y formulario de acceso
│   ├── alumno/             portada, tarjeta y miniatura de curso/clase, pie y ondas
│   ├── soporte/            panel de tickets compartido por alumno y admin
│   └── herramientas/       piezas de las calculadoras (pasos, campos, barra y panel de resultado)
├── firebase/             Conexión y acceso a datos (perfiles, cursos, evaluaciones, notificaciones)
└── assets/               Imágenes importadas desde el código (marca y fondos)
```

Las calculadoras (`src/app/alumno/herramientas/`) se abren desde el menú Herramientas del encabezado, no tienen página de inicio propia, y separan las fórmulas (`ventilacion.ts`, `bombeo.ts`, `conversiones.ts`) de las pantallas. Las razones técnicas del proyecto están en [`docs/DECISIONES_TECNICAS.md`](docs/DECISIONES_TECNICAS.md).

El manual de uso de las calculadoras es [`public/manual-herramientas.pdf`](public/manual-herramientas.pdf); se abre desde el menú Herramientas y desde el botón "Manual de uso" de cada herramienta.

Fuera de `src/`, `functions/` contiene siete funciones para videos, miniaturas, eliminación administrativa, progreso y comienzo del examen. Los comandos de publicación están en la guía de entrega.

Cada `.tsx` importa su propio `.css` desde la misma carpeta. `globals.css` solo contiene el reinicio base.

## Reglas del proyecto

- Firestore: `firestore.rules`, con los datos en español (`usuarios` con sus `notificaciones`, `categorias`, `cursos`, `clases`, `examenes` con su `claves`, `intentos`, `contenidos`, `progreso`). Las reglas se publican con `firebase deploy --only firestore:rules`.
- Cloud Functions: `functions/`, con su propio `package.json`; se publican con `firebase deploy --only functions` (ver `docs/VIDEOS_SHAREPOINT.md`).
- Hosting: `firebase.json` publica `out/` con `cleanUrls`.
- Convenciones de código: `CLAUDE.md` y `AGENTS.md`.
