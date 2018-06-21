FROM alpine:3.7
RUN apk update && apk add g++ nodejs

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
RUN cd /app && npm install

COPY ./src /app
EXPOSE 3002

CMD [ "node", "/app/controller.js" ]
