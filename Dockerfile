# Framework: express (recognised) — repo Dockerfile WINS over the Pier template.
# Env detection reads .env.example (PORT, APP_NAME); DATABASE_URL comes from
# the project's managed Postgres mount, not the vault.
FROM node:20-alpine

LABEL framework=express

WORKDIR /app

ENV PORT=8080
ENV APP_NAME="Todo Prisma"

COPY package.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npx prisma generate

COPY server.js entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider "http://localhost:${PORT}/health" || exit 1

CMD ["./entrypoint.sh"]
