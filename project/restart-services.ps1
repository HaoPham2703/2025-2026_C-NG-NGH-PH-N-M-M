# Script to restart all microservices
Write-Host "🔄 Restarting all microservices..." -ForegroundColor Yellow

# Kill all node processes
Write-Host "⏹️ Stopping all Node.js processes..." -ForegroundColor Red
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Start API Gateway
Write-Host "🚀 Starting API Gateway..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\api-gateway'; npm run dev"

Start-Sleep -Seconds 3

# Start User Service  
Write-Host "👤 Starting User Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\user-service'; npm run dev"

Start-Sleep -Seconds 3

# Start Product Service
Write-Host "📦 Starting Product Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\product-service'; npm run dev"

Start-Sleep -Seconds 3

# Start Order Service
Write-Host "📋 Starting Order Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\order-service'; npm run dev"

Write-Host "✅ All services started! Check individual windows for logs." -ForegroundColor Cyan
Write-Host "🌐 API Gateway: http://localhost:5000" -ForegroundColor Blue
Write-Host "👤 User Service: http://localhost:4001" -ForegroundColor Blue
Write-Host "📦 Product Service: http://localhost:4002" -ForegroundColor Blue
Write-Host "📋 Order Service: http://localhost:4003" -ForegroundColor Blue
