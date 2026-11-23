# Prepara e inicia o TraceQuest (backend Django + frontend Vite).
#   .\iniciar.ps1                 -> instala o que faltar, migra, cria contas/exercícios e sobe os dois servidores
#   .\iniciar.ps1 -Demo           -> igual, mas também cria o histórico de outros estudantes (turma de demonstração)
#   .\iniciar.ps1 -Reset          -> apaga os dados e recria tudo do zero
param([switch]$Demo, [switch]$Reset)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'backend'
$py = Join-Path $backend '.venv\Scripts\python.exe'

if (-not (Test-Path $py)) {
  Write-Host '> Criando ambiente Python...' -ForegroundColor Cyan
  python -m venv (Join-Path $backend '.venv')
  & $py -m pip install -q -r (Join-Path $backend 'requirements.txt')
}
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  Write-Host '> Instalando dependências do frontend...' -ForegroundColor Cyan
  Push-Location $root; npm install; Pop-Location
}

Push-Location $backend
& $py manage.py migrate --noinput | Out-Null
$seedArgs = @('manage.py', 'seed_demo')
if ($Reset) { $seedArgs += '--reset' }
if ($Demo) { $seedArgs += '--demo-history' }
& $py @seedArgs
Pop-Location

Write-Host '> Subindo API em http://127.0.0.1:8000 e app em http://localhost:5173' -ForegroundColor Green
$api = Start-Process -PassThru -WindowStyle Minimized -WorkingDirectory $backend -FilePath $py -ArgumentList 'manage.py', 'runserver', '127.0.0.1:8000'
try {
  Push-Location $root
  npm run dev -- --open
} finally {
  Pop-Location
  if ($api -and -not $api.HasExited) { Stop-Process -Id $api.Id -Force }
}
