const axios = require('axios');

module.exports = {
    name: 'dragonball',
    description: 'Generate Dragon Ball style text effect',
    aliases: ['db', 'dbz', 'dragonballz'],
    tags: ['maker'],
    command: /^\.?(dragonball|db|dbz|dragonballz)$/i,

    async execute(sock, m, args) {
        try {
            const text = args.join(' ');
            if (!text) {
                return await m.reply('ᴘʀᴏᴠɪᴅᴇ ᴛᴇxᴛ!\n\nᴜsᴀɢᴇ: .dragonball <text>');
            }

            await m.reply('⏳ ɢᴇɴᴇʀᴀᴛɪɴɢ ᴅʀᴀɢᴏɴ ʙᴀʟʟ ᴛᴇxᴛ...');

            const res = await axios.get(`https://api.bk9.dev/maker/ephoto-1?text=${encodeURIComponent(text)}&url=https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html`);

            if (!res.data.status || !res.data.BK9) {
                return await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ɪᴍᴀɢᴇ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
            }

            const imageBuffer = (await axios.get(res.data.BK9, { responseType: 'arraybuffer' })).data;

            const caption = `┌─ム ᴅʀᴀɢᴏɴ ʙᴀʟʟ ᴛᴇxᴛ ᴇꜰꜰᴇᴄᴛ
│
│ ᪣ ᴛᴇxᴛ: ${text}
│
│ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ
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
            console.error('Error in dragonball command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ɪᴍᴀɢᴇ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
