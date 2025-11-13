# Script to start Payment Service 2

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Service 2 - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (!(Test-Path .env)) {
    Write-Host "⚠️  .env file not found. Creating from env.example..." -ForegroundColor Yellow
    Copy-Item env.example .env
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Check if node_modules exists
if (!(Test-Path node_modules)) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ node_modules exists" -ForegroundColor Green
}

# Check if port 3005 is available
$portCheck = Test-NetConnection -ComputerName localhost -Port 3005 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portCheck) {
    Write-Host "⚠️  Port 3005 is already in use. Service might be running." -ForegroundColor Yellow
    Write-Host "   Testing health endpoint..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -Method GET -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ Service is already running!" -ForegroundColor Green
        Write-Host "   Health check response:" -ForegroundColor Cyan
        Write-Host $response.Content -ForegroundColor White
        exit 0
    } catch {
        Write-Host "❌ Port 3005 is in use but service is not responding." -ForegroundColor Red
        Write-Host "   Please stop the process using port 3005 and try again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Port 3005 is available" -ForegroundColor Green
}

# Start the service
Write-Host ""
Write-Host "🚀 Starting Payment Service 2..." -ForegroundColor Cyan
Write-Host ""
npm start


