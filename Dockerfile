# ───────────────────────────────────────────────
# Stage 1 — Build the React/Vite app
# ───────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build          # → /app/dist

# ───────────────────────────────────────────────
# Stage 2 — Serve with Nginx
# ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config (SPA fallback + API proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
