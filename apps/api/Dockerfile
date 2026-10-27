# Se construye desde la raíz del monorepo:
#   docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @ccvida/api -w @ccvida/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @ccvida/api \
 && npm prune --omit=dev -w @ccvida/api -w @ccvida/shared

FROM node:24-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/packages/shared packages/shared
COPY --from=build /repo/apps/api/package.json /repo/apps/api/prisma.config.ts apps/api/
COPY --from=build /repo/apps/api/prisma apps/api/prisma
COPY --from=build /repo/apps/api/dist apps/api/dist
WORKDIR /repo/apps/api
# Carpeta de las fotos cuando no hay R2. Se crea a nombre de `node` para que un
# volumen montado acá herede el dueño y la API pueda escribir.
RUN mkdir -p /repo/apps/api/medios && chown node:node /repo/apps/api/medios
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/health || exit 1
# Aplica las migraciones pendientes antes de levantar la API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
