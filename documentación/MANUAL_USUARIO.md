# KORA · Manual de usuario

**Aplicación documentada:** KORA · Trippy Animations 1.0.0  
**Dirigido a:** estudiantes y personas que utilizan KORA para organizar apuntes, código y material de estudio  
**Alcance:** aplicación independiente ubicada en `trippy-animations-nuevo`

> Esta versión es independiente de la distribución KORA compilada que también se entrega en la carpeta principal. No importa automáticamente sus datos de IndexedDB. Para instalación y copias de seguridad, consulta el [Manual de despliegue](./MANUAL_DESPLIEGUE.md); para conocer su arquitectura, consulta el [Manual técnico](./MANUAL_TECNICO.md).

## 1. ¿Qué es KORA?

KORA es un espacio personal para organizar cuadernos y apuntes, guardar fragmentos de código, documentar errores y soluciones, y estudiar con tarjetas y cuestionarios. Incluye búsqueda general, una papelera recuperable, gráficos de progreso y preferencias de accesibilidad.

La información se guarda localmente en archivos JSON cuando se utiliza la aplicación de escritorio. No hay sincronización automática entre equipos, gestión de roles ni servicio de cuentas en Internet.

## 2. Requisitos para utilizarla

- **Aplicación de escritorio:** Windows y la carpeta completa de KORA extraída. No muevas el ejecutable fuera de esa carpeta.
- **Uso en navegador:** requiere que la persona encargada ejecute el servidor local con Node.js 22.11 o posterior.
- No necesitas instalar una base de datos ni conectarte a Internet para las funciones locales.
- No se especifica un requisito mínimo de memoria, procesador o versión de navegador.

## 3. Primer acceso e inicio de sesión

### Primera ejecución de la aplicación de escritorio

1. Abre `KORA-Trippy-Animations.exe`.
2. En la pantalla **Primera ejecución**, define y confirma una contraseña para el usuario `sarharf`.
3. La contraseña debe tener entre 8 y 1024 caracteres. No existe una contraseña predeterminada.
4. Después de guardar la configuración, inicia sesión con el usuario `sarharf` y la contraseña que acabas de elegir.

La contraseña no se muestra en pantalla ni se guarda como texto legible. La aplicación no tiene recuperación de contraseña; conserva una copia de seguridad antes de realizar cambios en los archivos locales.

### Sesiones

La sesión dura hasta ocho horas y se invalida al cerrar sesión o reiniciar el servidor. Si la sesión caduca, vuelve a iniciar sesión. La aplicación admite una sola cuenta y no ofrece permisos por rol.

## 4. Interfaz y navegación

En una pantalla amplia, el menú lateral muestra:

| Sección | Para qué sirve |
|---|---|
| **Resumen** | Ver cuadernos, apuntes y sus estados de estudio. |
| **Buscador** | Encontrar apuntes, código, errores, tarjetas y cuestionarios. |
| **Cuadernos** | Crear espacios de organización y abrir sus apuntes. |
| **Código** | Guardar, editar y buscar fragmentos de programación. |
| **Errores y soluciones** | Registrar problemas y consultar cómo se resolvieron. |
| **Estudiar y repasar** | Repasar tarjetas, material relacionado y cuestionarios. |
| **Papelera** | Restaurar elementos eliminados o confirmarlos como definitivos. |
| **Progreso** | Consultar la distribución de estados de apuntes y apuntes por cuaderno. |
| **Accesibilidad** | Elegir tema, tamaño del texto y otros ajustes visuales. |
| **Mis datos** | Exportar o importar una copia JSON. |

En pantallas estrechas, pulsa **Abrir menú** (☰) para mostrar la navegación. El campo superior permite iniciar una búsqueda general desde cualquier sección.

## 5. Cuadernos y apuntes

### Crear y organizar un cuaderno

1. Abre **Cuadernos** y pulsa **Nuevo cuaderno** (o **Crear cuaderno** desde el resumen).
2. Escribe un nombre de hasta 80 caracteres.
3. Elige un color identificador: violeta, menta, coral, azul, ámbar, rosa, lila o turquesa.
4. Pulsa **Crear cuaderno**.
5. Abre el cuaderno desde su tarjeta. Puedes editar su nombre o color más adelante.

El buscador de esta sección filtra cuadernos por nombre.

### Crear o editar un apunte

1. Abre un cuaderno y pulsa **Nuevo apunte**.
2. Escribe un título y selecciona el cuaderno al que pertenece.
3. Añade el contenido, un estado y etiquetas separadas por comas.
4. Pulsa **Guardar apunte**.

