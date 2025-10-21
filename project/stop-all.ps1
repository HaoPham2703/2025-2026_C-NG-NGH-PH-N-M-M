# Stop All Services and Frontend Script
# Author: AI Assistant
# Description: Stops all Node.js processes (services and frontend)

Write-Host "========================================" -ForegroundColor Red
Write-Host "  Stopping All Services" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Get all node processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es) running..." -ForegroundColor Yellow
    Write-Host ""
    
    # Show running processes
    foreach ($process in $nodeProcesses) {
        Write-Host "  - PID: $($process.Id)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
    
    # Stop all node processes
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "All services stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

