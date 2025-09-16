FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files first for better caching
COPY ./backend/package.json ./
COPY ./backend/pnpm-lock.yaml ./

# Install dependencies (including dev dependencies for TypeScript compilation)
RUN pnpm install --frozen-lockfile

# Copy source code and configuration files
COPY ./backend/src ./src
COPY ./backend/tsconfig*.json ./
COPY ./backend/nest-cli.json ./
COPY ./backend/eslint.config.mjs ./
COPY ./backend/.prettierrc ./.prettierrc

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "rm -rf dist && pnpm run start:dev"]