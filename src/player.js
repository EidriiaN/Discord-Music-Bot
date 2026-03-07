import { Player } from "discord-player";
import { DefaultExtractors } from "@discord-player/extractor";
import { readFileSync, existsSync } from "fs";
import { getVoiceConnection } from "@discordjs/voice";
import { execSync } from "child_process";
import ffmpeg from "ffmpeg-static";
import "dotenv/config";

export const setupPlayer = async (client) => {
  // Check for FFmpeg
  try {
    const ffmpegPath = ffmpeg || "ffmpeg";
    const ffmpegVersion = execSync(`${ffmpegPath} -version`).toString().split("\n")[0];
    console.log(`✅ | FFmpeg detected: ${ffmpegVersion}`);
    console.log(`📂 | FFmpeg Path: ${ffmpegPath}`);
  } catch (e) {
    console.error("❌ | FFmpeg NOT found! Audio will not play.");
  }

  const player = new Player(client, {
    skipFFmpeg: false, // MANDATORY: Ensure transcoding is always active
    ytdlOptions: {
      quality: "highestaudio",
      highWaterMark: 1 << 25,
      filter: "audioonly",
      requestOptions: {
        headers: {
          "X-Youtube-PO-Token": process.env.PO_TOKEN || "",
          "X-Youtube-Visitor-Data": process.env.VISITOR_DATA || "",
        },
      },
    },
  });

  // Explicitly tell the player to use our ffmpeg-static binary
  if (ffmpeg) {
      player.scanDeps(); // Refresh dependencies
  }

  // --- Player Debug & Error Logging ---

  player.on("debug", (message) => {
    // Only log important debug messages to avoid spam
    if (message.includes("Error") || message.includes("fail") || message.includes("FFmpeg")) {
        console.log(`[Player Critical Debug] ${message}`);
    }
  });

  player.events.on("debug", (queue, message) => {
    console.log(`[Queue Debug] [${queue.guild.id}] ${message}`);
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
    console.log(`▶️ | Started playing: "${track.title}" in guild ${queue.guild.id}`);
    queue.metadata.channel.send(`🎶 | Now playing: **${track.title}**\n👤 | Requested by: <@${queue.metadata.author.id}>`);
  });

  player.events.on("emptyQueue", (queue) => {
    console.log(`💤 | Queue finished in guild ${queue.guild.id}`);
    queue.metadata.channel.send("💤 | Queue finished! Disconnecting...");
  });

  // Helper to prevent error spam (same error within 5 seconds)
  const shouldSendError = (guildId, errorMessage) => {
    const key = `${guildId}:${errorMessage}`;
    const now = Date.now();
    const lastSent = recentErrors.get(key);
    if (lastSent && now - lastSent < 5000) return false;
    recentErrors.set(key, now);
    return true;
  };

  player.events.on("error", (queue, error) => {
    console.error(`[Player Error] [${queue.guild.id}] CRITICAL: ${error.message}`);
    console.error(error.stack);
    if (shouldSendError(queue.guild.id, error.message)) {
      queue.metadata.channel.send(`❌ | Critical error: ${error.message}`);
    }
  });

  player.events.on("playerError", (queue, error) => {
    console.error(`[Playback Error] [${queue.guild.id}] EXCEPTION: ${error.message}`);
    console.error(error.stack);
    if (shouldSendError(queue.guild.id, error.message)) {
      queue.metadata.channel.send(`❌ | Playback failed: ${error.message}`);
    }
  });

  player.events.on("connectionError", (queue, error) => {
    console.error(`[Connection Error] [${queue.guild.id}] VOICE: ${error.message}`);
    if (shouldSendError(queue.guild.id, error.message)) {
      queue.metadata.channel.send(`❌ | Voice connection error: ${error.message}`);
    }
  });

  // Specifically catch extraction failures
  player.events.on("emptyChannel", (queue) => {
    console.log(`🔇 | Channel empty in ${queue.guild.id}, leaving.`);
  });

  return player;
};
