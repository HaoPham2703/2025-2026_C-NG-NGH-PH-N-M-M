# FoodFast Microservices - Install All Dependencies
Write-Host "📦 Installing FoodFast Microservices Dependencies..." -ForegroundColor Green
Write-Host ""

# Function to install dependencies
function Install-Dependencies {
    param($ServiceName, $Path)
    
    Write-Host "🔄 Installing $ServiceName dependencies..." -ForegroundColor Cyan
    
    if (Test-Path $Path) {
        Set-Location $Path
        
        if (Test-Path "package.json") {
            npm install
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $ServiceName dependencies installed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to install $ServiceName dependencies" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️  No package.json found in $Path" -ForegroundColor Yellow
        }
        
        Set-Location ..
    } else {
        Write-Host "❌ Directory $Path not found" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies for all services
Install-Dependencies "API Gateway" "services/api-gateway"
Install-Dependencies "User Service" "services/user-service"
Install-Dependencies "Product Service" "services/product-service"
Install-Dependencies "Order Service" "services/order-service"
Install-Dependencies "Payment Service" "services/payment-service"
Install-Dependencies "Frontend" "frontend-microservices"

Write-Host "🎉 All dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Create .env files for each service" -ForegroundColor Yellow
Write-Host "2. Start MongoDB: mongod --dbpath ./data/db" -ForegroundColor Yellow
Write-Host "3. Start all services: ./start-all-local.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
