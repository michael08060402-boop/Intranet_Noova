# Decisiones técnicas

El código no lleva comentarios; las razones que no se ven leyéndolo están aquí.

## Firestore y reglas

- **Las reglas no filtran consultas.** El alumno debe pedir solo lo publicado, lo activo o lo suyo; si la consulta puede devolver algo que no puede leer, Firestore rechaza toda la consulta. Por eso `cursos.ts` y `evaluaciones.ts` filtran siempre por `publicado`/`activa`.
- **Escrituras con el documento completo.** Las reglas validan nombre, descripción y estado juntos, así que al editar se reenvían siempre.
- **Sin borrados en cascada.** Firestore no borra subcolecciones: un curso solo se elimina sin clases, una clase sin contenidos, una categoría sin cursos y un examen sin entregas (su clave sí se borra con él). Evita dejar datos huérfanos.
- **Claves de examen aparte.** El índice de la opción correcta vive en `examenes/{id}/claves`, que el alumno no puede leer. Examen y clave se guardan en el mismo lote, así nunca hay un examen publicado sin corrección.
- **Notas de 0 a 20** y nota mínima de 16 por defecto (editable por examen). Un solo intento por alumno; el administrador lo reinicia desde Entregas.
- **Calificación por lotes de 200 entregas** (2 escrituras cada una) por el límite de 500 escrituras de Firestore.
- **Inscripciones dentro del alumno** (`usuarios/{uid}/inscripciones`). Se cuentan con una consulta de grupo, que usa el índice de `firestore.indexes.json`. El documento de progreso se llama `cursoId_claseId`, como exigen las reglas.
- **Perfil.** Las reglas solo dejan al alumno cambiar su `nombre`; plan y estado los gestiona el administrador. Nombre y apellidos se guardan juntos: la primera palabra se muestra como nombre.
- **`serverTimestamp()` llega como `null`** mientras la escritura local no se confirma; los listeners lo toleran.

## Videos

- Cada clase tiene como máximo un video, en `contenidos/video`, con la ruta dentro de la biblioteca de SharePoint. Los alumnos no leen `contenidos`; piden el enlace a la función `obtenerVideo`, que valida sesión, correo verificado, inscripción y plan, y devuelve un enlace temporal. Detalle y configuración en `VIDEOS_SHAREPOINT.md`.
- Al editar una clase, el video se carga aparte y el formulario no deja guardar hasta tenerlo, para no borrarlo sin querer.
- Al cambiar de clase se ignora la respuesta del video anterior si llega tarde.

## Pantallas

- **Accesos con parámetros** (`?id=`, `?nuevo`, `?categorias`, `?curso=`): el sitio es estático (`output: "export"`), así que no hay rutas dinámicas. Cada página que lee parámetros va dentro de `Suspense`.
- **Saludo inicial.** Firebase solo actualiza `lastSignInTime` al iniciar sesión, así que el saludo de primera vez se mantiene durante toda esa sesión.
- **Actividad del panel admin.** Se arma con cursos y alumnos existentes; "limpiar" solo oculta lo anterior a esa fecha, en ese navegador.
- **Reportes CSV** con BOM para que Excel respete las tildes; las celdas que empiezan con `=`, `+`, `-` o `@` se neutralizan para que no se ejecuten como fórmula.
- **Examen en curso.** Cuenta regresiva, guardado automático y entrega sola al llegar a cero. Con el tiempo agotado no se reintenta: las reglas ya no aceptan la entrega y el instructor revisa lo guardado.
- **Premium** se paga por periodo (no suscripción automática) para aceptar tarjeta y Yape. La pantalla de pago es simulada: no cobra y los datos solo viven en esa pantalla (`autoComplete="off"` evita ofrecer tarjetas guardadas).
- **Ondas del encabezado y pie.** Cada instancia necesita ids de degradado propios; se limpian los caracteres de `useId` que rompen `url(#id)`.
- **Íconos de marca.** `lucide-react` no trae logos; el de WhatsApp es el oficial, en SVG propio.

## Herramientas (calculadoras)

- Las fórmulas viven en archivos sin interfaz (`ventilacion.ts`, `bombeo.ts`, `conversiones.ts`) para poder probarlas aparte; las pantallas solo leen datos y muestran resultados. Las piezas visuales comunes están en `src/components/herramientas/`.
- **Requerimiento de aire:** Anexo 38 del D.S. N° 024-2016-EM, contrastado con `REQ. CAUDAL - RESUMEN.xlsx`. Sin equipos petroleros el caudal final es el mayor entre el total y el de explosivos. Fuera de la escala del anexo (temperatura de 30 °C o más) no se calcula.
- **Factor de conversión cfm:** 35,315 por m³/min, como en el Excel de Luis.
- **Presión del ventilador:** ecuación de Atkinson (R = k·L·P/A³; h = R·Q²). **Bombeo:** Hazen-Williams con C = 130 y eficiencia 70 % por defecto. Estos valores y fórmulas son de libro, no los entregó la empresa: validar con quien dicta Ventsim/Pumpsim.
- Los campos vacíos cuentan como 0; cualquier valor negativo o no numérico muestra un aviso y bloquea el resultado.

## Accesibilidad y diseño

- Campos y botones principales de 44 px o más, contorno de foco de 2 px, `prefers-reduced-motion` respetado y contraste mínimo 4,5:1 (revisado con axe en todas las rutas, móvil y escritorio).
- Tablas anchas del panel admin con scroll horizontal enfocable por teclado.
- Los estilos van junto a cada página o componente; `globals.css` solo tiene el reinicio base.
