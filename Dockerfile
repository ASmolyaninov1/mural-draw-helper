FROM node:16.13.2

RUN mkdir parse

ADD . /parse
WORKDIR /parse

RUN yarn install
CMD yarn run preview