Los estados disponibles son **Nuevo**, **En repaso** y **Dominado**. El contenido admite Markdown básico. Después de guardar, las tarjetas del resumen y del cuaderno muestran una vista previa con títulos, párrafos, texto en **negrita** o *cursiva*, listas, citas y fragmentos de código. La vista previa se limita para mantener las tarjetas legibles; no es una vista en vivo dentro del formulario de edición. El título del apunte usa un acento de color asociado al cuaderno. Las etiquetas se recortan a un máximo de 12.

Para editar un apunte, pulsa su título o el botón **Editar**. El contenido se guarda como texto; el formato se aplica al mostrar la vista previa.

En el detalle del cuaderno puedes buscar por título, contenido o etiquetas. Desde una tarjeta de apunte puedes editarlo, crear una tarjeta de estudio basada en él o enviarlo a la papelera.

## 6. Buscador general

1. Escribe una o más palabras en **Buscar en KORA** o abre **Buscador**.
2. Mientras escribes, KORA muestra sugerencias disponibles.
3. Pulsa un resultado para abrir el contenido o **Ver todos los resultados** para consultar la página de búsqueda.

La búsqueda abarca apuntes, fragmentos de código, errores, tarjetas y cuestionarios, incluidos sus textos, explicaciones, categorías, temas o etiquetas según el tipo. Los resultados se agrupan por tipo y las coincidencias se resaltan. La búsqueda general no consulta elementos que ya estén en la papelera.

Si no aparece un resultado, prueba con menos palabras o revisa que el elemento esté guardado.

## 7. Código

KORA almacena fragmentos como texto de estudio; **no los ejecuta**.

### Crear un fragmento

1. Abre **Código** y pulsa **Nuevo fragmento**.
2. Escribe un título y selecciona un lenguaje.
3. Si lo deseas, agrega descripción, categoría, tema, etiquetas, explicación y notas.
4. Escribe o pega el código y pulsa **Guardar fragmento**.

Los lenguajes disponibles son JavaScript, TypeScript, Python, HTML, CSS, SQL, Java, C#, PHP, Bash, JSON y Texto.

### Usar el editor

- El resaltado y la numeración se actualizan mientras escribes.
- **Tab** inserta dos espacios; **Mayús+Tab** quita dos espacios al inicio de la línea actual cuando están presentes.
- **Enter** conserva la indentación de la línea y añade dos espacios después de `{`, `[` o `(`.
- **Deshacer** y **Rehacer** controlan los cambios recientes.
- Escribe en **Buscar en código** y pulsa **Buscar** para seleccionar la siguiente coincidencia; la búsqueda vuelve al comienzo al llegar al final.
- **Copiar** usa el portapapeles. Si el navegador no lo permite, selecciona el texto y cópialo manualmente.
- **Exportar** descarga el fragmento como archivo de texto con la extensión correspondiente al lenguaje.
- Al guardar cambios en el código se conserva la versión previa. Para recuperarla, selecciónala en **Versiones anteriores** y guarda el borrador.

La biblioteca permite filtrar por título, lenguaje, descripción, código, explicación, categoría, tema y etiquetas. Desde un fragmento puedes abrir el editor, registrar un error relacionado o moverlo a la papelera.

## 8. Errores y soluciones

1. Abre **Errores y soluciones** y pulsa **Registrar error**; también puedes iniciar el registro desde un fragmento de código.
2. Añade un título y completa los campos que te ayuden a reproducir el problema: descripción, mensaje, lenguaje, código problemático, solución, código corregido, categoría, tema y etiquetas.
3. Mantén el estado **Pendiente** mientras el problema no esté resuelto; usa **Solucionado** cuando corresponda.
4. Guarda el registro. En la lista puedes buscar por texto y filtrar por todos, pendientes o solucionados.

Un error creado desde el editor copia el código y el lenguaje del fragmento de origen. El título y el estado son obligatorios; el resto de la información debe ser suficiente para entender el caso cuando vuelvas a consultarlo.

## 9. Estudiar y repasar

### Tarjetas

1. Abre **Estudiar y repasar** y pulsa **Nueva tarjeta**, o crea una tarjeta desde un apunte.
2. Completa el frente (pregunta o concepto), el reverso (respuesta o explicación) y, opcionalmente, el tema.
3. Guarda la tarjeta.
4. Pulsa la tarjeta para voltearla y consultar la respuesta.
5. Marca **Lo conozco** o **Necesito repasar** para registrar tu valoración.

Puedes editar o eliminar cada tarjeta y activar **Orden aleatorio**. Las valoraciones se guardan en la tarjeta como su estado de estudio.

### Cuestionarios

