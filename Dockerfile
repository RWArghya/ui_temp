# ───────────────────────────────────────────────
# Stage 1 — Build the React/Vite app
# ───────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build.
# VITE_* variables are inlined at build time, not read at runtime, so the
# mock/real switch has to be decided here. Default stays mock.
ARG VITE_USE_MOCK=true
ENV VITE_USE_MOCK=$VITE_USE_MOCK
COPY . .
RUN npm run build          # → /app/dist

# ───────────────────────────────────────────────
# Stage 2 — Serve with Nginx
# ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Nginx's official image runs envsubst over /etc/nginx/templates/*.template
# at startup and writes the result into conf.d, so the API upstream is set by
# an environment variable instead of a rebuild.
#
# NGINX_ENVSUBST_FILTER limits substitution to API_UPSTREAM — without it
# envsubst would also eat $uri, $host and every other nginx variable.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=backend:8080
ENV NGINX_ENVSUBST_FILTER=API_UPSTREAM

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
