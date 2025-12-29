# FoodFast Microservices - Run Everything
Write-Host "🚀 FoodFast Microservices - Complete Setup & Run" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
} else {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
}

# Check MongoDB - try different ways
$mongodbInstalled = $false

# Try mongod command
if (Test-Command "mongod") {
    $mongodbInstalled = $true
    Write-Host "✅ MongoDB: Installed (mongod command found)" -ForegroundColor Green
} else {
    # Try mongosh command
    if (Test-Command "mongosh") {
        $mongodbInstalled = $true
        Write-Host "✅ MongoDB: Installed (mongosh command found)" -ForegroundColor Green
    } else {
        # Check if MongoDB Compass is installed (common installation path)
        $compassPaths = @(
            "${env:ProgramFiles}\MongoDB\Compass\mongodb-compass.exe",
            "${env:ProgramFiles(x86)}\MongoDB\Compass\mongodb-compass.exe",
            "${env:LOCALAPPDATA}\Programs\mongodb-compass\mongodb-compass.exe"
        )
        
        foreach ($path in $compassPaths) {
            if (Test-Path $path) {
                $mongodbInstalled = $true
                Write-Host "✅ MongoDB: Installed (Compass found at $path)" -ForegroundColor Green
                break
            }
        }
    }
}

if (-not $mongodbInstalled) {
    Write-Host "❌ MongoDB is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install MongoDB or add it to your PATH." -ForegroundColor Yellow
    Write-Host "You can download MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 1: Setup MongoDB directories
Write-Host "📁 Step 1: Setting up MongoDB directories..." -ForegroundColor Yellow
if (Test-Path "setup-mongodb.ps1") {
    & .\setup-mongodb.ps1
} else {
    Write-Host "⚠️  setup-mongodb.ps1 not found, creating directories manually..." -ForegroundColor Yellow
    if (-not (Test-Path "data-micro")) {
        New-Item -ItemType Directory -Path "data-micro" -Force | Out-Null
        Write-Host "✅ Created data-micro directory" -ForegroundColor Green
    }
    if (-not (Test-Path "data-micro\db")) {
        New-Item -ItemType Directory -Path "data-micro\db" -Force | Out-Null
        Write-Host "✅ Created data-micro\db directory" -ForegroundColor Green
    }
}

Write-Host ""

# Step 2: Install dependencies
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "install-dependencies.ps1") {
    & .\install-dependencies.ps1
} else {
    Write-Host "⚠️  install-dependencies.ps1 not found, installing manually..." -ForegroundColor Yellow
    
    $services = @("api-gateway", "user-service", "product-service", "order-service", "payment-service")
    
    foreach ($service in $services) {
        $servicePath = "services\$service"
        if (Test-Path $servicePath) {
            Write-Host "🔄 Installing $service dependencies..." -ForegroundColor Cyan
            Set-Location $servicePath
            npm install
            Set-Location ..\..
        }
    }
    
    # Install frontend dependencies
    if (Test-Path "frontend-microservices") {
        Write-Host "🔄 Installing frontend dependencies..." -ForegroundColor Cyan
        Set-Location "frontend-microservices"
        npm install
        Set-Location ..
    }
}

Write-Host ""

# Step 3: Create environment files
Write-Host "⚙️  Step 3: Creating environment files..." -ForegroundColor Yellow
if (Test-Path "create-env-files.ps1") {
    & .\create-env-files.ps1
} else {
    Write-Host "⚠️  create-env-files.ps1 not found" -ForegroundColor Yellow
    Write-Host "Please create .env files manually using the examples in each service" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Start MongoDB
Write-Host "🗄️  Step 4: Starting MongoDB..." -ForegroundColor Yellow

# Try to start MongoDB with different methods
$mongodbStarted = $false

# Method 1: Try mongod command
if (Test-Command "mongod") {
    Write-Host "🔄 Starting MongoDB with mongod command..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🗄️  MongoDB Starting...' -ForegroundColor Green; mongod --dbpath ./data-micro/db" -WindowStyle Normal
    $mongodbStarted = $true
} else {
    # Method 2: Try to find MongoDB installation and start it
    $mongodbPaths = @(
        "${env:ProgramFiles}\MongoDB\Server\*\bin\mongod.exe",
        "${env:ProgramFiles(x86)}\MongoDB\Server\*\bin\mongod.exe"
    )
    
    foreach ($pathPattern in $mongodbPaths) {
        $mongodbExe = Get-ChildItem -Path $pathPattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($mongodbExe) {
            Write-Host "🔄 Starting MongoDB from: $($mongodbExe.FullName)" -ForegroundColor Cyan
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🗄️  MongoDB Starting...' -ForegroundColor Green; & '$($mongodbExe.FullName)' --dbpath ./data-micro/db" -WindowStyle Normal
            $mongodbStarted = $true
            break
        }
    }
}

if (-not $mongodbStarted) {
    Write-Host "⚠️  Could not start MongoDB automatically." -ForegroundColor Yellow
    Write-Host "Please start MongoDB manually:" -ForegroundColor Yellow
    Write-Host "1. Open MongoDB Compass" -ForegroundColor Cyan
    Write-Host "2. Or run: mongod --dbpath ./data-micro/db" -ForegroundColor Cyan
    Write-Host "3. Or find your MongoDB installation and run mongod.exe" -ForegroundColor Cyan
} else {
    Write-Host "⏳ Waiting for MongoDB to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host ""

# Step 5: Create databases (optional)
Write-Host "📊 Step 5: Creating databases..." -ForegroundColor Yellow
$createDb = Read-Host "Do you want to create databases manually? (y/n)"
if ($createDb -eq "y" -or $createDb -eq "Y") {
    if (Test-Path "create-databases.ps1") {
        & .\create-databases.ps1
    } else {
        Write-Host "⚠️  create-databases.ps1 not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping database creation (will be created automatically)" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Start all services
Write-Host "🚀 Step 6: Starting all services..." -ForegroundColor Yellow
if (Test-Path "start-all-local.ps1") {
    Write-Host "🔄 Starting all services..." -ForegroundColor Cyan
    & .\start-all-local.ps1
} else {
    Write-Host "⚠️  start-all-local.ps1 not found" -ForegroundColor Yellow
    Write-Host "Please start services manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed!" -ForegroundColor Green
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
Write-Host "🧪 Test System: node test-services.js" -ForegroundColor Yellow
Write-Host "⏹️  Stop All: ./stop-all-local.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
