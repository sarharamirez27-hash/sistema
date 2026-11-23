# KORA

KORA es una aplicación local de estudio con cuadernos, apuntes, fragmentos de código,
errores, tarjetas y cuestionarios.

El código fuente mantenible se encuentra en `trippy-animations-nuevo/`. Los manuales
se encuentran en `documentación/`.

## Requisitos

- Node.js 22.11 o posterior
- PowerShell 5.1 o posterior para generar la distribución portable

## Desarrollo

```powershell
cd trippy-animations-nuevo
Copy-Item .env.example .env
npm start
```

Las pruebas se ejecutan con:

```powershell
npm test
```

No subas datos personales, archivos `.env`, cuentas locales ni carpetas `data/`.
