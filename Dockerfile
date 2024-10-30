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

ARG DATABASE_FILE

# Create the prisma directory and touch the dev.db file
RUN mkdir -p prisma && touch prisma/dev.db


RUN yarn prisma migrate deploy 

RUN npx prisma generate

RUN yarn build



EXPOSE 3001

# Run the OIDC Lite application
CMD ["yarn", "start:prod", "--app", "oidc-lite"]


