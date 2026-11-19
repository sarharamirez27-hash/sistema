# KORA — Manual técnico

**Versión del producto documentada:** 0.5.0  
**Artefacto:** distribución compilada de Electron para Windows  
**Destinatarios:** desarrollo, soporte y mantenimiento

## 1. Alcance de este análisis

La carpeta recibida es un paquete ejecutable, no el repositorio de desarrollo. Se inspeccionaron `resources\app\main.cjs`, `package.json`, los recursos web compilados y `LEEME.txt`. No se encontraron fuentes originales, mapas de origen, configuración de construcción, pruebas, dependencias declaradas ni esquema de base de datos externo.

En consecuencia, este documento describe lo que se puede verificar en el paquete. No atribuye versiones exactas a las bibliotecas web incluidas en el bundle si el manifiesto no las declara, ni presenta un procedimiento de compilación que no está disponible.

## 2. Descripción y arquitectura

KORA es una aplicación local de estudio basada en Electron. El proceso principal crea una ventana, registra el protocolo interno `kora://app/` y sirve archivos estáticos desde `resources\app\web`. La interfaz compilada mantiene el estado de la aplicación en IndexedDB; las preferencias visuales se guardan separadamente en `localStorage`. No se encontró un servidor de aplicación ni una API remota.

```mermaid
flowchart LR
    U[Usuario] --> W[Ventana Electron]
    M[main.cjs] -->|crea y carga| W
    W -->|kora://app/| P[Protocolo interno]
    P -->|archivos estáticos| H[index.html y bundle web]
    H --> R[Interfaz React]
    R -->|CRUD local| D[(IndexedDB: kora)]
    R -->|preferencias| L[(localStorage)]
    R <-->|aviso de cambios| B[BroadcastChannel]
    R -->|exportar/importar| J[Archivos JSON / Markdown]
    W -->|enlaces HTTP(S)| X[Navegador externo]
```

El dibujo representa los componentes observados en el paquete. No implica sincronización remota ni almacenamiento compartido entre equipos.

## 3. Tecnologías y herramientas comprobables

| Tecnología o recurso | Evidencia y función |
|---|---|
| JavaScript / CommonJS | `main.cjs` usa `require`, `node:path` y `node:url`. |
| Electron | `BrowserWindow`, `app`, `protocol`, `net`, `shell` y el ejecutable de escritorio. El archivo `version` del paquete contiene `45.3.1`; `package.json` no expone una matriz de compatibilidad. |
| React | El bundle web monta la interfaz en `#root` y contiene renderizado React. |
| IndexedDB | Persistencia de los registros de dominio bajo el nombre de base `kora`. |
| `localStorage` | Persistencia del estado de preferencias bajo la clave `kora:prefs`; la preferencia de vista de apuntes usa `kora-premium-notes-view`. |
| `BroadcastChannel` | Canal `kora-sync` para avisar a otras ventanas de cambios y recargar desde el almacenamiento. |
| Markdown | Los apuntes y varios campos de contenido admiten Markdown; la exportación legible genera un archivo `.md`. |
| PWA | Hay manifiesto y service worker en `web`. El código del bundle registra el worker solo en HTTPS o localhost; el protocolo Electron utilizado es `kora://`. |
| CSS y fuentes | Hojas CSS compiladas y fuentes Atkinson Hyperlegible y Fraunces dentro de `web\assets`. |

No se puede determinar de manera fiable, a partir de los metadatos entregados, el gestor de paquetes, las versiones de React u otras dependencias del bundle, ni la herramienta que generó los archivos compilados. Las clases CSS parecen compiladas, pero no se incluyen configuración ni dependencias para afirmar una herramienta de CSS específica.

## 4. Estructura de la distribución

```text
raíz/
├── kora.exe
├── LEEME.txt
├── version
├── *.dll, *.pak y archivos de runtime
├── locales/
└── resources/
    ├── app.asar.original
    └── app/
        ├── main.cjs
        ├── package.json
        ├── icon.png
        └── web/
            ├── index.html
            ├── manifest.webmanifest
            ├── sw.js
            ├── assets/
            └── icons/
```

