# Discord Music Bot - Docker Image (Optimized for Portainer)
# Use Node.js 22 LTS (Slim for stability with native tools)
FROM node:22-bookworm-slim

# Install system dependencies (FFmpeg for audio, Python for yt-dlp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (Required for some YouTube extractors)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the application
COPY src/ ./src/

# Create a non-root user for security
RUN groupadd -r botuser && useradd -r -g botuser botuser \
    && chown -R botuser:botuser /app
USER botuser

# Environment defaults
ENV NODE_ENV=production

# Start command
CMD ["node", "src/index.js"]
