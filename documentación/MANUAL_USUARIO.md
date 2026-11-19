# KORA — Manual de usuario

**Aplicación:** KORA 0.5.0  
**Público:** estudiantes y personas que utilizan el cuaderno de estudio  
**Tipo de aplicación:** aplicación de escritorio para Windows con datos locales

Este manual explica las funciones que se encuentran en la distribución de KORA incluida con el proyecto. Para instalar o actualizar la aplicación, consulta el [Manual de despliegue](./MANUAL_DESPLIEGUE.md). Los detalles internos están en el [Manual técnico](./MANUAL_TECNICO.md).

## 1. Introducción y objetivo

KORA reúne en un solo cuaderno herramientas para organizar apuntes, guardar fragmentos de código, crear un glosario y registrar errores y soluciones. También permite estudiar mediante tarjetas y cuestionarios, y consultar indicadores de actividad y progreso.

Su objetivo es ayudar a organizar y repasar material de estudio. Los datos se guardan en el equipo donde se utiliza la aplicación; no se encontró una función de sincronización con una cuenta o un servicio remoto.

## 2. Alcance y requisitos

La distribución analizada es una carpeta para Windows que contiene `kora.exe` y los recursos de Electron. Se debe conservar y extraer la carpeta completa antes de abrirla. No se encontró un instalador, un acceso web publicado ni el archivo `KORA.html` que menciona `LEEME.txt`; por tanto, esas opciones no se describen como disponibles en esta copia.

La aplicación no requiere una cuenta ni inicio de sesión. El menú «Mi cuenta» muestra el perfil local «Estudiante» y opciones de apariencia; no es una gestión de cuentas o permisos.

## 3. Acceso e interfaz

1. Extrae toda la carpeta de KORA a una ubicación local.
2. Abre `kora.exe`.
3. Si Windows muestra una advertencia de SmartScreen, verifica primero que confías en el origen del paquete. La distribución indica que el ejecutable no está firmado digitalmente; no ejecutes archivos de origen desconocido.

La interfaz presenta un menú de navegación para acceder a los módulos. El encabezado incluye el menú «Mi cuenta». Las pantallas muestran botones de acción, formularios, filtros o listas según el módulo. Los mensajes de confirmación y error aparecen en la propia aplicación.

En «Mi cuenta» se puede elegir un tema y ajustar el modo calmo o la intensidad de las animaciones. La opción de instalar la aplicación como PWA depende de que KORA se ejecute desde un navegador y un origen compatible; no corresponde al uso del ejecutable de escritorio descrito aquí.

## 4. Módulos y procedimientos

### 4.1 Cuadernos y apuntes

Un cuaderno agrupa apuntes de una materia o proyecto. Para empezar:

1. Abre la sección de cuadernos y selecciona «Crear cuaderno».
2. Escribe el nombre y configura las opciones de color e icono que ofrece el formulario.
3. Guarda el cuaderno y ábrelo.
4. Crea un apunte, completa su título y contenido, y guarda los cambios.

El contenido del apunte admite Markdown. El editor ampliado incorpora botones de formato para estilos de texto, títulos, listas, citas, alineación, sangría, enlaces, tablas e imágenes. También permite deshacer y rehacer cambios, pegar contenido con formato y previsualizar el resultado. Las imágenes locales admitidas por la barra del editor tienen un máximo de **512 KB por imagen**. Las imágenes o enlaces de Internet requieren que exista conexión para cargarlos.

En «Todos los apuntes» se puede cambiar entre cuadrícula y lista, ordenar por fecha reciente o título, y filtrar por estado de estudio y categoría. La vista y los filtros se aplican a los apuntes visibles; el filtro de categorías se construye a partir de las categorías existentes.

Las categorías sirven para clasificar apuntes. Los estados de estudio disponibles en la lista son «Nuevo», «En repaso» y «Dominado». Un cuaderno se puede archivar; los cuadernos archivados se muestran en su apartado correspondiente.

### 4.2 Búsqueda

Abre la búsqueda desde el menú o pulsa `/` cuando no estés escribiendo dentro de un campo. Escribe el término que quieres encontrar y utiliza los resultados para abrir el elemento correspondiente. Si `/` no abre la búsqueda, comprueba que el foco no esté en un cuadro de texto.

### 4.3 Código

En el módulo «Código»:

1. Selecciona «Nuevo fragmento».
2. Indica un título y el lenguaje del fragmento.
3. Escribe o pega el código; añade explicación y ejemplo si son útiles.
4. Guarda el fragmento.

La interfaz permite copiar código al portapapeles. Si el portapapeles no está disponible, se muestra un aviso y se puede seleccionar el texto para copiarlo manualmente.

### 4.4 Glosario

1. Abre «Glosario» y elige «Nuevo término».
2. Escribe el término y su definición; puedes añadir un ejemplo.
3. Guarda el registro y utiliza la lista o el filtro de términos para localizarlo.

El código comprueba duplicados de término sin distinguir mayúsculas ni acentos y normaliza los espacios al inicio y al final. Si aparece un aviso de duplicado, revisa si el término ya existe antes de crear otro.

### 4.5 Errores y soluciones

Este módulo permite conservar el contexto de un error y cómo se resolvió. Selecciona «Registrar error» y completa el título y los campos que muestre el formulario, como descripción, causa y solución. Puedes vincular un apunte cuando corresponda. Después de guardar, utiliza la acción de la pantalla para marcarlo como resuelto cuando ya lo hayas solucionado.

