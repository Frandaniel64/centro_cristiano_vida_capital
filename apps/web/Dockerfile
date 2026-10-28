# Web pública (Astro con servidor Node). Se construye desde la raíz del monorepo:
#   docker build -f apps/web/Dockerfile --build-arg PUBLIC_API_URL=https://api.ejemplo.com .
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @ccvida/web -w @ccvida/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/web apps/web

# Las variables PUBLIC_* quedan fijas al compilar.
ARG PUBLIC_API_URL
ARG PUBLIC_TURNSTILE_SITE_KEY=
ARG PUBLIC_DEMO=false
ARG SITE_URL=https://ccvida.com.ar
ENV ASTRO_ADAPTER=node \
    PUBLIC_API_URL=$PUBLIC_API_URL \
    PUBLIC_TURNSTILE_SITE_KEY=$PUBLIC_TURNSTILE_SITE_KEY \
    PUBLIC_DEMO=$PUBLIC_DEMO \
    SITE_URL=$SITE_URL
RUN if [ "$PUBLIC_DEMO" != "true" ] && [ -z "$PUBLIC_API_URL" ]; then \
      echo "Falta PUBLIC_API_URL (o PUBLIC_DEMO=true)"; exit 1; \
    fi \
 && npm run build -w @ccvida/web \
 && npm prune --omit=dev -w @ccvida/web -w @ccvida/shared

FROM node:24-alpine
WORKDIR /repo
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/packages/shared packages/shared
COPY --from=build /repo/apps/web/package.json apps/web/
COPY --from=build /repo/apps/web/dist apps/web/dist
WORKDIR /repo/apps/web
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/robots.txt > /dev/null || exit 1
CMD ["node", "dist/server/entry.mjs"]
