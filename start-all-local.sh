#!/bin/bash

echo "🚀 Starting FoodFast Microservices System Locally..."
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Function to start service
start_service() {
    local service_name=$1
    local path=$2
    local port=$3
    
    if check_port $port; then
        echo "🔄 Starting $service_name on port $port..."
        cd "$path"
        npm run dev &
        echo $! > "../${service_name,,}-service.pid"
        cd ..
        sleep 2
    else
        echo "⚠️  $service_name is already running on port $port"
    fi
}

# Start MongoDB if not running
if ! pgrep -x "mongod" > /dev/null; then
    echo "🔄 Starting MongoDB..."
    mongod --dbpath ./data/db &
    sleep 5
else
    echo "✅ MongoDB is already running"
fi

# Start services in order
echo ""
echo "🔄 Starting Backend Services..."

start_service "User" "services/user-service" 3001
start_service "Product" "services/product-service" 3002
start_service "Order" "services/order-service" 3003
start_service "Payment" "services/payment-service" 3004

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 8

start_service "API-Gateway" "services/api-gateway" 3000

# Wait for API Gateway
sleep 5

# Start Frontend
echo ""
echo "🔄 Starting Frontend..."
start_service "Frontend" "frontend-microservices" 5175

echo ""
echo "🎉 All services are starting!"
echo ""
echo "📊 Access Points:"
echo "- 🌐 Frontend: http://localhost:5175"
echo "- 🔗 API Gateway: http://localhost:3000/health"
echo "- 👤 User Service: http://localhost:3001/health"
echo "- 📦 Product Service: http://localhost:3002/health"
echo "- 📋 Order Service: http://localhost:3003/health"
echo "- 💳 Payment Service: http://localhost:3004/health"
echo ""
echo "🧪 Test System:"
echo "- Run: node test-services.js"
echo ""
echo "⏹️  To stop all services:"
echo "- Run: ./stop-all-local.sh"
echo "- Or press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping all services..."
    
    # Kill services by PID files
    for pidfile in *-service.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            kill $pid 2>/dev/null
            rm "$pidfile"
        fi
    done
    
    # Kill MongoDB
    pkill mongod 2>/dev/null
    
    echo "✅ All services stopped!"
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
echo "Press Ctrl+C to stop all services..."
wait
