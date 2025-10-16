@echo off
echo Starting FoodFast Microservices System...
echo.

echo Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath ./data/db"

echo Waiting for MongoDB to start...
timeout /t 5 /nobreak > nul

echo Starting Kafka...
start "Kafka" cmd /k "kafka-server-start.bat ../../config/server.properties"

echo Waiting for Kafka to start...
timeout /t 10 /nobreak > nul

echo Starting User Service...
start "User Service" cmd /k "cd services/user-service && npm run dev"

echo Starting Product Service...
start "Product Service" cmd /k "cd services/product-service && npm run dev"

echo Starting Order Service...
start "Order Service" cmd /k "cd services/order-service && npm run dev"

echo Starting Payment Service...
start "Payment Service" cmd /k "cd services/payment-service && npm run dev"

echo Waiting for services to start...
timeout /t 5 /nobreak > nul

echo Starting API Gateway...
start "API Gateway" cmd /k "cd services/api-gateway && npm run dev"

echo.
echo All services are starting...
echo.
echo Health Checks:
echo - API Gateway: http://localhost:3000/health
echo - User Service: http://localhost:3001/health
echo - Product Service: http://localhost:3002/health
echo - Order Service: http://localhost:3003/health
echo - Payment Service: http://localhost:3004/health
echo.
echo Press any key to exit...
pause > nul
