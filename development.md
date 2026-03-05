# Development Journey: 2026 Discord Music Bot

This document outlines the technical challenges, architectural decisions, and the development timeline of the High-Stability Music Bot.

## 🛠️ The Challenge: 2026 YouTube Restrictions

The landscape for Discord bots in 2026 is defined by YouTube's aggressive detection of third-party players. Traditional extractors like `ytdl-core` are no longer viable. We faced two major obstacles during development:

1.  **Signature Deciphering Errors**: YouTube now requires a Proof-of-Origin (PO) token to authorize audio streams.
2.  **Memory Heap Limits**: Automated PO-token generators use heavy browser emulators (jsdom), which crashed the Node.js process during startup.

## 🧱 Architectural Decisions

### 1. The Secure Bypass Pivot
Instead of relying on unstable automated generators, we pivoted to a **Manual Extraction & Injection Strategy**. 
- **The Gain**: 100% stability and zero memory overhead.
- **The Method**: Users extract `PO_TOKEN` and `VISITOR_DATA` from a real browser's Network tab. These are then injected into the `yt-dlp` backend via `--extractor-args`.

### 2. Audio Quality Refactoring
To eliminate stuttering on unstable connections, we moved from Variable Bitrate (VBR) to **Constant Bitrate (CBR)**.
- **Settings**: Forced 192kbps and 48kHz (Discord's native sample rate) to avoid transcoding artifacts.
- **Buffer**: Implemented a 32MB PassThrough jitter buffer (`highWaterMark`) to survive network drops.

### 3. Transition to Classic Prefix System
While slash commands are the modern standard, the requirement for a **strict `!!` prefix system** was implemented to provide a "Classic Discord" feel.
- **Intents**: Enabled `GatewayIntentBits.MessageContent` and `GuildMessages`.
- **Hybrid Support**: The backend still supports interaction handlers, but the primary user interface is entirely prefix-driven.

## ⏱️ Development Timeline

- **Scaffolding**: Initialized ESM project with `discord.js` and `discord-player`.
- **Bypass Implementation**:
    - Integrated `YoutubeiExtractor` for authenticated extraction.
    - Added `cookies.txt` support for Netscape cookie files.
    - Encountered "Heap out of memory" error with automated generators.
    - **Resolution**: Implemented manual token extraction guide.
- **Command Set Expansion**:
    - Added JMusicBot-style commands (`!!search`, `!!nowplaying`, `!!shuffle`, `!!repeat`).
    - Integrated Discord UI components (Dropdowns/Select Menus) into the prefix search command.
- **Audio Overhaul**:
    - Fixed low-volume bug by correcting the 0-100 internal volume scale.
    - Optimized FFmpeg encoder arguments for 2026 standards.
- **Voice Server Fix**: Integrated `@snazzah/davey` to support Discord's new DAVE voice protocol.

## 🔍 How to Extract Tokens (2026 Method)
If the bot fails, follow these steps to refresh the tokens:
1. Open Chrome Incognito -> YouTube -> Start any video.
2. **F12** -> Network tab -> Filter for `player`.
3. Select the `player?key=...` request.
4. Go to the **Payload** tab.
5. Copy `context.client.visitorData` and `serviceIntegrityDimensions.poToken` to your `.env`.

---
*Created by Gemini CLI - March 2026*
