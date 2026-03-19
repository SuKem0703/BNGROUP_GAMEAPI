# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy các file cấu hình và cài đặt dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code và build
COPY src ./src
COPY .env ./
RUN npm run build

# Runtime stage
FROM node:20-alpine AS production
WORKDIR /app

# Chỉ cài các dependencies cần thiết cho production
COPY package*.json ./
RUN npm install --only=production

# Copy thư mục build từ stage trước
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env ./

# Cho phép Render sử dụng cổng động
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["node", "dist/server.js"]