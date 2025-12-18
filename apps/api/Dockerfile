FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npx prisma generate --schema=libs/db/prisma/schema.prisma
RUN npx nx build api --configuration=production

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/libs/db/prisma ./prisma
COPY --from=builder /app/libs/db/src/generated ./libs/db/src/generated

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN set -e && ENGINE_PATH=ind ./node_modules -path "*/.prisma/client/libquery_engine-*.so.node" | head -n 1 || true && if [ -n "" ]; then cp "" ./libs/db/src/generated/; fi

COPY --from=builder /app/apps/api/src/i18n/locales ./dist/locales

COPY apps/api/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN addgroup -S zedhosting && adduser -S zedhosting -G zedhosting

EXPOSE 3000

CMD ["sh", "/app/entrypoint.sh"]
