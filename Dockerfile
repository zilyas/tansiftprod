# syntax=docker/dockerfile:1

# ---- Build: compile the static site ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Public domain used for canonical URLs, sitemap, robots.txt and llms.txt.
# In Coolify, add SITE_URL as a build variable (e.g. https://www.example.com).
ARG SITE_URL=https://www.tansiftproduction.com
# "false" hides the sample projects on the live site (also a build variable).
ARG PUBLIC_SHOW_SAMPLES=true
ENV SITE_URL=${SITE_URL} \
    PUBLIC_SHOW_SAMPLES=${PUBLIC_SHOW_SAMPLES} \
    ASTRO_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Serve: unprivileged nginx on port 8080 ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
