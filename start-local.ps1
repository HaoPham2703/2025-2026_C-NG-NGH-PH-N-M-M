# FoodFast Microservices Startup Script for Windows
Write-Host "Starting FoodFast Microservices System..." -ForegroundColor Green
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param($Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to start service
function Start-Service {
    param($ServiceName, $Path, $Port)
    
    if (Test-Port $Port) {
        Write-Host "$ServiceName is already running on port $Port" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

# Check if MongoDB is running
if (-not (Test-Port 27017)) {
    Write-Host "Starting MongoDB..." -ForegroundColor Cyan
    # You need to have MongoDB installed and in PATH
    # Start-Process mongod -ArgumentList "--dbpath", "./data/db" -WindowStyle Hidden
    Write-Host "Please start MongoDB manually: mongod --dbpath ./data/db" -ForegroundColor Yellow
} else {
    Write-Host "MongoDB is already running" -ForegroundColor Green
}

# Start services
Start-Service "User Service" "$PWD\services\user-service" 3001
Start-Service "Product Service" "$PWD\services\product-service" 3002
Start-Service "Order Service" "$PWD\services\order-service" 3003
Start-Service "Payment Service" "$PWD\services\payment-service" 3004

# Wait for services to start
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Start-Service "API Gateway" "$PWD\services\api-gateway" 3000

Write-Host ""
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Health Checks:" -ForegroundColor White
Write-Host "- API Gateway: http://localhost:3000/health" -ForegroundColor Cyan
Write-Host "- User Service: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "- Product Service: http://localhost:3002/health" -ForegroundColor Cyan
Write-Host "- Order Service: http://localhost:3003/health" -ForegroundColor Cyan
Write-Host "- Payment Service: http://localhost:3004/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