La lista distingue los errores pendientes de los resueltos. Mantén una descripción concreta para poder reconocer el problema cuando vuelvas a consultarlo.

### 4.6 Tarjetas y repasos

1. Abre «Tarjetas» y selecciona «Nueva tarjeta».
2. Escribe el enunciado o término y su respuesta.
3. Guarda la tarjeta y selecciona «Repasar ahora» para estudiar las que estén pendientes.
4. Después de mostrar la respuesta, indica si no la sabías o si la sabías. En el repaso, las teclas `1` y `2` corresponden a esas dos valoraciones.

KORA organiza los repasos en cajas de repetición espaciada. Una valoración negativa devuelve la tarjeta a la primera caja; una positiva la avanza hasta un máximo de cinco. El intervalo programado aumenta según la caja. La pantalla de tarjetas muestra lo pendiente y el progreso de los repasos.

### 4.7 Cuestionarios

1. En «Cuestionarios», selecciona «Nuevo cuestionario».
2. Añade preguntas y elige el tipo disponible: opción múltiple, verdadero o falso o respuesta corta.
3. Completa el enunciado y la respuesta correcta. En las preguntas de opción múltiple, revisa las opciones y marca la correcta.
4. Guarda el cuestionario y ábrelo para responderlo.
5. Al terminar, revisa el resultado y el historial de intentos.

El formulario valida que haya enunciados y respuestas válidas; para opción múltiple requiere al menos dos opciones. Si aparecen avisos de opciones vacías o respuestas incompletas, complétalas o elimínalas antes de guardar.

### 4.8 Progreso

El módulo de progreso presenta indicadores y gráficos calculados con la actividad registrada localmente. Entre las vistas que aparecen en la aplicación están las sesiones y minutos de estudio, los días seguidos, el uso por módulo, los estados y categorías de apuntes y los resultados de cuestionarios. Las estadísticas requieren actividad registrada; una pantalla vacía al comenzar no significa que se hayan perdido datos.

### 4.9 Papelera y eliminación

La aplicación incluye una «Papelera» y acciones para enviar elementos allí o eliminarlos permanentemente. Revisa el elemento antes de confirmar una acción irreversible. El apartado «Mis datos» también incluye la acción «Borrar todos mis datos»; úsala solo después de exportar una copia si deseas conservar tu información.

## 5. Copias de seguridad y exportación

Los datos están en este equipo y no se sincronizan automáticamente. KORA muestra un recordatorio de copia cuando hay al menos cinco elementos de contenido y han transcurrido siete días desde la última copia; también permite posponer el aviso.

Para guardar un respaldo:

1. Abre «Ajustes» y luego «Mis datos».
2. Pulsa «Exportar copia (JSON)».
3. Guarda el archivo en una ubicación segura, preferiblemente distinta de la carpeta de KORA.

Para importar:

1. Abre «Ajustes» > «Mis datos» y pulsa «Importar copia (JSON)».
2. Selecciona un archivo JSON exportado por KORA.
3. Revisa el resumen de cambios y confirma con «Importar».

La importación fusiona los datos: no borra los registros actuales y solo reemplaza un registro cuando el de la copia es más reciente. Un archivo JSON inválido, demasiado grande o de una versión futura puede rechazarse. «Exportar Markdown» genera una versión legible del contenido compatible con esa exportación; no sustituye la copia JSON completa.

## 6. Atajos de teclado

| Tecla | Acción |
|---|---|
| `/` | Abrir búsqueda, salvo que el foco esté en un campo editable o haya modificadores activos. |
| `n` | Crear un apunte en el cuaderno disponible. Si no hay ninguno, KORA solicita crear uno primero. |
| `?` | Abrir la ayuda de la aplicación. |
| `1` / `2` | Indicar la valoración de una tarjeta durante un repaso: no la sabía / la sabía. |

## 7. Validaciones, mensajes y errores frecuentes

| Situación | Qué hacer |
|---|---|
| «Primero crea un cuaderno para guardar apuntes» | Crea y abre un cuaderno antes de usar `n` o crear un apunte. |
| No se pudo guardar en este equipo | No cierres la aplicación de inmediato. Comprueba el espacio disponible, cierra otras ventanas de KORA y vuelve a intentar. Si persiste, exporta una copia cuando sea posible; los últimos cambios podrían no haberse guardado. |
| La copia no parece válida, es demasiado grande o no se reconoce | Selecciona un JSON exportado por KORA y comprueba que el archivo no esté dañado. |
| La imagen supera el límite | Reduce el tamaño a 512 KB o menos y vuelve a insertarla. |
| No se puede copiar código | Selecciona el código manualmente y usa `Ctrl+C`. |
| La aplicación no abre o faltan recursos | Extrae la distribución completa; no ejecutes `kora.exe` desde dentro de un ZIP ni copies el ejecutable por separado. |
| SmartScreen muestra una advertencia | Verifica que el paquete provenga de una fuente de confianza. La copia indica que no tiene firma digital. |

## 8. Recomendaciones

- Exporta respaldos JSON con regularidad y antes de actualizar la aplicación.
- Conserva las copias fuera de la carpeta del programa; evita compartirlas si contienen información personal.
- No elimines manualmente los datos de la aplicación desde el perfil de Windows.
- Usa nombres y categorías consistentes para facilitar la búsqueda.
- Comprueba el resultado en «Vista previa» antes de guardar contenido Markdown complejo.
- Mantén la carpeta distribuida completa y no sustituyas archivos individuales del paquete.
