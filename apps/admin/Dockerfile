# Panel (Angular) servido como sitio estático con nginx. Desde la raíz del monorepo:
#   docker build -f apps/admin/Dockerfile --build-arg API_URL=https://api.ejemplo.com .
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/admin/package.json apps/admin/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @ccvida/admin -w @ccvida/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/admin apps/admin

# La URL de la API queda fija al compilar.
ARG API_URL
RUN if [ -z "$API_URL" ]; then echo "Falta el build arg API_URL"; exit 1; fi \
 && npm run build -w @ccvida/admin -- --define "API_URL='${API_URL}'"

FROM nginx:1.27-alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/admin/dist/admin/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
