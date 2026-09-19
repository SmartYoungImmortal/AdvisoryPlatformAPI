# Node is pinned to a major rather than `lts-alpine`. The floating tag meant the
# image could move to the next LTS between two builds of the same commit, and
# README.md already states Node 24 as the prerequisite — three statements that
# disagreed silently.
FROM node:24-alpine AS build

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# Copy package.json and the lockfile to the working directory
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

# Build the NestJS application
RUN pnpm run build

# Production dependencies, resolved on their own so the runtime stage does not
# inherit the build stage's node_modules. It was copied wholesale before, which
# shipped nest, typescript, jest, drizzle-kit and eslint into production.
FROM node:24-alpine AS deps

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --prod --ignore-scripts --frozen-lockfile

FROM node:24-alpine AS runtime

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

# Expose the application port
EXPOSE 3000

ENV NODE_ENV=production

USER node

# The entrypoint is spelled out rather than left to directory resolution.
# `node .` needed package.json's `main` or an index.js and had neither, so this
# image could never start; and the path is dist/src/main.js, not dist/main.js,
# because tsconfig.json sets rootDir to "." and drizzle.config.ts sits at the
# repo root, which makes "." the common root of the emit. Naming the file means a
# future rootDir change breaks the build loudly instead of at container start.
CMD ["node", "dist/src/main.js"]
