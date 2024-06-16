# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /src

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN yarn install

RUN npx husky install


# Copy the rest of the application code to the working directory
COPY . .

RUN mkdir -p .husky && \
    echo '#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpm test' > .husky/pre-commit && \
    echo '#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpm run lint' > .husky/pre-push && \
    chmod +x .husky/pre-commit .husky/pre-push

RUN yarn prisma migrate dev 

# Build the NestJS application
RUN yarn build

# Expose the port that the application will run on
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start:dev"]


