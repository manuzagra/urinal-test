# syntax=docker/dockerfile:1.7
#   dev     : devcontainer image — Node + tooling, NO code (repo is bind-mounted)
#   runtime : production — what Coolify builds (kept LAST so it is the default)
ARG NODE_MAJOR=22

FROM node:${NODE_MAJOR}-bookworm AS dev
# The node image ships a uid-1000 `node` user; the devcontainer feature
# creates `ubuntu` with uid 1000 instead, so free it up.
RUN userdel -r node || true \
    && apt-get update && apt-get install -y --no-install-recommends \
       git curl jq less sudo ca-certificates build-essential python3 \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable
WORKDIR /workspace/app

FROM node:${NODE_MAJOR}-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
WORKDIR /srv/app
# Zero dependencies (node:sqlite is built in): nothing to install or build.
COPY app/ ./
RUN mkdir -p /data && chown node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--disable-warning=ExperimentalWarning", "server.mjs"]
