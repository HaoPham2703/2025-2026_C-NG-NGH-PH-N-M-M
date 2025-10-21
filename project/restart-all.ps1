# Restart All Services Script
# Author: AI Assistant
# Description: Stops all services and starts them again

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$ProjectRoot = $PSScriptRoot

# Stop all services
Write-Host "Step 1: Stopping all services..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Step 2: Starting all services..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Run start-all.ps1
& "$ProjectRoot\start-all.ps1"

