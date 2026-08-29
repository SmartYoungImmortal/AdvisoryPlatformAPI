# Use the official Node.js image as the base image
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install the application dependencies
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh - && pnpm install --ignore-scripts --frozen-lockfile

# Copy the rest of the application files
COPY src/ .
COPY nest-cli.json .
COPY drizzle.config.ts .
COPY tsconfig.json .
COPY eslint.config.mjs .

# Build the NestJS application
RUN pnpm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
USER node
CMD ["node", "dist/main"]