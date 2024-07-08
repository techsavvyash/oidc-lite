FROM node:18-alpine

WORKDIR /src

COPY package*.json ./

RUN yarn install

RUN npx husky install


COPY . .

RUN mkdir -p .husky && \
    echo '#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpm test' > .husky/pre-commit && \
    echo '#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpm run lint' > .husky/pre-push && \
    chmod +x .husky/pre-commit .husky/pre-push

RUN yarn prisma migrate dev 

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start:dev"]