`resources\app.asar.original` se describe en `LEEME.txt` como una copia del paquete original. El código de entrada activo observado está en `resources\app\main.cjs`. La interfaz de `web\assets` está compilada y minificada, por lo que las rutas internas y nombres de componentes fuente no son recuperables de forma fiable.

## 5. Proceso principal y límites de navegación

`main.cjs`:

1. Importa APIs de Electron y utilidades de ruta/URL de Node.
2. Registra `kora` como esquema estándar, seguro y compatible con Fetch.
3. Define `webRoot` como `resources\app\web`.
4. Crea una ventana inicial de 1280 × 820, con tamaño mínimo de 360 × 600.
5. Desactiva el menú de aplicación y carga `kora://app/index.html`.
6. Atiende el protocolo personalizado resolviendo el archivo solicitado bajo `webRoot`, con una comprobación para rechazar rutas fuera de la raíz.
7. Impide que la ventana navegue fuera de `kora://app/`. Los enlaces externos HTTP/HTTPS se entregan al navegador externo.
8. Cierra la aplicación al cerrar todas las ventanas, salvo en macOS, y crea una nueva al reactivar la aplicación en esa plataforma.

Las preferencias de la ventana configuran `contextIsolation: true`, `nodeIntegration: false` y `sandbox: true`. El paquete no implementa una interfaz de IPC propia en el archivo principal revisado.

## 6. Módulos funcionales

La interfaz contiene los siguientes dominios:

- **Cuadernos y apuntes:** agrupación de apuntes, categorías, estados de estudio, archivo de cuadernos y vistas de lista/cuadrícula.
- **Código:** fragmentos con título, lenguaje, código, explicación y ejemplo; la interfaz incluye copia al portapapeles.
- **Glosario:** términos, definiciones y ejemplos; la creación evita términos duplicados tras normalización.
- **Errores y soluciones:** registro de errores, estado resuelto/pendiente y referencias opcionales a apuntes.
- **Tarjetas:** pares de pregunta/respuesta, cola de repasos y progreso de repetición espaciada.
- **Cuestionarios:** preguntas de opción múltiple, verdadero/falso y respuesta corta; registra intentos y resultados.
- **Progreso:** indicadores sobre estudio, actividad, módulos y resultados.
- **Papelera:** acciones de eliminación y elementos eliminados.
- **Mis datos:** exportación JSON, importación de copias, exportación Markdown y eliminación total de datos.
- **Preferencias:** tema, modo calmo, intensidad de animaciones, fondo y estado visual del menú.

No hay código de roles ni autorización por usuario identificable. «Mi cuenta» muestra el perfil local «Estudiante» y preferencias; no es autenticación.

## 7. Persistencia y modelo de datos

### 7.1 Implementación

El bundle abre IndexedDB con nombre `kora` y versión de esquema **4**. Cada almacén se crea con `keyPath: "id"`. No se usa SQL y no hay migraciones SQL, servidor de base de datos ni usuario de conexión. Las relaciones se expresan mediante identificadores dentro de los registros y se resuelven desde la aplicación.

Al iniciar, la aplicación carga los almacenes en el estado de interfaz. Las escrituras, eliminaciones y limpieza total se ejecutan contra IndexedDB. Si IndexedDB no está disponible o no puede abrirse, se crea un adaptador en memoria. El estado incluye una señal de que no se pudo guardar; por lo tanto, el fallback no debe tratarse como almacenamiento persistente.

### 7.2 Almacenes

| Almacén | Propósito observado |
|---|---|
| `notebooks` | Cuadernos, orden, icono/color, archivo y marcas temporales. |
| `notes` | Apuntes, cuaderno asociado, cuerpo Markdown, categorías, estado de estudio y fechas. |
| `categories` | Categorías utilizadas para clasificar apuntes. |
| `snippets` | Fragmentos de código, lenguaje, explicación y ejemplo. |
| `glossary` | Términos, definiciones y ejemplos. |
| `errors` | Registros de errores y su resolución. |
| `flashcards` | Tarjetas de estudio. |
| `reviews` | Estado e historial de repasos de tarjetas. |
| `quizzes` | Cuestionarios. |
| `questions` | Preguntas asociadas a un cuestionario. |
| `attempts` | Intentos y resultados de cuestionarios. |
| `sessions` | Sesiones de actividad con módulo y marcas temporales. |
| `events` | Eventos de actividad utilizados por el progreso. |

