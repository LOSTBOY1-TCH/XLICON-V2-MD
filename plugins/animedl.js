const axios = require('axios');

module.exports = {
    name: 'animedl',
    description: 'Download anime by bilibili URL',
    aliases: ['anidl', 'getanime', 'downloadanime'],
    tags: ['anime'],
    command: /^\.?(animedl|anidl|getanime|downloadanime)$/i,

    async execute(sock, m, args) {
        try {
            const url = args[0];
            if (!url || !url.includes('bilibili')) {
                return await m.reply(
                    '┌─ム ᴀɴɪᴍᴇ ᴅᴏᴡɴʟᴏᴀᴅ\n│\n│ ᴜsᴀɢᴇ: .animedl <bilibili_url>\n│\n│ ᴛɪᴘ: ᴜsᴇ .animesearch ᴛᴏ ꜰɪɴᴅ\n│ ᴛʜᴇ ᴜʀʟ ᴛʜᴇɴ ᴛᴀᴘ ⬇️ ᴅᴏᴡɴʟᴏᴀᴅ\n╰─────────◆────────╯'
                );
            }

            await m.reply('⏳ ꜰᴇᴛᴄʜɪɴɢ ᴀɴɪᴍᴇ ɪɴꜰᴏ...');

            const res = await axios.get(
                `https://api-rebix.zone.id/api/anidl?url=${encodeURIComponent(url)}`,
                { timeout: 30000 }
            );

            const data = res.data;

            if (!data || data.status !== 200 || !data.result) {
                return await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ᴠɪᴅᴇᴏ ɪɴꜰᴏ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
            }

            const meta = data.result.metadata;
            const dl = data.result.download;
            const downloadUrl = dl?.url || dl?.link || dl?.file || null;
            const mimeType = dl?.type || 'video/mp4';

            const caption = `┌─ム ᴀɴɪᴍᴇ ᴅᴏᴡɴʟᴏᴀᴅ
│
│ ᪣ ᴛɪᴛʟᴇ: ${meta.title}
│ ᪣ ᴠɪᴇᴡs: ${meta.view}
│ ᪣ ʟɪᴋᴇs: ${meta.like}
│ ᪣ ʟᴏᴄᴀᴛɪᴏɴ: ${meta.locate?.toUpperCase() || 'N/A'}
│
│ > ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ
╰─────────◆────────╯`;

            let thumbBuffer = null;
            try {
                thumbBuffer = (await axios.get(meta.thumbnail, { responseType: 'arraybuffer', timeout: 15000 })).data;
            } catch {}

            if (!downloadUrl) {
                if (thumbBuffer) {
                    await m.reply(thumbBuffer, { caption: caption + '\n\n❌ ɴᴏ ᴅᴏᴡɴʟᴏᴀᴅ ʟɪɴᴋ ᴀᴠᴀɪʟᴀʙʟᴇ.' });
                } else {
                    await m.reply(caption + '\n\n❌ ɴᴏ ᴅᴏᴡɴʟᴏᴀᴅ ʟɪɴᴋ ᴀᴠᴀɪʟᴀʙʟᴇ.');
                }
                return;
            }

            await m.reply('📥 ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴠɪᴅᴇᴏ...');

            try {
                const fileBuffer = (await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                })).data;

                const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.split('/')[1] || 'mp4';
                const fileName = `${meta.title.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '_').slice(0, 60)}.${ext}`;

                await sock.sendMessage(m.from, {
                    document: fileBuffer,
                    fileName,
                    mimetype: mimeType,
                    caption,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363230794474148@newsletter',
                            newsletterName: '──𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                            serverMessageId: 1
                        }
                    }
                }, { quoted: m });

            } catch {
                const fallbackCaption = `${caption}\n\n🔗 ᴅɪʀᴇᴄᴛ ʟɪɴᴋ:\n${downloadUrl}`;
                if (thumbBuffer) {
                    await m.reply(thumbBuffer, { caption: fallbackCaption });
                } else {
                    await m.reply(fallbackCaption);
                }
            }

        } catch (error) {
            console.error('Error in animedl command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
