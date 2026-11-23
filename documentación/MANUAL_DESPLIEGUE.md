# KORA · Manual de despliegue

**Aplicación:** KORA · Trippy Animations 1.0.0  
**Opciones documentadas:** servidor local de desarrollo y ejecutable portátil para Windows  
**Proyecto fuente local:** `trippy-animations-nuevo`

## 1. Alcance

Este manual describe el proyecto independiente `trippy-animations-nuevo`. El ejecutable portátil utiliza el runtime Electron que acompaña a la distribución original y sirve la interfaz desde un servidor HTTP local. También se puede iniciar el servidor Node en un navegador.

La aplicación no requiere una base de datos SQL ni paquetes externos. No incluye un instalador MSI, servicio de Windows, proxy inverso, certificados TLS ni configuración de alojamiento web. La distribución compilada antigua de KORA y sus datos IndexedDB no se convierten automáticamente a este formato JSON.

## 2. Requisitos

### Para desarrollar o ejecutar el servidor con Node

- Windows, macOS o Linux con Node.js **22.11 o posterior**. El proyecto declara `engines.node >=22.11`.
- PowerShell 5.1 o posterior para el script de empaquetado Windows.
- Permisos de lectura y escritura en la carpeta de datos.
- No se especifica un mínimo de CPU, RAM o espacio en disco.

No hay dependencias npm externas: el servidor usa módulos integrados de Node.js y el proyecto incluye sus recursos web.

### Para ejecutar el paquete portátil

- Windows compatible con el runtime Electron incluido.
- Mantener juntos el `.exe`, DLL, archivos `.pak`, `locales`, `resources` y demás archivos de la carpeta generada.
- No requiere instalar Node.js en el equipo usuario.

## 3. Estructura relevante

```text
KORA-compilado-mejorado/
├── documentación/
└── trippy-animations-nuevo/
    ├── .env.example
    ├── LEEME.txt
    ├── README.md
    ├── main.cjs
    ├── package.json
    ├── server.mjs
    ├── state-validation.mjs
    ├── public/
    ├── scripts/build-portable.ps1
    └── tests/server.test.mjs
```

Las distribuciones generadas quedan en `trippy-animations-nuevo\release\`.

## 4. Preparación del entorno local

Abre PowerShell desde la carpeta que contiene `trippy-animations-nuevo` y entra al proyecto:

```powershell
Set-Location .\trippy-animations-nuevo
node --version
```

Confirma que Node indique `v22.11.0` o posterior. No es necesario ejecutar `npm install`. El proyecto se declara como ES Modules (`"type": "module"`) y no enumera dependencias de terceros.

## 5. Configurar el acceso y el servidor de desarrollo

1. Crea el archivo local de configuración:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

2. En `.env`, establece una contraseña privada de al menos 8 caracteres. Sustituye el valor vacío de `TRIPPY_PASSWORD`; no guardes ni publiques una contraseña real en Git.

   ```dotenv
   TRIPPY_USER=sarharf
   TRIPPY_PASSWORD=REEMPLAZAR_POR_UNA_CONTRASENA_PRIVADA
   TRIPPY_HOST=127.0.0.1
   TRIPPY_PORT=4173
   TRIPPY_DATA_DIR=./data
   TRIPPY_PUBLIC_ORIGIN=http://127.0.0.1:4173
   TRIPPY_SECURE_COOKIE=false
   ```

3. Ejecuta el servidor:

   ```powershell
   npm start
   ```

4. Abre la dirección que aparece en consola; con la configuración de ejemplo es `http://127.0.0.1:4173`.
5. Para detener el servidor, usa `Ctrl+C`.

La cuenta está restringida al usuario `sarharf`. El valor de `TRIPPY_PUBLIC_ORIGIN` debe coincidir con el origen del navegador, incluidos protocolo, host y puerto. El archivo `.env` está excluido por `.gitignore`.

## 6. Pruebas y comprobaciones

Desde `trippy-animations-nuevo`, ejecuta:

```powershell
node --check server.mjs
node --check state-validation.mjs
node --check public\app.js
npm test
```

Las pruebas usan directorios temporales; no requieren una base de datos de desarrollo. `npm test` ejecuta la suite integrada de Node mediante `node --test`.

## 7. Generar el ejecutable portátil de Windows

### Runtime esperado

Por defecto, `scripts\build-portable.ps1` busca el runtime un nivel arriba de `trippy-animations-nuevo`. Allí espera:

- `kora.exe`;
- la carpeta `locales\`;
- `resources\app\icon.png`.

Si el runtime está en otra carpeta, define `KORA_RUNTIME_DIR` con la ruta absoluta que contiene esos recursos. Por ejemplo:

```powershell
$env:KORA_RUNTIME_DIR = 'D:\KORA-runtime'
```

La ruta indicada debe contener la estructura de runtime esperada; el script falla explícitamente si falta el ejecutable o `locales`.

### Construcción

El script no sobrescribe una carpeta de salida existente. Para una salida nueva:

```powershell
$env:KORA_OUTPUT_DIR = Join-Path (Get-Location) 'release\KORA-Trippy-Animations-1.0'
npm run build:portable
```

Si se omite `KORA_OUTPUT_DIR`, la salida predeterminada es `release\KORA-Trippy-Animations\`. Si ya existe, el script se detiene: selecciona otro nombre de salida, sin borrar ni reemplazar la carpeta previa.

El resultado es una carpeta completa. Ejecuta `KORA-Trippy-Animations.exe` desde ella y conserva todos sus archivos juntos. El primer inicio solicita definir la contraseña de `sarharf`; no se incluye una contraseña inicial.

### Crear un ZIP para distribución

Desde `trippy-animations-nuevo`, ajusta el nombre del archivo para no sobrescribir otra copia:

```powershell
Compress-Archive -LiteralPath .\release\KORA-Trippy-Animations-1.0 `
  -DestinationPath .\release\KORA-Trippy-Animations-portable-1.0.zip
```

