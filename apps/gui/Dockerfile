FROM node:18-alpine

# Install dependencies for electron-builder
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    wine \
    xvfb

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run compile

# Default command
CMD ["npm", "run", "build"]
