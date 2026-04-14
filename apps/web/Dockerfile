FROM node:20-alpine AS build

WORKDIR /workspace
COPY . .

RUN npm install
RUN npm run build --workspace @ecommerce/shared
RUN npm run build --workspace @ecommerce/web

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
