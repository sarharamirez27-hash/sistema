$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = if ($env:KORA_RUNTIME_DIR) {
  (Resolve-Path -LiteralPath $env:KORA_RUNTIME_DIR).Path
} else {
  Split-Path -Parent $projectRoot
}
$output = if ($env:KORA_OUTPUT_DIR) {
  [System.IO.Path]::GetFullPath($env:KORA_OUTPUT_DIR)
} else {
  Join-Path $projectRoot "release\KORA-Trippy-Animations"
}
$executable = Join-Path $runtimeRoot "kora.exe"
$locales = Join-Path $runtimeRoot "locales"

if (!(Test-Path -LiteralPath $executable -PathType Leaf) -or !(Test-Path -LiteralPath $locales -PathType Container)) {
  throw "No se encontró el runtime Electron original. Define KORA_RUNTIME_DIR con la carpeta que contiene kora.exe y locales."
}
if (Test-Path -LiteralPath $output) {
  throw "Ya existe la salida $output. Muévela manualmente antes de volver a empaquetar."
}

New-Item -ItemType Directory -Path $output -Force | Out-Null
Get-ChildItem -LiteralPath $runtimeRoot -File | Where-Object { $_.Name -notin @("kora.exe", "LEEME.txt") } |
  ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $output }
Copy-Item -LiteralPath $executable -Destination (Join-Path $output "KORA-Trippy-Animations.exe")
Copy-Item -LiteralPath $locales -Destination (Join-Path $output "locales") -Recurse

$appDirectory = Join-Path $output "resources\app"
New-Item -ItemType Directory -Path $appDirectory -Force | Out-Null
foreach ($fileName in @("main.cjs", "server.mjs", "state-validation.mjs", "package.json", "LEEME.txt")) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $fileName) -Destination $appDirectory
}
Copy-Item -LiteralPath (Join-Path $projectRoot "public") -Destination (Join-Path $appDirectory "public") -Recurse
Copy-Item -LiteralPath (Join-Path $runtimeRoot "resources\app\icon.png") -Destination (Join-Path $appDirectory "icon.png")
Copy-Item -LiteralPath (Join-Path $projectRoot "LEEME.txt") -Destination (Join-Path $output "LEEME.txt")

Write-Output "Aplicación portátil creada en: $output"
Write-Output "Abre KORA-Trippy-Animations.exe y conserva toda la carpeta distribuida."
