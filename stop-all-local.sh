#!/bin/bash

echo "🛑 Stopping FoodFast Microservices System..."
echo ""

# Function to kill process by port
kill_by_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null
        echo "✅ Stopped process on port $port"
    else
        echo "⚠️  No process found on port $port"
    fi
}

# Stop services by port
echo "🔄 Stopping services..."

kill_by_port 5175  # Frontend
kill_by_port 3000  # API Gateway
kill_by_port 3004  # Payment Service
kill_by_port 3003  # Order Service
kill_by_port 3002  # Product Service
kill_by_port 3001  # User Service
kill_by_port 27017 # MongoDB

# Kill Node.js processes
echo "🔄 Stopping Node.js processes..."
pkill -f "npm run dev" 2>/dev/null
pkill -f "node.*dev" 2>/dev/null

# Remove PID files
rm -f *-service.pid 2>/dev/null

echo ""
echo "✅ All services stopped!"
echo ""
echo "Press any key to exit..."
read -n 1
