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

Start-Sleep -Seconds 3

# Start Payment Service
Write-Host "💳 Starting Payment Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\payment-service'; npm run dev"

Start-Sleep -Seconds 3

# Start Restaurant Service
Write-Host "🍽️ Starting Restaurant Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\restaurant-service'; npm run dev"

Start-Sleep -Seconds 3

# Start Drone Service
Write-Host "🚁 Starting Drone Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\drone-service'; npm run dev"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🌐 Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Frontend-mirco'; npm run dev"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ All services started! Check individual windows for logs." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Services:" -ForegroundColor Yellow
Write-Host "  🌐 API Gateway: http://localhost:4000" -ForegroundColor Blue
Write-Host "  👤 User Service: http://localhost:4001" -ForegroundColor Blue
Write-Host "  📦 Product Service: http://localhost:4002" -ForegroundColor Blue
Write-Host "  📋 Order Service: http://localhost:4003" -ForegroundColor Blue
Write-Host "  💳 Payment Service: http://localhost:4004" -ForegroundColor Blue
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Yellow
Write-Host "  🎨 Frontend: http://localhost:5173" -ForegroundColor Blue
