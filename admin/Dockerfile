# syntax=docker/dockerfile:1
# Tansift content dashboard: Node 24 + ffmpeg (VP9/Opus/H.264) + sharp.
FROM node:24-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg tini ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 # Fail the build now, not at upload time, if a codec is missing.
 && ffmpeg -hide_banner -encoders | grep -q libvpx-vp9 \
 && ffmpeg -hide_banner -encoders | grep -q libopus \
 && ffmpeg -hide_banner -encoders | grep -q libx264

WORKDIR /app
ENV NODE_ENV=production \
    MALLOC_ARENA_MAX=2 \
    DATA_DIR=/data \
    PORT=8787

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src
COPY public ./public
COPY scripts ./scripts

RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "src/server.js"]
