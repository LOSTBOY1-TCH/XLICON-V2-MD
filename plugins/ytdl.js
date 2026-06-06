const axios = require('axios');
const yts = require('yt-search');

module.exports = {

    name: 'ytdl',
    description: 'Download YouTube audio (link or search)',
    aliases: ['ytmp3', 'ytaudio', 'ytdlv3'],
    tags: ['downloader'],
    command: /^.?(ytdl|ytmp3|ytaudio|ytdlv3)/i,

    async execute(sock, m, args) {
        try {

            if (!args[0]) {
                return m.reply('Usage:\n.ytdl <youtube link>\n.ytdl <search query>');
            }

            await m.react('⏳');

            let input = args.join(' ').trim();
            let finalUrl = input;

            if (!input.includes('youtube.com') && !input.includes('youtu.be')) {
                const results = await yts(input);

                if (!results || !results.videos || results.videos.length === 0) {
                    await m.react('❌');
                    return m.reply('❌ ɴᴏ ʀᴇsᴜʟᴛs ғᴏᴜɴᴅ ᴏɴ ʏᴏᴜᴛᴜʙᴇ.');
                }

                finalUrl = results.videos[0].url;
            }

            const apiUrl = `https://api.bk9.dev/download/youtube2?url=${encodeURIComponent(finalUrl)}`;
            const apiRes = await axios.get(apiUrl, { timeout: 30000 });
            const data = apiRes.data;

            if (!data || !data.status) {
                await m.react('❌');
                return m.reply(`❌ ᴀᴘɪ ᴇʀʀᴏʀ: ${data?.message || 'Unknown error'}`);
            }

            const bk9 = data.BK9 || data;

            const downloadUrl = bk9.downloadUrl || bk9.dl_url || bk9.audio || bk9.url || bk9.link;
            const title       = bk9.title       || bk9.name   || 'Audio';
            const thumbnail   = bk9.thumbnail   || bk9.thumb  || bk9.image || null;
            const filename    = bk9.filename    || bk9.file   || `${title}.mp3`;

            if (!downloadUrl) {
                await m.react('❌');
                return m.reply('❌ ᴄᴏᴜʟᴅ ɴᴏᴛ ʀᴇᴛʀɪᴇᴠᴇ ᴅᴏᴡɴʟᴏᴀᴅ ʟɪɴᴋ.');
            }

            const audioRes = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 60000
            });

            const buffer = Buffer.from(audioRes.data);

            const quotedMsg = m.quoted || {
                key: {
                    remoteJid: m.from,
                    fromMe: false,
                    id: m.id,
                    participant: m.sender
                },
                message: {
                    extendedTextMessage: {
                        text: m.body
                    }
                }
            };

            await m.react('✅');

            await sock.sendMessage(
                m.from,
                {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    fileName: filename,
                    ptt: false,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363230794474148@newsletter',
                            newsletterName: '𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                            serverMessageId: 1
                        },
                        externalAdReply: {
                            title: title,
                            body: 'Powered by XLICON',
                            thumbnailUrl: thumbnail,
                            mediaType: 1,
                            mediaUrl: finalUrl,
                            sourceUrl: finalUrl,
                            renderLargerThumbnail: true,
                            showAdAttribution: false
                        }
                    }
                },
                { quoted: quotedMsg }
            );

        } catch (err) {
            console.error('❌ YTDL error:', err.response?.data || err.message);
            await m.react('❌');
            await m.reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴘʀᴏᴄᴇss ʀᴇQᴜᴇsᴛ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
        }
    }

};