### 7.3 Diccionario de datos lógico

Los almacenes son colecciones de objetos JavaScript, no tablas con tipos SQL ni restricciones relacionales. La tabla resume campos usados o accesibles en el bundle; no pretende ser una especificación exhaustiva de cada objeto.

| Entidad | Campos observables | Relaciones y reglas |
|---|---|---|
| Cuaderno (`notebooks`) | `id`, `name`, `color`, `icon`, `archived`, `position`, `createdAt`, `updatedAt`, `deletedAt` | `name` se recorta y limita a 80 caracteres en creación/edición. |
| Apunte (`notes`) | `id`, `notebookId`, `title`, `bodyMd`, `categoryIds`, `status`, `createdAt`, `updatedAt`, `deletedAt` | Pertenece a un cuaderno; mantiene IDs de categorías y un estado de estudio. |
| Categoría (`categories`) | Identificador y nombre | Se asocia al apunte mediante `categoryIds`; la lista de filtros se construye desde los nombres existentes. |
| Fragmento (`snippets`) | `id`, `title`, `language`, `code`, `explanation`, `example`, `createdAt` | El Markdown exporta código con un bloque identificado por el lenguaje. |
| Término (`glossary`) | `id`, `term`, `definition`, `example` | Se comprueba duplicidad normalizando Unicode, espacios, mayúsculas y acentos. |
| Error (`errors`) | `id`, `title`, `context`, descripción, causa, solución, `resolved`, `noteId` | Puede enlazarse a un apunte; el estado resuelto se refleja en la interfaz. |
| Tarjeta (`flashcards`) | Identificador y contenido de pregunta/respuesta | Las revisiones asociadas se guardan en `reviews`. |
| Revisión (`reviews`) | Identificador de la tarjeta, caja, contador de repasos y fecha del siguiente repaso | Se usan hasta cinco cajas; los intervalos codificados son 1, 2, 4, 8 y 16 días. Una respuesta negativa vuelve a la primera caja. |
| Cuestionario (`quizzes`) | Identificador y datos descriptivos del cuestionario | Se relaciona con `questions` mediante `quizId`; sus resultados se conservan en `attempts`. |
| Pregunta (`questions`) | `quizId`, `position`, `kind`, `prompt`, `options`, `answers` y/o respuesta corta | `kind` contempla `opcion_multiple`, `verdadero_falso` y `respuesta_corta`; una pregunta de opción múltiple necesita al menos dos opciones. |
| Intento (`attempts`) | `id`, `createdAt` y datos del resultado | Cada envío de cuestionario registra un intento. |
| Sesión (`sessions`) | `id`, `module`, `startedAt`, `endedAt` | La detección de actividad termina una sesión cuando hay más de dos minutos de inactividad. |
| Evento (`events`) | Identificador, tipo de evento, módulo y marca temporal | Se utiliza para métricas y uso por módulo. |

`localStorage` conserva preferencias bajo `kora:prefs` (tema, animación, modo calmo, pausa de fondo, estado de navegación y metadatos del recordatorio de copia). Esas preferencias no son equivalentes a las entidades de IndexedDB.

## 8. Reglas de negocio y validaciones

- Los cuadernos nuevos reciben posiciones consecutivas; el nombre se normaliza, recorta y limita a 80 caracteres.
- Los apuntes tienen estados de estudio «Nuevo», «En repaso» y «Dominado». La vista permite filtrar por estado y categoría.
- Los términos del glosario se comparan ignorando diferencias de mayúsculas y diacríticos, después de normalizar y recortar el texto.
- El editor valida direcciones de enlace e imagen como HTTP/HTTPS. La inserción de imágenes locales está limitada a 512 KB y convierte su contenido a un recurso incrustado en Markdown.
- Las preguntas de opción múltiple exigen al menos dos opciones y una respuesta válida; el formulario evita guardar elementos incompletos.
- El sistema de tarjetas limita las cajas de repaso a cinco y programa intervalos de 1, 2, 4, 8 y 16 días.
- El recordatorio de copia se activa si hay al menos cinco elementos computados por KORA y han pasado siete días desde la última copia; permite posponerlo tres días.
- Las rutas de búsqueda y creación con atajos no se activan mientras se escribe en campos editables ni con Ctrl/Meta/Alt.

