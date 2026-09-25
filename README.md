# 🏢 Noova Intranet

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

Plataforma web interna desarrollada para **NOOVA CONSULTING**, orientada a la gestión, centralización de procesos e información estratégica corporativa.

---

## 🛠️ Tecnologías Utilizadas

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + PostCSS
* **Linter & Formateo:** ESLint

---

## 🚀 Inicio Rápido

Sigue estos pasos para ejecutar el proyecto en tu entorno de desarrollo local:

### 1. Requisitos previos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18.x o superior) y `npm`.

### 2. Clonar el repositorio
```bash
git clone [https://github.com/NOOVA-CONSULTING/Noova-Intranet.git](https://github.com/NOOVA-CONSULTING/Noova-Intranet.git)
cd Noova-Intranet
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto a partir del archivo de ejemplo (si aplica) o configura las claves requeridas:

```env
# Ejemplo de variables
NEXT_PUBLIC_API_URL=[https://api.tu-dominio.com](https://api.tu-dominio.com)
```

### 5. Iniciar el servidor de desarrollo
```bash
    npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

---

## 📁 Estructura del Proyecto

```text
noova-learn-mining/
├── app/                  # Rutas, componentes e interfaces principales (App Router)
│   ├── favicon.ico
│   ├── globals.css       # Estilos globales y utilidades de Tailwind
│   ├── layout.tsx        # Layout principal de la aplicación
│   └── page.tsx          # Página de inicio
├── public/               # Archivos estáticos (imágenes, SVGs, fuentes)
├── .gitignore            # Archivos excluidos del control de versiones
├── eslint.config.mjs     # Configuración de reglas de ESLint
├── next.config.ts        # Configuración de Next.js
├── package.json          # Dependencias y scripts del proyecto
├── postcss.config.mjs   # Configuración de PostCSS
└── tsconfig.json         # Configuración del compilador de TypeScript
```

---

## 📜 Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia la aplicación en modo de desarrollo con Hot Reloading. |
| `npm run build` | Compila la aplicación optimizada para producción. |
| `npm run start` | Inicia el servidor de producción generado tras la compilación. |
| `npm run lint` | Ejecuta ESLint para analizar y corregir errores de código. |

---

🏢 **Desarrollado por el equipo de IT de NOOVA CONSULTING**