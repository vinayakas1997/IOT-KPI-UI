# Build context is the repo root (see docker-compose.yml) because the app inlines
# ../each-component-explanation and ../each-component-explanation-jp at build time
# via import.meta.glob — both must be present alongside dashboard-app when building.

FROM node:20-alpine AS build
WORKDIR /repo

COPY each-component-explanation ./each-component-explanation
COPY each-component-explanation-jp ./each-component-explanation-jp

WORKDIR /repo/dashboard-app
COPY dashboard-app/package.json dashboard-app/package-lock.json ./
RUN npm ci
COPY dashboard-app/. .
RUN npm run build

# vite-plugin-singlefile inlines all JS/CSS into one index.html, so the runtime
# image only needs a static file server for that single file.
FROM nginx:alpine AS serve
COPY --from=build /repo/dashboard-app/dist /usr/share/nginx/html
EXPOSE 80
