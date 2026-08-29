# Use the official Node.js image as the base image
FROM node:lts-alpine AS build

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install the application dependencies
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --ignore-scripts --frozen-lockfile

# Copy the rest of the application files
COPY src ./src
COPY test ./test
COPY nest-cli.json ./
COPY drizzle.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY eslint.config.mjs ./
COPY .env.example ./.env

# Build the NestJS application
RUN pnpm run build

FROM node:lts-alpine AS runtime

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

# Expose the application port
EXPOSE 3000

ENV NODE_ENV=production

# Command to run the application
USER node
CMD ["node", "."]