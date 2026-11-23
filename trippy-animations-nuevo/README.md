# KORA · Trippy Animations (base nueva)

Aplicación local independiente creada desde el pliego de mejoras. La distribución Electron que llegó originalmente permanece intacta. Incluye acceso para una cuenta, cuadernos y apuntes, herramientas de programación, registro de errores, papelera, buscador general y herramientas de estudio con tarjetas y cuestionarios.

Esta aplicación no importa los datos de IndexedDB ni migra automáticamente el contenido del paquete KORA original. La distribución original permanece intacta; esta es una aplicación independiente con almacenamiento JSON propio.

## Requisitos

- Node.js 22.11 o posterior.
- PowerShell 5.1 o posterior para generar la carpeta ejecutable.
- No requiere instalar paquetes externos: el empaquetado reutiliza el runtime Electron local.

## Generar el ejecutable portátil

La carpeta original de KORA debe permanecer un nivel arriba de este proyecto, como en la estructura recibida. Desde PowerShell, en esta carpeta:

```powershell
npm run build:portable
```

La salida queda en `release\KORA-Trippy-Animations\`. Distribuye la carpeta completa; no muevas el `.exe` por separado. El script se detiene si la carpeta de salida ya existe, para no sobrescribir una distribución previa. Para elegir una salida nueva:

```powershell
$env:KORA_OUTPUT_DIR = Join-Path (Get-Location) 'release\KORA-Trippy-Animations-actualizado'
npm run build:portable
```

Si el runtime original está en otra ruta, configura `KORA_RUNTIME_DIR` con la carpeta que contiene `kora.exe` y `locales`.

Al abrir `KORA-Trippy-Animations.exe` por primera vez, completa el formulario inicial para definir la contraseña de `sarharf`. La aplicación la deriva con `scrypt` y guarda únicamente una sal y un hash en `%APPDATA%\KORA-Trippy-Animations\accounts.json`; después inicia sesión con ese usuario y la contraseña elegida. No existe una contraseña predeterminada ni se incluyen contraseñas en el código o el ejecutable.

## Ejecución de desarrollo en navegador

Para ejecutar el servidor Node directamente:

```powershell
Copy-Item .env.example .env
notepad .env
```

Completa `TRIPPY_PASSWORD` únicamente en `.env`, excluido de Git. La cuenta permitida es `sarharf`. Inicia el servidor:

```powershell
npm start
```

Abre la dirección local indicada en la consola (por defecto `http://127.0.0.1:4173`). Para detenerlo, usa `Ctrl+C`.

## Datos y autenticación

- El formulario de configuración y el acceso envían las contraseñas solo al servidor local. Este las deriva con `scrypt`; no se incluyen en el código ni se devuelven en las respuestas, y no se guardan en texto legible.
- La sesión usa una cookie `HttpOnly`, `SameSite=Strict` y con expiración de ocho horas. Las sesiones se invalidan al reiniciar el servidor.
- Los datos de cada cuenta se guardan por separado como JSON en `TRIPPY_DATA_DIR` (por defecto `data\`). La carpeta está excluida de Git; protege y respalda ese directorio.
- La aplicación no tiene registro público ni recuperación de contraseña.
- En el ejecutable, la cuenta se configura una sola vez; su hash y los datos se guardan en `%APPDATA%\KORA-Trippy-Animations`.
- Si encuentra el archivo de cuentas anterior con dos usuarios, conserva la credencial de `sarharf` y elimina la secundaria del almacén local.

## Configuración de producción

El servidor incluido sirve HTTP y escucha en `127.0.0.1` por defecto. No lo expongas directamente a Internet. Para producción, ejecútalo detrás de un proxy inverso con TLS, limita el acceso de red y configura:

- `TRIPPY_HOST=127.0.0.1` para que Node solo escuche localmente.
- `TRIPPY_PUBLIC_ORIGIN=https://tu-dominio.example` con el origen HTTPS exacto.
- `TRIPPY_SECURE_COOKIE=true` para restringir la cookie a HTTPS.
- Un `TRIPPY_DATA_DIR` persistente con permisos limitados y copias de seguridad.

El proxy TLS, el proceso de servicio y la configuración del dominio no están incluidos en este proyecto ni fueron desplegados.

## Funcionalidades implementadas

- Inicio/cierre de sesión para la cuenta configurada.
- Crear, editar, eliminar y buscar cuadernos; cada uno admite un color de una paleta definida.
- Crear, editar, eliminar y buscar apuntes asociados a un cuaderno, con etiquetas y estado de estudio.
- Buscador global de apuntes, código, errores, tarjetas y cuestionarios, con sugerencias y resaltado de coincidencias.
- Editor de código con lenguajes, resaltado de sintaxis, numeración, autoindentación, deshacer/rehacer, búsqueda, copia, exportación e historial de versiones. El código se guarda como texto y no se ejecuta.
- Bitácora de errores pendientes y solucionados; códigos eliminados, apuntes, errores y cuadernos pueden restaurarse desde la papelera.
- Tarjetas de estudio vinculables a apuntes y cuestionarios personalizados de opción múltiple o verdadero/falso, con explicaciones e historial de resultados.
- Repaso por tema de apuntes, explicaciones de código, tarjetas y cuestionarios.
- Trece temas visuales con vistas previas, modo calmo, alto contraste, filtros de color, seis niveles de texto, subrayado, espaciado, tipografía legible y resaltado de foco.
- Gráficos adaptables de apuntes y progreso, más exportación e importación de copias JSON con las nuevas colecciones.

Los filtros de daltonismo son transformaciones visuales aproximadas y no sustituyen herramientas clínicas. La aplicación no sincroniza datos entre servidores o dispositivos.

## Comprobaciones

```powershell
npm test
```
