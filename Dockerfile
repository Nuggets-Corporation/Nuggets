FROM node:20-alpine AS final

RUN apk add --no-cache wget git tini python3
ENTRYPOINT ["/sbin/tini", "--"]
WORKDIR /app

RUN python3 -m venv ./.venv
RUN source ./.venv/bin/activate && pip3 install wisp-python

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN pnpm run build:server
EXPOSE 8050

CMD ["sh", "-c", "source ./.venv/bin/activate && python3 -m wisp.server --host 0.0.0.0 --port 8040 & node server.mjs"]