Distribuye el ZIP y pide a la persona usuaria que extraiga su contenido completo antes de ejecutar el `.exe`.

## 8. Datos, credenciales y copias

### Aplicación de escritorio

Electron configura su directorio local como:

```text
%APPDATA%\KORA-Trippy-Animations\
├── accounts.json
└── data\
    └── 73617268617266.json
```

`accounts.json` guarda el usuario, una sal aleatoria y el resultado de `scrypt`, no la contraseña en texto legible. El archivo JSON de datos corresponde al usuario `sarharf` codificado en hexadecimal. No elimines `%APPDATA%\KORA-Trippy-Animations` para actualizar la aplicación: también contiene el material de estudio.

### Servidor de desarrollo

El usuario se configura desde `.env`; por defecto los datos se escriben en `.\data\73617268617266.json`. Respalda el directorio configurado con `TRIPPY_DATA_DIR` y el archivo `.env` de forma segura. No publiques ninguno de ellos.

La función **Mis datos > Exportar copia** descarga un respaldo JSON. Importar una copia reemplaza el estado de datos actual de esa cuenta; exporta antes de importar.

## 9. Configuración de producción

El servidor incluido usa HTTP. No lo expongas directamente a Internet. Una instalación en un servidor requeriría, como mínimo, un proxy TLS externo, un proceso supervisado, un origen HTTPS, almacenamiento persistente y una política de copias de seguridad; esos componentes no están incluidos ni configurados en este proyecto.

Ejemplo de variables para una instancia detrás de un proxy HTTPS ya configurado:

```powershell
$env:TRIPPY_HOST = '127.0.0.1'
$env:TRIPPY_PORT = '4173'
$env:TRIPPY_PUBLIC_ORIGIN = 'https://kora.ejemplo.com'
$env:TRIPPY_SECURE_COOKIE = 'true'
$env:TRIPPY_DATA_DIR = 'D:\KORA\data'
npm start
```

El proxy debe servir el origen público indicado y reenviar las solicitudes a la instancia local. Configura TLS, firewall, permisos de archivos, monitoreo y administración del proceso fuera de KORA. No se entrega un archivo de configuración para un proxy concreto.

## 10. Límites de migración y actualización

- No hay importación automática desde IndexedDB de la distribución compilada anterior.
- El importador de KORA acepta el formato `kora-backup`, versión `1`, generado por esta aplicación; no asumas que acepta exportaciones de la aplicación antigua.
- Antes de actualizar, exporta una copia JSON y verifica que puedes conservar el directorio `%APPDATA%\KORA-Trippy-Animations`.
- Para actualizar el ejecutable, genera y extrae una carpeta de distribución nueva. No sustituyas individualmente archivos dentro de una carpeta existente.
- Conserva la carpeta de datos de usuario al cambiar la carpeta del programa.

## 11. Solución de problemas de despliegue

| Síntoma | Causa probable y acción |
|---|---|
| `TRIPPY_PASSWORD` no está configurada o es demasiado corta | Completa `.env` con una contraseña de 8 a 1024 caracteres para `sarharf`; reinicia `npm start`. |
| `TRIPPY_PORT` no es válido | Usa un entero entre 1 y 65535. Si otro proceso ocupa el puerto, elige otro y actualiza `TRIPPY_PUBLIC_ORIGIN`. |
| Respuesta «La solicitud no proviene de este sitio» | El origen recibido no coincide con `TRIPPY_PUBLIC_ORIGIN`; ajusta el host, protocolo y puerto. |
| El navegador no conserva la sesión HTTPS | Con TLS, configura `TRIPPY_SECURE_COOKIE=true`; no actives esa opción si accedes por HTTP local. |
| No se pueden escribir datos | Comprueba permisos y espacio disponible en `TRIPPY_DATA_DIR` o `%APPDATA%`. |
| El empaquetado no encuentra `kora.exe` o `locales` | Revisa `KORA_RUNTIME_DIR` y que la ruta contenga el runtime Electron completo. |
| El script dice que la salida ya existe | Define un `KORA_OUTPUT_DIR` nuevo; el script evita sobrescribir la distribución previa. |
| Windows advierte sobre el ejecutable | El paquete no declara firma digital. Verifica el origen antes de continuar. |

## 12. Referencias

- [Manual de usuario](./MANUAL_USUARIO.md)
- [Manual técnico](./MANUAL_TECNICO.md)
El proyecto fuente local incluye un `README.md` con instrucciones adicionales. No se publica en este repositorio, que contiene únicamente los tres manuales.
