# Multi-stage production container for PR Quest
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY server ./server
RUN mkdir -p data
EXPOSE 3001
VOLUME ["/app/data"]
CMD ["node", "server/server.js"]
