import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';

const prefix = '!!';

export const handleCommand = async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const player = useMainPlayer();
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    const { guildId, member, channel } = message;

    if (!member.voice.channel && commandName !== 'help') return message.reply('❌ | You must be in a voice channel!');

    const queue = player.nodes.get(guildId);

    const actions = {
        'help': () => {
            const embed = new EmbedBuilder()
                .setTitle('🎵 | Music Bot Help')
                .setDescription('All commands must start with the `!!` prefix.')
                .addFields(
                    { name: '💿 | Playback', value: '`!!play [query]` - Play a song or URL\n`!!search [query]` - Search and pick a song\n`!!pause` / `!!resume` - Pause/Resume playback\n`!!stop` - Stop and leave channel' },
                    { name: '⏭️ | Queue Control', value: '`!!skip` - Skip current song\n`!!shuffle` - Randomize queue\n`!!remove [index]` - Remove a specific song\n`!!queue` - View upcoming songs' },
                    { name: '🔊 | Settings', value: '`!!volume [0-200]` - Adjust volume\n`!!repeat [0-2]` - 0: Off, 1: Track, 2: Queue\n`!!nowplaying` - Show current song details' }
                )
                .setColor('#5865F2')
                .setFooter({ text: 'Prefix: !!' });
            return message.reply({ embeds: [embed] });
        },
        'play': async () => {
            const query = args.join(' ');
            if (!query) return message.reply('❌ | Please provide a song!');
            const msg = await message.reply(`🔍 | Searching for **${query}**...`);
            try {
                const { track } = await player.play(member.voice.channel, query, {
                    nodeOptions: {
                        metadata: { channel, author: message.author },
                        leaveOnEmpty: true, bufferingTimeout: 15000, selfDeaf: true,
                        volume: 100, inlineVolume: true, disableVbr: true,
                        // --- High Quality Audio Settings ---
                        resamplerOptions: {
                            resampleAntialiasing: true,
                            filterSize: 32,
                        },
                        encoderArgs: ['-b:a', '192k', '-ar', '48000', '-ac', '2'],
                    }
                });
                return msg.edit(`🎶 | Added **${track.title}** to queue!`);
            } catch (e) { return msg.edit(`❌ | Error: ${e.message}`); }
        },
        'search': async () => {
            const query = args.join(' ');
            if (!query) return message.reply('❌ | Provide a search query!');
            const results = await player.search(query, { requestedBy: message.author, searchEngine: QueryType.AUTO });
            if (!results.hasTracks()) return message.reply('❌ | No results found!');
            
            const tracks = results.tracks.slice(0, 10);
            const menu = new StringSelectMenuBuilder()
                .setCustomId('search-select')
                .setPlaceholder('Choose a song to play')
                .addOptions(tracks.map((t, i) => new StringSelectMenuOptionBuilder().setLabel(`${i+1}. ${t.title}`.slice(0, 100)).setValue(t.url)));

            const row = new ActionRowBuilder().addComponents(menu);
            const response = await message.reply({ content: `🔎 | Results for **${query}**:`, components: [row] });

            const collector = response.createMessageComponentCollector({ time: 30000 });
            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) return i.reply({ content: '❌ | This is not your search!', ephemeral: true });
                await i.deferUpdate();
                await player.play(member.voice.channel, i.values[0], { nodeOptions: { metadata: { channel, author: message.author } } });
                await response.edit({ content: `🎶 | Playing selected song!`, components: [] });
                collector.stop();
            });
        },
        'nowplaying': () => {
            if (!queue || !queue.isPlaying()) return message.reply('❌ | Nothing is playing!');
            const track = queue.currentTrack;
            const progress = queue.node.createProgressBar();
            const embed = new EmbedBuilder()
                .setTitle(track.title).setURL(track.url).setThumbnail(track.thumbnail).setColor('#5865F2')
                .addFields(
                    { name: 'Author', value: track.author, inline: true },
                    { name: 'Duration', value: track.duration, inline: true },
                    { name: 'Requested By', value: `<@${track.requestedBy.id}>`, inline: true },
                    { name: 'Progress', value: progress }
                );
            return message.reply({ embeds: [embed] });
        },
        'volume': () => {
            if (!queue) return message.reply('❌ | No music playing!');
            const vol = parseInt(args[0]);
            if (isNaN(vol) || vol < 0 || vol > 200) return message.reply('❌ | 0-200% only!');
            queue.node.setVolume(vol);
            return message.reply(`🔊 | Volume set to **${vol}%**!`);
        },
        'repeat': () => {
            if (!queue) return message.reply('❌ | No music playing!');
            const mode = parseInt(args[0]); 
            if (![0, 1, 2].includes(mode)) return message.reply('❌ | 0 (Off), 1 (Track), 2 (Queue)!');
            queue.setRepeatMode(mode);
            const labels = ['OFF', 'TRACK', 'QUEUE'];
            return message.reply(`🔁 | Repeat mode set to **${labels[mode]}**!`);
        },
        'shuffle': () => {
            if (!queue) return message.reply('❌ | No music playing!');
            queue.tracks.shuffle();
            return message.reply('🔀 | Queue shuffled!');
        },
        'skip': () => { queue?.node.skip(); return message.reply('⏭️ | Skipped!'); },
        'pause': () => { queue?.node.setPaused(true); return message.reply('⏸️ | Paused!'); },
        'resume': () => { queue?.node.setPaused(false); return message.reply('▶️ | Resumed!'); },
        'stop': () => { queue?.delete(); return message.reply('🛑 | Stopped!'); },
        'queue': () => {
            if (!queue || !queue.tracks.size) return message.reply('❌ | Queue empty!');
            const list = queue.tracks.map((t, i) => `${i + 1}. **${t.title}**`).slice(0, 10).join('\n');
            return message.reply(`📋 | **Queue:**\n${list}`);
        },
        'remove': () => {
            if (!queue) return message.reply('❌ | No music playing!');
            const index = parseInt(args[0]) - 1;
            if (isNaN(index) || index < 0 || index >= queue.tracks.size) return message.reply('❌ | Invalid position!');
            const track = queue.tracks.toArray()[index];
            queue.node.remove(track);
            return message.reply(`🗑️ | Removed **${track.title}**!`);
        }
    };

    if (actions[commandName]) await actions[commandName]();
};
