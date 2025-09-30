# Example Dockerfile for FoodFast Frontend (React)
FROM node:18-alpine
WORKDIR /app
COPY src/ ./src/
COPY package.json ./
COPY package-lock.json ./
RUN npm install
CMD ["npm", "start"]
