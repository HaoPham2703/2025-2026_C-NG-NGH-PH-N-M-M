#!/bin/bash

echo "Starting FoodFast Microservices System..."
echo

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Start MongoDB if not running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    mongod --dbpath ./data/db &
    sleep 5
else
    echo "MongoDB is already running"
fi

# Start Kafka if not running
if ! pgrep -x "kafka" > /dev/null; then
    echo "Starting Kafka..."
    # You need to have Kafka installed and configured
    # kafka-server-start.sh /path/to/kafka/config/server.properties &
    echo "Please start Kafka manually or install it first"
else
    echo "Kafka is already running"
fi

# Start services
echo "Starting User Service..."
cd services/user-service
npm run dev &
USER_PID=$!
cd ../..

echo "Starting Product Service..."
cd services/product-service
npm run dev &
PRODUCT_PID=$!
cd ../..

echo "Starting Order Service..."
cd services/order-service
npm run dev &
ORDER_PID=$!
cd ../..

echo "Starting Payment Service..."
cd services/payment-service
npm run dev &
PAYMENT_PID=$!
cd ../..

# Wait for services to start
sleep 5

echo "Starting API Gateway..."
cd services/api-gateway
npm run dev &
GATEWAY_PID=$!
cd ../..

echo
echo "All services are starting..."
echo
echo "Health Checks:"
echo "- API Gateway: http://localhost:3000/health"
echo "- User Service: http://localhost:3001/health"
echo "- Product Service: http://localhost:3002/health"
echo "- Order Service: http://localhost:3003/health"
echo "- Payment Service: http://localhost:3004/health"
echo
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo "Stopping all services..."
    kill $USER_PID $PRODUCT_PID $ORDER_PID $PAYMENT_PID $GATEWAY_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
