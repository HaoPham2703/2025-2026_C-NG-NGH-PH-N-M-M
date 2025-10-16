# FoodFast Microservices - Stop All Services
Write-Host "🛑 Stopping FoodFast Microservices System..." -ForegroundColor Red
Write-Host ""

# Function to kill process by port
function Stop-ProcessByPort {
    param($Port)
    try {
        $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($process) {
            $pid = $process.OwningProcess
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Stopped process on port $Port" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️  No process found on port $Port" -ForegroundColor Yellow
    }
}

# Stop services by port
Write-Host "🔄 Stopping services..." -ForegroundColor Cyan

Stop-ProcessByPort 5175  # Frontend
Stop-ProcessByPort 3000  # API Gateway
Stop-ProcessByPort 3004  # Payment Service
Stop-ProcessByPort 3003  # Order Service
Stop-ProcessByPort 3002  # Product Service
Stop-ProcessByPort 3001  # User Service
Stop-ProcessByPort 27017 # MongoDB

# Kill Node.js processes
Write-Host "🔄 Stopping Node.js processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ All services stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
