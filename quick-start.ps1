# FoodFast Microservices - Quick Start
Write-Host "🚀 FoodFast Microservices - Quick Start" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if we have the required files
$requiredFiles = @(
    "services\user-service\package.json",
    "services\product-service\package.json", 
    "services\order-service\package.json",
    "services\payment-service\package.json",
    "services\api-gateway\package.json",
    "frontend-microservices\package.json"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please make sure all services are properly set up." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All required files found" -ForegroundColor Green
Write-Host ""

# Create data directory
Write-Host "📁 Creating data directory..." -ForegroundColor Cyan
if (-not (Test-Path "data-micro")) {
    New-Item -ItemType Directory -Path "data-micro" -Force | Out-Null
    Write-Host "✅ Created data-micro directory" -ForegroundColor Green
}
if (-not (Test-Path "data-micro\db")) {
    New-Item -ItemType Directory -Path "data-micro\db" -Force | Out-Null
    Write-Host "✅ Created data-micro\db directory" -ForegroundColor Green
}

Write-Host ""

# Create .env files if they don't exist
Write-Host "⚙️  Creating .env files..." -ForegroundColor Cyan

$envFiles = @{
    "services\api-gateway\.env" = @"
PORT=3000
NODE_ENV=development
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
JWT_SECRET=dev-jwt-secret-key-here
JWT_EXPIRES_IN=7d
"@
    "services\user-service\.env" = @"
PORT=3001
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_users
JWT_SECRET=dev-jwt-secret-key-here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
"@
    "services\product-service\.env" = @"
PORT=3002
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_products
CLOUDINARY_NAME=dev-cloudinary-name
CLOUDINARY_API_KEY=dev-cloudinary-api-key
CLOUDINARY_API_SECRET=dev-cloudinary-api-secret
"@
    "services\order-service\.env" = @"
PORT=3003
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_orders
PRODUCT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
KAFKA_URL=localhost:9092
"@
    "services\payment-service\.env" = @"
PORT=3004
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_payments
KAFKA_URL=localhost:9092
vnp_TmnCode=dev-vnpay-tmn-code
vnp_HashSecret=dev-vnpay-hash-secret
vnp_Url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnp_ReturnUrl=http://localhost:3000/payment/return
vnp_Locale=vn
STRIPE_PUBLISHABLE_KEY=dev-stripe-publishable-key
STRIPE_SECRET_KEY=dev-stripe-secret-key
"@
    "frontend-microservices\.env" = @"
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=FoodFast Microservices
"@
}

foreach ($envFile in $envFiles.GetEnumerator()) {
    if (-not (Test-Path $envFile.Key)) {
        $envFile.Value | Out-File -FilePath $envFile.Key -Encoding UTF8
        Write-Host "✅ Created $($envFile.Key)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $($envFile.Key) already exists" -ForegroundColor Yellow
    }
}

Write-Host ""

# Start MongoDB
Write-Host "🗄️  Starting MongoDB..." -ForegroundColor Cyan
Write-Host "Please start MongoDB manually:" -ForegroundColor Yellow
Write-Host "1. Open MongoDB Compass" -ForegroundColor Cyan
Write-Host "2. Or run: mongod --dbpath ./data-micro/db" -ForegroundColor Cyan
Write-Host "3. Wait for MongoDB to start, then press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Cyan

$services = @(
    @{Name="User Service"; Path="services\user-service"; Port=3001},
    @{Name="Product Service"; Path="services\product-service"; Port=3002},
    @{Name="Order Service"; Path="services\order-service"; Port=3003},
    @{Name="Payment Service"; Path="services\payment-service"; Port=3004},
    @{Name="API Gateway"; Path="services\api-gateway"; Port=3000},
    @{Name="Frontend"; Path="frontend-microservices"; Port=5175}
)

foreach ($service in $services) {
    Write-Host "🔄 Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($service.Path)'; Write-Host '🚀 $($service.Name) Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "🎉 All services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access Points:" -ForegroundColor White
Write-Host "- 🌐 Frontend: http://localhost:5175" -ForegroundColor Cyan
Write-Host "- 🔗 API Gateway: http://localhost:3000/health" -ForegroundColor Cyan
Write-Host "- 👤 User Service: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "- 📦 Product Service: http://localhost:3002/health" -ForegroundColor Cyan
Write-Host "- 📋 Order Service: http://localhost:3003/health" -ForegroundColor Cyan
Write-Host "- 💳 Payment Service: http://localhost:3004/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "🗄️  MongoDB Compass: mongodb://localhost:27017" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
