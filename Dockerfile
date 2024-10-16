FROM node:18-alpine AS build

WORKDIR /build/pwa

ADD pwa/package.json .
ADD pwa/package-lock.json .

RUN npm install

ADD pwa/.editorconfig .
ADD pwa/angular.json .
ADD pwa/tsconfig.app.json .
ADD pwa/tsconfig.json .
ADD pwa/tsconfig.spec.json .
ADD pwa/src ./src

RUN npm run build -c browser

FROM nginx AS run

ADD proxy/server/templates/default.conf.template /etc/nginx/templates/

COPY --from=build /build/pwa/dist/pwa/browser /usr/share/nginx/html