FROM node:6.9.4-alpine
MAINTAINER Kyle Lilly kylelilly@gmail.com
EXPOSE 8002
RUN apk add --no-cache make gcc g++ python \
    && mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app
RUN npm install --production
CMD ["npm", "start"]