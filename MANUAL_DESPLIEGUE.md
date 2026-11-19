# KORA — Manual de despliegue

**Versión documentada:** 0.5.0  
**Distribución analizada:** paquete de escritorio para Windows  
**Destino:** usuarios locales o distribución de la carpeta completa

Este manual describe cómo poner en funcionamiento la copia entregada. No presupone un backend, un servidor web ni una base de datos externa: ninguno aparece configurado en los archivos analizados. La arquitectura y los límites del paquete se detallan en el [Manual técnico](./MANUAL_TECNICO.md).

## 1. Qué incluye y qué no incluye esta entrega

La distribución contiene `kora.exe`, bibliotecas del runtime Electron/Chromium, `resources\app\main.cjs`, el paquete de metadatos de la aplicación y archivos web compilados en `resources\app\web`.

No se encontraron fuentes originales, scripts de construcción, dependencias instalables, archivos `.env`, servidor de producción, base de datos SQL ni instalador. `resources\app\package.json` solo declara nombre, versión y punto de entrada; no define scripts de npm ni dependencias. Por eso, esta copia se ejecuta como aplicación empaquetada y no puede reconstruirse siguiendo comandos de desarrollo inferidos.

## 2. Requisitos

### Software confirmado

- Windows capaz de ejecutar el paquete y sus bibliotecas incluidas.
- La carpeta completa extraída en una ubicación local con permisos de lectura y escritura adecuados para el perfil del usuario.
- No se necesita instalar Node.js, npm, una base de datos ni un servidor para abrir el ejecutable distribuido.

### Requisitos no especificados

El proyecto no declara mínimos de CPU, memoria, espacio libre, versiones concretas de Windows ni políticas de servidor. No se deben tratar valores no documentados como requisitos oficiales.

## 3. Preparación y ejecución local

