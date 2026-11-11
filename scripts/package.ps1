param(
  [string]$Output = "nayacura.zip"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$StageRoot = Join-Path $Root ".package"
$Stage = Join-Path $StageRoot "nayacura"
$OutputPath = Join-Path $Root $Output

if (Test-Path -LiteralPath $StageRoot) {
  Remove-Item -LiteralPath $StageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $Stage | Out-Null

$excludeNames = @(
  "node_modules", "dist", ".env", ".npm-cache", ".tmp", ".package",
  "qa-artifacts", "coverage", "uploads", ".git"
)
$excludeExtensions = @(".db", ".db-journal", ".log")

function Copy-ProjectTree([string]$Source, [string]$Destination) {
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
    if ($excludeNames -contains $_.Name) { return }
    if ($_.PSIsContainer) {
      Copy-ProjectTree $_.FullName (Join-Path $Destination $_.Name)
    } else {
      if ($excludeExtensions -contains $_.Extension) { return }
      if ($_.Name -eq ".env") { return }
      Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Destination $_.Name) -Force
    }
  }
}

$directories = @("frontend", "backend", "docs", "scripts", "tests")
foreach ($dir in $directories) {
  $source = Join-Path $Root $dir
  if (Test-Path -LiteralPath $source) {
    Copy-ProjectTree $source (Join-Path $Stage $dir)
  }
}

$rootFiles = @(
  "README.md", "package.json", "package-lock.json", ".env.example", ".gitignore"
)
foreach ($file in $rootFiles) {
  $source = Join-Path $Root $file
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $Stage $file) -Force
  }
}

# Safety checks: no secrets, databases, dependency trees or build output.
$leaks = Get-ChildItem -LiteralPath $Stage -Recurse -Force -File | Where-Object {
  $_.Name -eq ".env" -or $_.Extension -in @(".db", ".db-journal") -or $_.FullName -match "node_modules|\\dist\\"
}
if ($leaks) {
  Write-Error "Refusing to package. Sensitive or generated files found: $($leaks.FullName -join ', ')"
  exit 1
}

if (Test-Path -LiteralPath $OutputPath) {
  Remove-Item -LiteralPath $OutputPath -Force
}
Compress-Archive -Path (Join-Path $Stage "*") -DestinationPath $OutputPath -CompressionLevel Optimal

$size = [Math]::Round((Get-Item -LiteralPath $OutputPath).Length / 1MB, 2)
Write-Output "Created $OutputPath ($size MB)"
Write-Output "Source-only package: node_modules, dist, .env, SQLite databases and QA artifacts excluded."
Remove-Item -LiteralPath $StageRoot -Recurse -Force
