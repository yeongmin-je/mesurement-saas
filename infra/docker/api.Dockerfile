# MetroAI API — production image (Railway / Render / Fly).
# The image is self-contained: schema is synced and seeds run on startup
# via apps/api/scripts/start-prod.js.
FROM node:20-alpine AS base
RUN corepack enable pnpm
WORKDIR /app
# Build tools for native modules (bcrypt) and openssl for Prisma engines.
RUN apk add --no-cache python3 make g++ libc6-compat openssl

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
# Skip Puppeteer's bundled Chromium download — we install chromium via apk in the runtime stage.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile

FROM base AS build
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @metroai/api prisma:generate \
  && pnpm --filter @metroai/api build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Chromium + fonts so Puppeteer can render Korean PDF reports.
RUN apk add --no-cache \
      openssl libc6-compat \
      chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto-cjk
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/scripts ./apps/api/scripts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
EXPOSE 3001
CMD ["node", "apps/api/scripts/start-prod.js"]
