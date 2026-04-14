FROM node:20-alpine AS build

WORKDIR /workspace
COPY . .

RUN npm install
RUN npm run build --workspace @ecommerce/shared
RUN npm run build --workspace @ecommerce/order-service

FROM node:20-alpine

WORKDIR /workspace
COPY --from=build /workspace /workspace

WORKDIR /workspace/services/order-service
EXPOSE 4003

CMD ["npm", "run", "start"]

