import { SlashCommandBuilder } from 'discord.js';

export const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or Spotify')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('The song title or URL')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for a song and pick from results')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('The song title')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show details of the current song'),
    new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the music volume')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The volume percentage (0-200)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(200)
        ),
    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and leave the voice channel'),
    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),
    new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the current song'),
    new SlashCommandBuilder()
        .setName('repeat')
        .setDescription('Set the repeat mode')
        .addIntegerOption(option =>
            option.setName('mode')
                .setDescription('0: Off, 1: Track, 2: Queue')
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: 0 },
                    { name: 'Track', value: 1 },
                    { name: 'Queue', value: 2 }
                )
        ),
    new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current queue'),
    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current music queue'),
    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a song from the queue')
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('The position of the song in the queue')
                .setRequired(true)
        ),
].map(command => command.toJSON());
