# Restaurant Service Setup Guide

## Prerequisites

- Node.js 18+
- MongoDB running on localhost:27017
- npm or yarn

## Installation Steps

### 1. Install dependencies

```bash
cd services/restaurant-service
npm install
```

### 2. Environment Setup

The `.env` file has been created with default values. Adjust if needed:

```env
NODE_ENV=development
PORT=3006
MONGODB_URI=mongodb://localhost:27017/restaurant-service-db
JWT_SECRET=restaurant-super-secret-jwt-key-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. Run the service

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The service will start on `http://localhost:4006`

### 5. Test the service

Health check:

```bash
curl http://localhost:4006/health
```

Expected response:

```json
{
  "status": "success",
  "message": "Restaurant service is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## API Testing

### Register a restaurant

```bash
curl -X POST http://localhost:4006/api/restaurant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Test Restaurant",
    "ownerName": "John Doe",
    "email": "test@restaurant.com",
    "password": "123456",
    "phone": "0912345678",
    "cuisine": "Việt Nam",
    "description": "Test restaurant",
    "address": "123 Test St",
    "ward": "Ward 1",
    "district": "District 1",
    "city": "Hồ Chí Minh"
  }'
```

### Login

```bash
curl -X POST http://localhost:4006/api/restaurant/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@restaurant.com",
    "password": "123456"
  }'
```

## Integration with Frontend

Update frontend API base URL to:

```javascript
http://localhost:4006/api/restaurant
```

Or use API Gateway (if running):

```javascript
http://localhost:3000/api/restaurant
```

## Troubleshooting

### MongoDB connection error

- Check if MongoDB is running: `mongosh` or `mongo`
- Check connection string in `.env`

### Port already in use

Change PORT in `.env` file:

```env
PORT=4007
```

### JWT errors

Make sure JWT_SECRET is set in `.env`

## Database Collections

The service creates these MongoDB collections:

- `restaurants` - Restaurant accounts
- `menuitems` - Menu items for each restaurant

## Next Steps

1. ✅ Service is running on port 4006
2. ✅ Database connection established
3. ✅ API Gateway configured
4. 🔄 Frontend can now connect to real backend
5. 📝 Test registration and login from frontend
