param(
  [switch]$ResetData,
  [switch]$RemoveProjectImages
)

$ErrorActionPreference = 'Stop'

Set-Location "$PSScriptRoot\.."

Write-Host "[1/4] Stopping workforcehub services..."
docker compose down --remove-orphans

if ($ResetData) {
  Write-Host "[2/4] Removing workforcehub data volumes..."
  docker volume rm workforcehub_postgres_data workforcehub_redis_data 2>$null
} else {
  Write-Host "[2/4] Keeping data volumes (use -ResetData to delete DB/cache)."
}

Write-Host "[3/4] Removing stopped containers only for project images..."
$projectContainers = docker ps -a --filter "ancestor=workforcehub-api" --filter "ancestor=workforcehub-frontend" --format "{{.ID}}"
if ($projectContainers) {
  $projectContainers | ForEach-Object { docker rm -f $_ | Out-Null }
}

if ($RemoveProjectImages) {
  Write-Host "[4/4] Removing workforcehub images..."
  docker image rm workforcehub-api workforcehub-frontend 2>$null
} else {
  Write-Host "[4/4] Keeping images (use -RemoveProjectImages to delete)."
}

Write-Host "Done. No global prune was executed."