## 9. Importación, exportación y borrado

La copia JSON se crea en el navegador mediante `Blob` y una descarga. La exportación empaqueta las colecciones del estado de dominio e incluye una fecha de exportación. La importación compara registros por identificador y fecha de actualización: fusiona con el estado actual, evita borrar datos existentes y usa el registro de la copia solo si es más reciente. La interfaz presenta un resumen previo y rechaza formatos no reconocidos, archivos excesivamente grandes o versiones futuras incompatibles.

La exportación Markdown produce una representación legible de los cuadernos/apuntes y de otros módulos incluidos por el generador. No equivale al respaldo JSON completo. La eliminación lógica utiliza marcas `deletedAt` en entidades que admiten papelera; también existen acciones de eliminación permanente y limpieza total.

## 10. Sincronización local, errores y funcionamiento sin red

El canal `BroadcastChannel` llamado `kora-sync` notifica cambios entre ventanas. Al recibir la notificación, las ventanas recargan los datos desde IndexedDB. Esto es sincronización entre ventanas del mismo origen/perfil, no sincronización remota.

La persistencia captura errores de escritura y muestra «No se pudo guardar en este equipo. Tus últimos cambios podrían perderse». La apertura bloqueada de IndexedDB puede producir «IndexedDB bloqueada». Importaciones inválidas y referencias a elementos eliminados muestran avisos en la interfaz.

El ejecutable carga recursos locales y su contenido de dominio se guarda en el equipo, de modo que no necesita un backend para sus funciones principales. Los contenidos externos requieren conexión. Aunque están presentes `manifest.webmanifest` y `sw.js`, el registro web del service worker depende de HTTPS o localhost y el `main.cjs` carga la interfaz con `kora://`; no se debe asumir una modalidad PWA activa en este paquete.

## 11. Seguridad observada

El proceso de ventana desactiva la integración directa de Node en el renderer, activa aislamiento de contexto y sandbox, rechaza navegación fuera de `kora://app/` y abre enlaces HTTP/HTTPS en el navegador externo. El handler del protocolo personalizado comprueba que los archivos solicitados permanezcan dentro de `webRoot`.

Los datos de estudio se almacenan localmente y la copia de seguridad puede contenerlos en texto legible. Deben protegerse el perfil de Windows y los archivos JSON. No se encontró cifrado de las copias, autenticación, permisos por rol ni control remoto de acceso. Estas observaciones describen el código inspeccionado y no constituyen una auditoría de seguridad.

## 12. Entorno de desarrollo y evolución

La distribución no permite establecer un entorno de desarrollo reproducible: no incluye manifiesto completo de dependencias, scripts de compilación, fuentes originales ni pruebas. `resources\app\package.json` declara únicamente `name`, `productName`, `version` y `main`. No ejecutes `npm install` o comandos de construcción genéricos sobre este artefacto esperando regenerar el producto.

Para realizar cambios mantenibles se necesita el repositorio fuente correspondiente a la versión 0.5.0 y sus instrucciones oficiales de construcción. En el proyecto fuente, los cambios de modelo deberían conservar compatibilidad de exportación/importación y contemplar migración de IndexedDB; la versión de base actual observada es 4. Antes de cambiar persistencia o estructuras, crear pruebas de importación, actualización y recuperación de copias.

## 13. Recomendaciones de mantenimiento

- Mantener la distribución completa y asociar cada paquete a su versión.
- Verificar restauración de una copia JSON antes de una actualización importante.
- Probar importaciones de la versión anterior y casos de conflicto por fecha de actualización al cambiar el formato.
- No depender de IndexedDB como único mecanismo de respaldo ni editar sus objetos manualmente.
- Documentar cualquier cambio en las relaciones por IDs y en las reglas del cuestionario/repaso.
- Si se requiere despliegue web, solicitar el repositorio fuente, configuración de hosting y procedimiento de publicación de PWA; dichos elementos no están incluidos en esta entrega.

## 14. Referencias entre manuales

- [Manual de usuario](./MANUAL_USUARIO.md)
- [Manual de despliegue](./MANUAL_DESPLIEGUE.md)
