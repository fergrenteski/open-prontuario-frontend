# syntax=docker/dockerfile:1
# Frontend Open Prontuário: build estático do Vite servido por nginx sem root.
# As variáveis VITE_* são embutidas no bundle no momento do build (não há segredo nelas).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL=""
ARG VITE_AUTH_MODE="dev"
ARG VITE_ENTRA_CLIENT_ID=""
ARG VITE_ENTRA_TENANT_ID=""
ARG VITE_ENTRA_API_SCOPE=""
ARG VITE_APIM_SUBSCRIPTION_KEY=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTH_MODE=$VITE_AUTH_MODE \
    VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID \
    VITE_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID \
    VITE_ENTRA_API_SCOPE=$VITE_ENTRA_API_SCOPE \
    VITE_APIM_SUBSCRIPTION_KEY=$VITE_APIM_SUBSCRIPTION_KEY
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
USER 101
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
