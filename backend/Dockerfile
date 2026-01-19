FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm install --production

COPY backend ./backend
COPY scripts ./scripts

# Create data directory for sqlite
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/golf.db

EXPOSE 3001

# Initialize DB if needed and start server
CMD ["sh", "-c", "node scripts/seed.js && node backend/server.js"]
