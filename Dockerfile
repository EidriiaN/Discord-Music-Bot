# Discord Music Bot - Docker Image (Optimized for Native Support)
FROM node:22-bookworm-slim

# Install system dependencies (FFmpeg for audio, Python for yt-dlp, build-essential for native opus/sodium)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    curl \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (will compile native modules thanks to build-essential)
RUN npm ci --omit=dev

# Copy the rest of the application
COPY src/ ./src/

# Create a non-root user
RUN groupadd -r botuser && useradd -r -g botuser botuser \
    && chown -R botuser:botuser /app
USER botuser

ENV NODE_ENV=production

# Start command
CMD ["node", "src/index.js"]
