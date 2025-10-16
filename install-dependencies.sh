#!/bin/bash

echo "📦 Installing FoodFast Microservices Dependencies..."
echo ""

# Function to install dependencies
install_dependencies() {
    local service_name=$1
    local path=$2
    
    echo "🔄 Installing $service_name dependencies..."
    
    if [ -d "$path" ]; then
        cd "$path"
        
        if [ -f "package.json" ]; then
            npm install
            if [ $? -eq 0 ]; then
                echo "✅ $service_name dependencies installed successfully"
            else
                echo "❌ Failed to install $service_name dependencies"
            fi
        else
            echo "⚠️  No package.json found in $path"
        fi
        
        cd ..
    else
        echo "❌ Directory $path not found"
    fi
    
    echo ""
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
else
    node_version=$(node --version)
    echo "✅ Node.js version: $node_version"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
else
    npm_version=$(npm --version)
    echo "✅ npm version: $npm_version"
fi

echo ""

# Install dependencies for all services
install_dependencies "API Gateway" "services/api-gateway"
install_dependencies "User Service" "services/user-service"
install_dependencies "Product Service" "services/product-service"
install_dependencies "Order Service" "services/order-service"
install_dependencies "Payment Service" "services/payment-service"
install_dependencies "Frontend" "frontend-microservices"

echo "🎉 All dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Create .env files for each service"
echo "2. Start MongoDB: mongod --dbpath ./data/db"
echo "3. Start all services: ./start-all-local.sh"
echo ""
echo "Press any key to exit..."
read -n 1
