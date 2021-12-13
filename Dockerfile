FROM node:latest as build

COPY . /app

WORKDIR /app

RUN yarn install

RUN yarn build

FROM node:latest

WORKDIR /app

COPY --from=build /app/dist/* .

EXPOSE 33200

ENTRYPOINT ["node", "./server/index.js"]