1. En la sección de cuestionarios, pulsa **Crear cuestionario**.
2. Escribe un título y, si quieres, un tema.
3. Añade una o más preguntas. Cada pregunta puede ser de **Selección múltiple** o **Verdadero o falso**.
4. Escribe el enunciado, las opciones, marca la respuesta correcta y añade una explicación si es útil.
5. Guarda el cuestionario, pulsa **Empezar / repetir**, responde y selecciona **Finalizar y guardar resultado**.

Las preguntas de verdadero/falso usan exactamente las opciones **Verdadero** y **Falso**. En selección múltiple se requieren al menos dos opciones y una respuesta correcta. Al finalizar se muestra la puntuación, se indica qué respuestas fueron correctas y se guarda el intento. Puedes repetir el cuestionario y consultar intentos recientes.

### Repaso por tema

Usa **Tema de repaso** para filtrar apuntes, tarjetas, cuestionarios y explicaciones de código relacionados. Los temas se obtienen de nombres de cuadernos, categorías, etiquetas y temas guardados; no existe un catálogo separado que haya que configurar.

## 10. Papelera

Los apuntes, fragmentos de código y errores enviados a la papelera pueden restaurarse. Al borrar un cuaderno, KORA conserva el cuaderno y sus apuntes juntos en una entrada.

1. Abre **Papelera** y revisa el tipo, nombre y fecha del elemento.
2. Pulsa **Restaurar** para recuperarlo.
3. Para eliminar un elemento definitivamente, pulsa **Eliminar definitivamente** y confirma.
4. **Vaciar papelera** abre una confirmación antes de eliminar todos los elementos.

Al restaurar un apunte, primero debe existir su cuaderno. Si falta, restaura el cuaderno correspondiente antes de recuperar el apunte.

## 11. Progreso y accesibilidad

**Progreso** muestra un gráfico de dona con los apuntes nuevos, en repaso y dominados, y un gráfico de apuntes por cuaderno. Los gráficos se basan en los apuntes guardados; no miden horas de estudio ni actividad fuera de KORA.

En **Accesibilidad** puedes elegir entre 13 temas (Original, Oscuro, Claro, Lavanda, Oceánico, Naturaleza, Atardecer, Pastel, Monocromático, Aurora, Nebulosa, Sol ácido y Calmo), activar modo calmo o alto contraste, aplicar filtros de color y ajustar lectura:

- seis niveles de tamaño del texto, con **A−**, **A+** y **Restablecer**;
- subrayado de enlaces, espacio entre textos y tipografía legible;
- resaltado del foco del teclado.

Las preferencias se guardan en el navegador para el usuario activo y se mantienen al recargar la aplicación. Los filtros de color son aproximados y no sustituyen una evaluación clínica.

## 12. Copias de seguridad

1. Abre **Mis datos** y pulsa **Exportar copia** para descargar `kora-copia-AAAA-MM-DD.json`.
2. Guarda el archivo en una ubicación segura distinta de la carpeta de instalación.
3. Para importar, selecciona **Importar copia** y elige una copia KORA válida.
4. Lee la confirmación: importar **reemplaza** los cuadernos, apuntes y demás datos actuales de esa cuenta.

La aplicación de escritorio guarda sus datos localmente; no compartas la copia si contiene información privada. El importador admite archivos de hasta 5 MB.

## 13. Mensajes y soluciones frecuentes

| Mensaje o problema | Qué hacer |
|---|---|
| Usuario o contraseña incorrectos | Comprueba que el usuario sea `sarharf` y vuelve a escribir la contraseña configurada. No hay contraseña predeterminada. |
| Demasiados intentos | Espera unos minutos antes de volver a intentarlo. |
| No se pudo conectar con el servidor | En la versión de escritorio, cierra y vuelve a abrir KORA. En navegador, pide al operador que revise el servidor y la URL indicada en la consola. |
| No se pudieron guardar los cambios | Revisa que el almacenamiento tenga espacio y que la carpeta de datos permita escritura. No cierres la aplicación hasta confirmar si los datos se guardaron. |
| La copia no se importa | Utiliza un JSON exportado por esta versión, verifica que no supere 5 MB y confirma que aceptas reemplazar los datos actuales. |
| No se ve el editor completo en un teléfono | Desplázate dentro del formulario; la barra lateral se abre con ☰ y el editor permite desplazamiento vertical y horizontal. |
| No se puede copiar | Selecciona el código en el editor y usa la combinación de copiar del sistema. |

## 14. Funciones no incluidas en esta versión

No hay ejecución de código, Glosario independiente, colaboración entre cuentas, roles, recuperación de contraseña, sincronización entre dispositivos ni migración automática desde la IndexedDB de la distribución KORA compilada anterior.
