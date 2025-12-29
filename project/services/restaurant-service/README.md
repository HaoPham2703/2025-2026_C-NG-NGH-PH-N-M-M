# Restaurant Service

Restaurant management microservice for C2C food delivery platform.

## Features

- Restaurant authentication (signup/login)
- Restaurant profile management
- Menu management (CRUD operations)
- Business hours configuration
- Notification settings
- Restaurant statistics

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- RESTful API

## Environment Variables

Create a `.env` file based on `env.example`:

```bash
cp env.example .env
```

## Installation

```bash
npm install
```

## Running

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/restaurant/signup` - Register new restaurant
- `POST /api/restaurant/login` - Login
- `POST /api/restaurant/logout` - Logout
- `POST /api/restaurant/change-password` - Change password
- `GET /api/restaurant/me` - Get current restaurant

### Restaurant Profile

- `GET /api/restaurant/profile` - Get profile
- `PUT /api/restaurant/profile` - Update profile
- `PUT /api/restaurant/business-hours` - Update business hours
- `PUT /api/restaurant/notification-settings` - Update notifications
- `GET /api/restaurant/stats` - Get statistics

### Menu Management

- `GET /api/restaurant/menu` - Get all menu items
- `POST /api/restaurant/menu` - Create menu item
- `GET /api/restaurant/menu/:id` - Get menu item
- `PUT /api/restaurant/menu/:id` - Update menu item
- `DELETE /api/restaurant/menu/:id` - Delete menu item
- `PATCH /api/restaurant/menu/:id/stock` - Update stock

## Port

Default: `4006`
