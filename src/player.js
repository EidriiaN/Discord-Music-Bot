import { Player } from "discord-player";
import { DefaultExtractors } from "@discord-player/extractor";
import { readFileSync, existsSync } from "fs";
import { getVoiceConnection } from "@discordjs/voice";
import "dotenv/config";

export const setupPlayer = async (client) => {
  const player = new Player(client, {
    ytdlOptions: {
      quality: "highestaudio",
      highWaterMark: 1 << 25, // Large initial buffer
      filter: "audioonly",
      format: "bestaudio/best", // Force best quality audio stream
      requestOptions: {
        headers: {
          "X-Youtube-PO-Token": process.env.PO_TOKEN || "",
          "X-Youtube-Visitor-Data": process.env.VISITOR_DATA || "",
        },
      },
    },
    // --- 2026 Audio Stability Fixes ---
    skipFFmpeg: false, // Ensure we use FFmpeg for processing
    connectionTimeout: 30000, // 30 second timeout for voice connection
  });

  // Track recent errors to prevent spam
  const recentErrors = new Map();

  // Load cookies from .env OR file
  let cookies = process.env.YOUTUBE_COOKIES || "";

  // Auto-decode Base64 if detected (common for Portainer env vars)
  if (cookies && !cookies.includes("\t") && !cookies.includes("\n")) {
    try {
      cookies = Buffer.from(cookies, "base64").toString("utf-8");
      console.log("✅ | Cookies decoded from Base64 environment variable.");
    } catch (e) {
      console.error("❌ | Failed to decode Base64 cookies.");
    }
  }

  if (!cookies && existsSync("./cookies.txt")) {
    cookies = readFileSync("./cookies.txt", "utf-8");
    console.log("✅ | cookies.txt loaded.");
  } else if (cookies) {
    console.log("✅ | Cookies loaded from Environment Variable.");
  }

  // Load Default Extractors
  console.log("📦 | Loading Stable Extractors...");
  await player.extractors.loadMulti(DefaultExtractors);

  // Force YouTube extractor to use our cookies and specific 2026 args
  const youtubeExtractor = player.extractors.get("youtube");
  if (youtubeExtractor) {
    youtubeExtractor.options = {
      ...youtubeExtractor.options,
      cookies: cookies,
      ytLibArgs: ["--extractor-args", `youtube:po_token=${process.env.PO_TOKEN},visitor_data=${process.env.VISITOR_DATA}`],
    };
  }

  // --- Player Events ---

  player.events.on("playerStart", (queue, track) => {
    queue.metadata.channel.send(`🎶 | Now playing: **${track.title}**\n👤 | Requested by: <@${queue.metadata.author.id}>`);
  });

  player.events.on("emptyQueue", (queue) => {
    queue.metadata.channel.send("💤 | Queue finished! Disconnecting...");
  });

  // Helper to prevent error spam (same error within 5 seconds)
  const shouldSendError = (guildId, errorMessage) => {
    const key = `${guildId}:${errorMessage}`;
    const now = Date.now();
    const lastSent = recentErrors.get(key);
    if (lastSent && now - lastSent < 5000) return false;
    recentErrors.set(key, now);
    // Clean up old entries
    for (const [k, t] of recentErrors) {
      if (now - t > 10000) recentErrors.delete(k);
    }
    return true;
  };

  player.events.on("error", (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
    if (!queue?.metadata?.channel) return;
    if (shouldSendError(queue.guild.id, error.message)) {
      queue.metadata.channel.send(`❌ | Critical error: ${error.message}`);
    }
  });

  player.events.on("playerError", (queue, error) => {
    console.error(`[Playback Error] ${error.message}`);
    if (!queue?.metadata?.channel) return;
    if (shouldSendError(queue.guild.id, error.message)) {
      queue.metadata.channel.send(`❌ | Playback failed: ${error.message}`);
    }
  });

  // Handle connection errors specifically
  player.events.on("connectionError", (queue, error) => {
    console.error(`[Connection Error] ${error.message}`);
    if (!queue?.metadata?.channel) return;
    if (shouldSendError(queue.guild.id, error.message)) {
      queue.metadata.channel.send(`❌ | Voice connection error: ${error.message}`);
    }
  });

  return player;
};
