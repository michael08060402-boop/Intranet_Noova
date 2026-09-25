# Código limpio

Cambiar lo necesario, limpiar todo lo relacionado y dejar intacto lo demás.

## Código y alcance

- Escribe código sencillo, lógico, legible y fácil de explicar, como un estudiante competente de Ingeniería de Sistemas. Prefiere soluciones directas; evita sofisticación, abstracciones y estructuras innecesarias.
- Usa nombres claros, naturales y breves; español en la lógica propia cuando sea coherente. Conserva los nombres estándar de frameworks, APIs, librerías y protocolos.
- No refactorices partes ajenas, reescribas archivos completos si basta una sección ni cambies arquitectura o tecnologías sin necesidad. Preserva comportamiento correcto, seguridad y compatibilidad necesaria.
- Conserva o añade comentarios solo para decisiones técnicas, limitaciones, workarounds o comportamientos no evidentes. Elimina los relacionados que sean obvios, decorativos, separadores, banners, encabezados, explicaciones paso a paso o comentarios de proceso de IA. No dejes código antiguo comentado: recupéralo con Git.

## Limpieza relacionada obligatoria

- En cada cambio, elimina lo que quede obsoleto o innecesario, aunque la funcionalidad principal continúe. No guardes código muerto para un posible uso futuro.
- Busca referencias antes de eliminar; conserva código compartido con consumidores activos. Una eliminación termina solo cuando desaparecen sus referencias obsoletas.
- Revisa según corresponda: imports/exports; variables, constantes, estados/setters; funciones, handlers, parámetros, props y hooks; componentes, páginas, rutas, navegación y menús; permisos/roles; servicios, endpoints, llamadas API y consultas; tipos, interfaces, schemas y modelos; archivos, assets, tests, configuraciones y dependencias.

## CSS por página o vista principal

- Cada página, vista o módulo visual principal debe tener su propio CSS asociado, por ejemplo `Inicio.tsx` → `Inicio.css` o `Dashboard.tsx` → `Dashboard.css`.
- Coloca cada regla en el CSS de la página o componente que realmente la utiliza. No mezcles estilos de páginas distintas ni concentres varias páginas en `global.css`, `styles.css`, `app.css` o equivalentes centralizados. No uses CSS global como depósito general de estilos.
- Las secciones y componentes exclusivos de una página pueden usar el CSS de esa página; no exijas un CSS por componente pequeño. Un componente reutilizable, independiente o con suficientes estilos propios puede tener su propio CSS.
- Al mover una sección entre páginas, mueve también sus estilos correspondientes. Al eliminar una página, sección o componente, elimina sus estilos sin uso y el archivo CSS si queda innecesario.
- Al modificar JSX/HTML, revisa clases y reglas relacionadas: elimina clases huérfanas, reglas sin uso y estilos reemplazados; evita clases o reglas duplicadas, estilos de otra página, especificidad innecesaria y `!important` salvo necesidad real. Por cada clase eliminada, comprueba siempre si debe desaparecer su regla CSS. CSS muerto también es código muerto.

## Revisión final obligatoria

Antes de finalizar cualquier cambio:

1. Revisa el diff y busca referencias a elementos eliminados o renombrados.
2. Elimina código y CSS muertos relacionados; revisa imports/exports, variables, estados, props, funciones, handlers, archivos huérfanos, rutas, navegación y dependencias afectadas que puedan quedar sin uso.
3. Ejecuta los checks relevantes existentes (lint, typecheck, tests) y corrige los errores introducidos. Si no puedes ejecutarlos, indícalo; no crees herramientas, tests, configuraciones ni infraestructura únicamente para esta revisión.
4. Comprueba que solo cambiaste lo necesario y no quedan restos relacionados, comentarios prohibidos ni estilos de aplicación en CSS globales; respeta el alcance de la tarea.

@AGENTS.md
