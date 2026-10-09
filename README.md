# Noova Learn Mining

Intranet de capacitación minera de Contratistas Generales Noova S.A.C. (Noova Consulting). Alumnos y administradores acceden con correo o Google; los cursos se gestionan desde el panel de administración.

Estado actual: funcionan el acceso, la gestión de cursos y categorías, los exámenes (creación, rendición y calificación), los reportes del administrador, las notificaciones dentro de la plataforma y las calculadoras de ventilación. La selección de videos de Microsoft está conectada en local; falta habilitar permisos y publicar la integración. La guía para el propietario está en [`docs/ENTREGA_PROPIETARIO.md`](docs/ENTREGA_PROPIETARIO.md). Lo que falta (publicación, pagos, bloqueo de clases, certificados, correos) está en [`docs/PENDIENTES.md`](docs/PENDIENTES.md).

## Tecnologías

- Next.js 16 (App Router) con TypeScript, exportado como sitio estático (`output: "export"`).
- Firebase: Authentication (correo y Google), Firestore, Storage, Functions y Hosting.
- Iconos con `lucide-react`. Estilos en CSS junto a cada página o componente.
- Videos de las clases: SharePoint (Microsoft Graph) detrás de una Cloud Function de Firebase; ver `docs/VIDEOS_SHAREPOINT.md`. Las portadas de cursos se guardan en Firebase Storage y sus referencias en Firestore. Culqi (pagos) está planificado; la guía de Firebase está en `docs/FIREBASE_SETUP.md`.

## Puesta en marcha

Requiere Node.js 20 o superior.

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

Fuera de `src/`, `functions/` contiene la Cloud Function que entrega los videos de las clases (necesita Node 22 y el plan Blaze de Firebase).

Cada `.tsx` importa su propio `.css` desde la misma carpeta. `globals.css` solo contiene el reinicio base.

## Reglas del proyecto

- Firestore: `firestore.rules`, con los datos en español (`usuarios` con sus `notificaciones`, `categorias`, `cursos`, `clases`, `examenes` con su `claves`, `intentos`, `contenidos`, `progreso`). Las reglas se publican con `firebase deploy --only firestore:rules`.
- Cloud Functions: `functions/`, con su propio `package.json`; se publican con `firebase deploy --only functions` (ver `docs/VIDEOS_SHAREPOINT.md`).
- Hosting: `firebase.json` publica `out/` con `cleanUrls`.
- Convenciones de código: `CLAUDE.md` y `AGENTS.md`.
