const axios = require('axios');

module.exports = {
    name: 'marvel',
    description: 'Generate Marvel style logo text effect',
    aliases: ['marvellogo', 'mv'],
    tags: ['maker'],
    command: /^\.?(marvel|marvellogo|mv)$/i,

    async execute(sock, m, args) {
        try {
            const input = args.join(' ');
            if (!input) {
                return await m.reply('ᴘʀᴏᴠɪᴅᴇ ᴛᴇxᴛ!\n\nᴜsᴀɢᴇ: .marvel <text1> | <text2>');
            }

            const parts = input.split('|');
            const text = parts[0]?.trim() || input;
            const text2 = parts[1]?.trim() || '';

            await m.reply('⏳ ɢᴇɴᴇʀᴀᴛɪɴɢ ᴍᴀʀᴠᴇʟ ᴛᴇxᴛ...');

            const res = await axios.get(`https://api.bk9.dev/maker/ephoto-2?text=${encodeURIComponent(text)}&text2=${encodeURIComponent(text2)}&url=https://en.ephoto360.com/create-marvel-style-logo-419.html`);

            if (!res.data.status || !res.data.BK9) {
                return await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ɪᴍᴀɢᴇ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
            }

            const imageBuffer = (await axios.get(res.data.BK9, { responseType: 'arraybuffer' })).data;

            const caption = `┌─ム ᴍᴀʀᴠᴇʟ sᴛʏʟᴇ ʟᴏɢᴏ
│
│ ᪣ ᴛᴇxᴛ 1: ${text}
│ ᪣ ᴛᴇxᴛ 2: ${text2 || 'N/A'}
│
│ > ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ
╰─────────◆────────╯`;

            await m.reply(imageBuffer, {
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
            });
        } catch (error) {
            console.error('Error in marvel command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ɪᴍᴀɢᴇ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
