# ==========================================
# Robotree Robotics LLP - Enterprise Dockerfile
# Multi-stage production container
# ==========================================

# 1. Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools if needed
RUN apk add --no-cache libc6-compat

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including dev for TypeScript compile)
RUN npm ci

# Copy source code and config
COPY . .

# Compile TypeScript backend and frontend distribution
RUN npm run backend:build && npm run build

# 2. Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts and assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/server.js ./
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/data ./data
COPY --from=builder /app/*.html ./
COPY --from=builder /app/*.css ./
COPY --from=builder /app/script.js ./
COPY --from=builder /app/security.js ./
COPY --from=builder /app/icons.js ./
COPY --from=builder /app/certificate.js ./

# Ensure node user owns the runtime data folder for write access
RUN chown -R node:node /app/data

# Use unprivileged user for security compliance
USER node

# Expose standard enterprise application port
EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health/live || exit 1

CMD ["node", "server.js"]