1. Copia el paquete recibido en el equipo.
2. Extrae **toda** la carpeta, sin abrir el ejecutable desde el interior del ZIP.
3. Comprueba que `kora.exe`, `resources\` y los archivos DLL/Pak estén juntos como en la distribución.
4. Abre `kora.exe` desde el Explorador de archivos.

También se puede ejecutar desde PowerShell, ubicándose primero en la carpeta raíz extraída:

```powershell
Set-Location 'C:\ruta\KORA-compilado-mejorado'
.\kora.exe
```

La carpeta temporal usada como ejemplo debe cambiarse por la ruta real. No se requiere ejecutar un comando de instalación ni un `npm install`.

## 4. Datos y configuración

No existe configuración mediante variables de entorno en esta entrega. Tampoco hay credenciales de conexión que configurar.

La aplicación usa almacenamiento local de Chromium: una base IndexedDB lógica llamada `kora` y almacenamiento local para preferencias. El archivo `LEEME.txt` indica que los datos de escritorio se guardan en:

```text
%APPDATA%\KORA
```

El código no configura una ruta de datos propia en `main.cjs`; la ruta informada por el paquete corresponde al directorio de datos de usuario de Electron. Los archivos de datos no se deben mover o editar manualmente. Para transportarlos o recuperarlos, utilice «Ajustes» > «Mis datos» > «Exportar copia (JSON)» e importe la copia desde la aplicación.

No hay un proceso de creación o importación de base de datos SQL. IndexedDB se abre automáticamente al iniciar KORA y crea los almacenes requeridos cuando faltan. Si no se puede abrir IndexedDB, el bundle contempla un almacenamiento en memoria; este no constituye persistencia y los cambios pueden perderse al cerrar la aplicación.

## 5. Despliegue en un equipo o entorno productivo

La modalidad compatible comprobada es distribuir y ejecutar la carpeta de escritorio:

1. Exporta una copia JSON de los datos antes de cambiar la versión.
2. Distribuye el paquete completo sin separar `kora.exe` de `resources\`, DLL, archivos `.pak` ni `locales\`.
3. En el equipo de destino, extrae el contenido en una carpeta local.
4. Inicia `kora.exe` con el usuario de Windows que utilizará KORA.
5. Si es un equipo con datos previos, inicia KORA desde el perfil correspondiente y verifica que estén disponibles. Si necesitas mover información entre perfiles o equipos, usa una copia JSON.

No hay servicio de Windows, API, servidor central, cuenta compartida o despliegue multiusuario implementado en la entrega. Cada perfil de Windows mantiene su propio almacenamiento local. Para una organización, la distribución puede copiarse a varios equipos, pero los datos de cada usuario permanecen independientes salvo que se exporten e importen manualmente.

## 6. Alternativas web y PWA

`resources\app\web` contiene `index.html`, un manifiesto PWA y `sw.js`. El código web intenta registrar el service worker solo bajo HTTPS o en `localhost`/`127.0.0.1`. Sin embargo, la entrega no incluye un servidor web, configuración de hosting, dominio, certificados, ni los archivos de código fuente y construcción necesarios para publicar una versión web. El archivo `KORA.html` mencionado en `LEEME.txt` no está presente en la carpeta recibida.

Por tanto, no hay un procedimiento web o PWA reproducible que pueda recomendarse para este paquete. No se debe servir simplemente la carpeta por HTTP ni asumir que la modalidad descrita en el texto de ayuda está incluida en esta distribución.

## 7. Actualización y mantenimiento

El procedimiento que indica `LEEME.txt` es:

1. Exportar una copia JSON desde la versión que se está utilizando.
2. Extraer la nueva distribución en una carpeta nueva o distinta.
3. Abrir el nuevo `kora.exe`; no es necesario instalar la aplicación.
4. Confirmar que los datos anteriores aparecen. Si se van a trasladar a otro perfil o equipo, importar el respaldo JSON.

El paquete indica que los datos están fuera de la carpeta del programa y que se actualizan automáticamente al abrir una versión nueva. Aun así, conserva el respaldo hasta comprobar la actualización. No reemplaces manualmente archivos internos ni elimines la carpeta `%APPDATA%\KORA`.

Para mantenimiento rutinario:

- conserva al menos una copia JSON independiente;
- distribuye únicamente paquetes completos y de origen confiable;
- no edites directamente la IndexedDB;
- registra la versión utilizada al reportar un problema.

## 8. Solución de problemas

| Problema | Comprobaciones y solución |
|---|---|
| Windows impide iniciar el ejecutable | Verifica el origen del paquete. `LEEME.txt` indica que esta copia no está firmada. Solo continúa si la distribución es confiable y la política del equipo lo permite. |
| La aplicación no inicia o muestra errores de bibliotecas | Asegúrate de haber extraído el paquete completo y no haber movido solamente `kora.exe`. Vuelve a extraer una copia íntegra. |
| Los datos no aparecen después de cambiar de usuario de Windows | El almacenamiento es local al perfil. Inicia la aplicación con el perfil original o exporta/importa una copia JSON. |
| Se muestra un aviso de que no se pudo guardar | Comprueba espacio disponible y permisos del perfil; cierra ventanas duplicadas y vuelve a abrir KORA. Exporta respaldo si la aplicación todavía permite hacerlo. |
| La importación se rechaza | Usa un archivo JSON generado por KORA, verifica que esté íntegro y que la versión de la aplicación pueda leerlo. Una copia de una versión futura puede no ser compatible. |
| Se desea desplegar en un servidor | Esta carpeta no incluye un servidor ni instrucciones de publicación web. Usa el paquete de escritorio o solicita la entrega del proyecto fuente y su configuración oficial de hosting. |

## 9. Archivos relevantes para el operador

| Ruta desde la raíz de la distribución | Función |
|---|---|
| `kora.exe` | Ejecutable de escritorio. |
| `resources\app\main.cjs` | Proceso principal Electron y creación de la ventana. |
| `resources\app\package.json` | Metadatos de la aplicación y punto de entrada. |
| `resources\app\web\index.html` | Entrada de la interfaz compilada. |
| `resources\app\web\assets\` | JavaScript, CSS y fuentes de la interfaz. |
| `resources\app\web\manifest.webmanifest`, `sw.js` | Recursos PWA presentes; no sustituyen una configuración de servidor. |
| `LEEME.txt` | Instrucciones incluidas por la distribución para abrir, actualizar y respaldar datos. |
