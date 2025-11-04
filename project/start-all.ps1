# Start All Services and Frontend Script
# Author: AI Assistant
# Description: Starts API Gateway, all microservices, and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting FoodFast Microservices" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Port
    )
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Green
    
    $scriptBlock = @"
cd '$ServicePath'
Write-Host '====================================' -ForegroundColor Yellow
Write-Host ' $ServiceName - Port $Port' -ForegroundColor Yellow
Write-Host '====================================' -ForegroundColor Yellow
npm run dev
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
    Start-Sleep -Seconds 2
}

# Get current directory
$ProjectRoot = $PSScriptRoot

# Start services
Start-Service -ServiceName "API Gateway" -ServicePath "$ProjectRoot\services\api-gateway" -Port "5001"
Start-Service -ServiceName "User Service" -ServicePath "$ProjectRoot\services\user-service" -Port "4001"
Start-Service -ServiceName "Product Service" -ServicePath "$ProjectRoot\services\product-service" -Port "4002"
Start-Service -ServiceName "Order Service" -ServicePath "$ProjectRoot\services\order-service" -Port "4003"
Start-Service -ServiceName "Payment Service" -ServicePath "$ProjectRoot\services\payment-service" -Port "4004"
Start-Service -ServiceName "Restaurant Service" -ServicePath "$ProjectRoot\services\restaurant-service" -Port "4006"
Start-Service -ServiceName "Drone Service" -ServicePath "$ProjectRoot\services\drone-service" -Port "4007"

Write-Host ""
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
$frontendScript = @"
cd '$ProjectRoot\Frontend-mirco'
Write-Host '====================================' -ForegroundColor Magenta
Write-Host ' Frontend - Port 3475+' -ForegroundColor Magenta
Write-Host '====================================' -ForegroundColor Magenta
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services started successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running on:" -ForegroundColor White
Write-Host "  - API Gateway:      http://localhost:5001" -ForegroundColor Yellow
Write-Host "  - User Service:     http://localhost:4001" -ForegroundColor Yellow
Write-Host "  - Product Service:  http://localhost:4002" -ForegroundColor Yellow
Write-Host "  - Order Service:    http://localhost:4003" -ForegroundColor Yellow
Write-Host "  - Payment Service:  http://localhost:4004" -ForegroundColor Yellow
Write-Host "  - Restaurant Service: http://localhost:4006" -ForegroundColor Yellow
Write-Host "  - Drone Service:    http://localhost:4007" -ForegroundColor Yellow
Write-Host "  - Frontend:         http://localhost:3475" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to close this window (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


