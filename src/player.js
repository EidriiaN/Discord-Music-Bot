import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { readFileSync, existsSync } from 'fs';
import 'dotenv/config';

export const setupPlayer = async (client) => {
    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25, // Large initial buffer
            filter: 'audioonly',
            format: 'bestaudio/best', // Force best quality audio stream
            requestOptions: {
                headers: {
                    "X-Youtube-PO-Token": process.env.PO_TOKEN || '',
                    "X-Youtube-Visitor-Data": process.env.VISITOR_DATA || ''
                }
            }
        },
        // --- 2026 Audio Stability Fixes ---
        skipFFmpeg: false, // Ensure we use FFmpeg for processing
    });

    // Load cookies from file if it exists
    let cookiesPath = '';
    if (existsSync('./cookies.txt')) {
        cookiesPath = './cookies.txt';
        console.log('✅ | cookies.txt detected for YouTube.');
    }

    // Load Default Extractors
    console.log('📦 | Loading Stable Extractors...');
    await player.extractors.loadMulti(DefaultExtractors);

    // Force YouTube extractor to use our cookies and specific 2026 args
    const youtubeExtractor = player.extractors.get('youtube');
    if (youtubeExtractor) {
        youtubeExtractor.options = {
            ...youtubeExtractor.options,
            cookies: cookiesPath,
            ytLibArgs: [
                '--extractor-args', 
                `youtube:po_token=${process.env.PO_TOKEN},visitor_data=${process.env.VISITOR_DATA}`
            ]
        };
    }

    // --- Player Events ---

    player.events.on('playerStart', (queue, track) => {
        queue.metadata.channel.send(`🎶 | Now playing: **${track.title}**\n👤 | Requested by: <@${queue.metadata.author.id}>`);
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata.channel.send('💤 | Queue finished! Disconnecting...');
    });

    player.events.on('error', (queue, error) => {
        console.error(`[Player Error] ${error.message}`);
        if (!queue.metadata.channel) return;
        queue.metadata.channel.send(`❌ | Critical error: ${error.message}`);
    });

    player.events.on('playerError', (queue, error) => {
        console.error(`[Playback Error] ${error.message}`);
        if (!queue.metadata.channel) return;
        queue.metadata.channel.send(`❌ | Playback failed: ${error.message}`);
    });

    return player;
};
