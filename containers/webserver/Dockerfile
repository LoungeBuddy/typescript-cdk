# Building container
FROM node:14 as build
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build
RUN npm prun --production

# Serving container
FROM node:14 as serve
WORKDIR /usr/src/app
COPY --from=build "/usr/src/app/dist/" "/user/src/app/dist/"
COPY --from=build "/usr/src/app/views/" "/user/src/app/views/"
COPY --from=build "/usr/src/app/node_modules/" "/user/src/app/node_modules/"
COPY --from=build "/usr/src/app/package.json/" "/user/src/app/package.json/"

EXPOSE 8080
CMD ["node", "dist/app.js"]