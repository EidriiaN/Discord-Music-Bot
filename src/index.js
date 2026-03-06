import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { setupPlayer } from "./player.js";
import { handleCommand } from "./commandHandler.js";

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  console.error("❌ | Missing DISCORD_TOKEN in .env");
  process.exit(1);
}

// Global process error handling
process.on("uncaughtException", (err) => console.error("🔥 | Uncaught Exception:", err));
process.on("unhandledRejection", (reason, promise) => console.error("🔥 | Unhandled Rejection:", reason));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once("ready", async () => {
  // Setup the player after client is ready
  await setupPlayer(client);
  console.log(`🤖 | Bot ready as ${client.user.tag} (Prefix: !!)`);

  // Handle Prefix Commands (!!) - only after player is ready
  client.on("messageCreate", handleCommand);
});

client.login(DISCORD_TOKEN);
