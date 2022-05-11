FROM node:16.13.2

RUN mkdir parse

ADD . /parse
WORKDIR /parse

RUN yarn install
RUN export NODE_PATH=/parse/node_modules
CMD yarn run build
CMD yarn run preview