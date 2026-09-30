# Noova Learn Mining

Intranet de capacitación minera de Contratistas Generales Noova S.A.C. (Noova Consulting). Alumnos y administradores acceden con correo o Google; los cursos se gestionan desde el panel de administración.

Estado actual: funcionan el acceso, la gestión de cursos y categorías, los exámenes (creación, rendición y calificación), los reportes del administrador y las notificaciones dentro de la plataforma. Lo que falta (videos, pagos, bloqueo de clases, certificados, correos) está en [`docs/PENDIENTES.md`](docs/PENDIENTES.md).

## Tecnologías

- Next.js 16 (App Router) con TypeScript, exportado como sitio estático (`output: "export"`).
- Firebase: Authentication (correo y Google), Firestore y Hosting.
- Iconos con `lucide-react`. Estilos en CSS junto a cada página o componente.
- Cloudflare R2 (videos y documentos) y Culqi (pagos) están planificados; ver `docs/FIREBASE_R2_SETUP.md`.

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
│   └── alumno/             /alumno    inicio, mis cursos, explorar y exámenes
├── components/           Piezas reutilizables, agrupadas por zona
│   ├── acceso/             sesión, guardia por rol y formulario de acceso
│   ├── admin/              encabezado y listado compartido del panel
│   └── alumno/             encabezado y selectores de la vista de alumno
├── firebase/             Conexión y acceso a datos (perfiles, cursos, evaluaciones, notificaciones)
└── assets/               Imágenes importadas desde el código (marca y fondos)
```

Cada `.tsx` importa su propio `.css` desde la misma carpeta. `globals.css` solo contiene el reinicio base.

## Reglas del proyecto

- Firestore: `firestore.rules`, con los datos en español (`usuarios` con sus `notificaciones`, `categorias`, `cursos`, `clases`, `examenes` con su `claves`, `intentos`, `contenidos`, `progreso`). Las reglas se publican con `firebase deploy --only firestore:rules`.
- Hosting: `firebase.json` publica `out/` con `cleanUrls`.
- Convenciones de código: `CLAUDE.md` y `AGENTS.md`.
