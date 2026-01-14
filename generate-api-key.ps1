#!/usr/bin/env pwsh

# Script para generar una API key segura en PowerShell

Write-Host ""
Write-Host "🔑 Generando API Key para tu portfolio..." -ForegroundColor Cyan
Write-Host ""

# Generar una key aleatoria de 32 bytes (64 caracteres hex)
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$apiKey = [System.BitConverter]::ToString($bytes).Replace("-","").ToLower()

Write-Host "Tu API Key:" -ForegroundColor Green
Write-Host ("━" * 70) -ForegroundColor Gray
Write-Host $apiKey -ForegroundColor Yellow
Write-Host ("━" * 70) -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Pasos siguientes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Guarda esta key en un lugar seguro" -ForegroundColor White
Write-Host ""
Write-Host "2. Agrégala a tu portfolio como variable de entorno:" -ForegroundColor White
Write-Host "   PORTFOLIO_API_KEY=$apiKey" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Agrégala a GitHub Secrets en tu proyecto:" -ForegroundColor White
Write-Host "   - Ve a Settings > Secrets and variables > Actions" -ForegroundColor DarkGray
Write-Host "   - New repository secret" -ForegroundColor DarkGray
Write-Host "   - Name: PORTFOLIO_API_KEY" -ForegroundColor DarkGray
Write-Host "   - Value: (pega la key de arriba)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "4. También agrega PORTFOLIO_API_URL:" -ForegroundColor White
Write-Host "   - Name: PORTFOLIO_API_URL" -ForegroundColor DarkGray
Write-Host "   - Value: https://tu-portfolio.com (tu URL)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "⚠️  IMPORTANTE: No compartas esta key públicamente!" -ForegroundColor Red
Write-Host ""

# Opcional: Copiar al clipboard
$copyToClipboard = Read-Host "¿Copiar la key al portapapeles? (s/n)"
if ($copyToClipboard -eq "s" -or $copyToClipboard -eq "S") {
    Set-Clipboard -Value $apiKey
    Write-Host "✓ Key copiada al portapapeles!" -ForegroundColor Green
    Write-Host ""
}
