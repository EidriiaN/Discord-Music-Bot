# 2026 Discord Music Bot (High-Stability Edition)

A professional-grade Discord music bot architected for the strict API environment of 2026. This bot is optimized for crystal-clear audio, extreme stability against YouTube blocks, and a classic prefix-based user experience.

## 🚀 Key Features

- **High-Fidelity Audio**: 192kbps bitrate, 48kHz native sampling, and CBR (Constant Bitrate) for studio-quality sound.
- **Jitter-Free Playback**: Massive 32MB PassThrough buffer to survive network fluctuations.
- **2026 YouTube Bypass**: Injects browser-extracted `PO_TOKEN`, `VISITOR_DATA`, and `cookies.txt` to bypass "Sign-in required" errors.
- **Classic UX**: Strict `!!` prefix system with a beautiful `!!help` menu and interactive dropdowns for `!!search`.
- **DAVE Protocol**: Fully compatible with the newest Discord End-to-End Encryption (E2EE) voice servers.

## 🛠️ Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file with your credentials:
- `DISCORD_TOKEN`: Your bot token from the [Discord Developer Portal](https://discord.com/developers/applications).
- `CLIENT_ID`: Your bot's Application ID.
- `PO_TOKEN`: Your manually extracted Proof-of-Origin token.
- `VISITOR_DATA`: Your manually extracted Visitor Data.

### 3. YouTube Authentication
1. **Cookies**: Export your YouTube session as `cookies.txt` into the root project folder.
2. **Tokens**: See `development.md` for instructions on extracting `PO_TOKEN` and `VISITOR_DATA` from your browser.

### 4. Usage
```bash
node src/index.js
```

## 🕹️ Command List (Prefix: `!!`)

| Command | Description |
| :--- | :--- |
| `!!help` | Shows the categorized help menu |
| `!!play [query]` | Searches and plays music from YouTube/Spotify |
| `!!search [query]` | Search and pick from 10 results via a Dropdown Menu |
| `!!nowplaying` | Shows rich details and a dynamic progress bar |
| `!!queue` | Lists the upcoming 10 tracks |
| `!!volume [0-200]` | Adjusts the internal bot gain |
| `!!skip` / `!!stop` | Skips the current track or stops the player |
| `!!pause` / `!!resume` | Pauses or resumes playback |
| `!!repeat [0-2]` | Set loop mode (0: Off, 1: Track, 2: Queue) |
| `!!shuffle` | Randomizes the current queue |
| `!!remove [index]` | Removes a specific track by its position |

## ⚠️ Stability Maintenance
If playback fails with a "Signature decipher" or "403 Forbidden" error, your `PO_TOKEN` or `cookies.txt` have likely expired. Refresh them from a fresh browser session to restore service.
