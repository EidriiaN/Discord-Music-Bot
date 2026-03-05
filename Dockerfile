# Use Node.js 22 Slim as the base for a lightweight but compatible image
FROM node:22-slim

# Install system dependencies required for audio processing (ffmpeg) and yt-dlp (python3)
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Ensure the bot starts as the main process
CMD ["node", "src/index.js"]
