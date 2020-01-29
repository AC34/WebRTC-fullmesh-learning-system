# ws-server
FROM node:10

ADD ./ws-public/package.json ./var/www/ws-server/package.json
ADD ./ws-public/src/ ./var/www/ws-server/src/

WORKDIR /var/www/ws-server

EXPOSE 5001

#RUN npm install --verbose
ENV NODE_PATH=/var/www/ws-server/node_modules/

CMD npm install && node src/index.js
