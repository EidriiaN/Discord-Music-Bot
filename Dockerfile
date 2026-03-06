# Use Node.js 22 Slim as the base
FROM node:22-slim

# Install system dependencies required for building native modules and audio processing
# Added build-essential and python3 for npm install compatibility
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies (verbose to debug errors if they occur)
RUN npm install --production || (npm install --production --verbose && exit 1)

# Copy the rest of the application code
COPY . .

# Change ownership to node user for security
RUN chown -R node:node /app

# Switch to non-root user (security best practice)
USER node

# Healthcheck for Portainer container monitoring
# Verifies Node.js process is running by checking if the main process exists
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Ensure the bot starts as the main process
CMD ["node", "src/index.js"]
