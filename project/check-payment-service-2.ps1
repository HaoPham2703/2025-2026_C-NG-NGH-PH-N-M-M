# Script to check Payment Service 2 status

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Service 2 - Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if service is running
Write-Host "1. Checking if service is running on port 3005..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Service is running!" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Service is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   To start the service:" -ForegroundColor Yellow
    Write-Host "   cd services\payment-service-2" -ForegroundColor White
    Write-Host "   npm start" -ForegroundColor White
    exit 1
}

Write-Host ""

# Check port status
Write-Host "2. Checking port 3005 status..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr :3005
if ($portCheck) {
    Write-Host "   ✅ Port 3005 is in use:" -ForegroundColor Green
    Write-Host "   $portCheck" -ForegroundColor White
} else {
    Write-Host "   ⚠️  Port 3005 is not in use" -ForegroundColor Yellow
}

Write-Host ""

# Test API endpoint
Write-Host "3. Testing API endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        orderId = "test-check"
        amount = 100000
        orderInfo = "Test payment check"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/v1/payments/create_payment_url" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ API endpoint is working!" -ForegroundColor Green
    $responseData = $response.Content | ConvertFrom-Json
    if ($responseData.status -eq "success") {
        Write-Host "   Status: $($responseData.status)" -ForegroundColor Green
        Write-Host "   Order ID: $($responseData.orderId)" -ForegroundColor White
        Write-Host "   VNPay URL created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ API endpoint test failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure frontend is running on port 3475" -ForegroundColor White
Write-Host "2. Restart frontend if you just updated vite.config.js" -ForegroundColor White
Write-Host "3. Check browser console for any errors" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan


