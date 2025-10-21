# Check Services Status Script
# Author: AI Assistant
# Description: Checks if all services are running

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Service Status Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param(
        [int]$Port
    )
    
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Function to check service status
function Check-Service {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    $isRunning = Test-Port -Port $Port
    
    if ($isRunning) {
        Write-Host "✓ $ServiceName" -ForegroundColor Green -NoNewline
        Write-Host " - http://localhost:$Port" -ForegroundColor Gray
    } else {
        Write-Host "✗ $ServiceName" -ForegroundColor Red -NoNewline
        Write-Host " - Not running" -ForegroundColor Gray
    }
    
    return $isRunning
}

# Check all services
Write-Host "Backend Services:" -ForegroundColor Yellow
$apiGateway = Check-Service -ServiceName "API Gateway    " -Port 5001
$userService = Check-Service -ServiceName "User Service   " -Port 4001
$productService = Check-Service -ServiceName "Product Service" -Port 4002
$orderService = Check-Service -ServiceName "Order Service  " -Port 4003
$paymentService = Check-Service -ServiceName "Payment Service" -Port 4004

Write-Host ""
Write-Host "Frontend:" -ForegroundColor Yellow

# Check frontend ports
$frontendRunning = $false
foreach ($port in 3475..3480) {
    if (Test-Port -Port $port) {
        Write-Host "✓ Frontend" -ForegroundColor Green -NoNewline
        Write-Host " - http://localhost:$port" -ForegroundColor Gray
        $frontendRunning = $true
        break
    }
}

if (-not $frontendRunning) {
    Write-Host "✗ Frontend" -ForegroundColor Red -NoNewline
    Write-Host " - Not running" -ForegroundColor Gray
}

# Count running services
$totalServices = 6
$runningCount = 0
if ($apiGateway) { $runningCount++ }
if ($userService) { $runningCount++ }
if ($productService) { $runningCount++ }
if ($orderService) { $runningCount++ }
if ($paymentService) { $runningCount++ }
if ($frontendRunning) { $runningCount++ }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary: $runningCount/$totalServices services running" -ForegroundColor $(if ($runningCount -eq $totalServices) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan

# Check Node.js processes
Write-Host ""
Write-Host "Node.js Processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Total: $($nodeProcesses.Count) process(es)" -ForegroundColor Gray
} else {
    Write-Host "  No Node.js processes found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

