# Discord Music Bot - Docker Image
FROM node:22-slim

# Install FFmpeg and yt-dlp dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/
COPY cookies.txt* ./

# Run as non-root user for security
RUN useradd -m botuser && chown -R botuser:botuser /app
USER botuser

# Start the bot
CMD ["node", "src/index.js"]
