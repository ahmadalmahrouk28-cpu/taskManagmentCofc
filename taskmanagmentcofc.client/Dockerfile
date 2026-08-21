# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

COPY taskmanagmentcofc.client/package.json taskmanagmentcofc.client/package-lock.json ./
RUN npm ci

COPY taskmanagmentcofc.client/ .
RUN npm run build -- --configuration production

FROM nginx:1.29-alpine AS final
COPY taskmanagmentcofc.client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/taskmanagmentcofc.client/browser/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD wget --quiet --output-document=/dev/null http://127.0.0.1/ || exit 1
