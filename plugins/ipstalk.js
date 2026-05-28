const axios = require('axios');

module.exports = {
    name: 'ipstalk',
    description: 'Lookup IP address information',
    aliases: ['iplookup', 'ipinfo', 'stalkip'],
    tags: ['tools'],
    command: /^\\.?(ipstalk|iplookup|ipinfo|stalkip)$/i,

    async execute(sock, m, args) {
        try {
            const ip = args[0];
            if (!ip) {
                return await m.reply('ᴘʀᴏᴠɪᴅᴇ ᴀɴ ɪᴘ ᴀᴅᴅʀᴇss!\n\nᴜsᴀɢᴇ: .ipstalk <ip>');
            }

            const res = await axios.get(`https://api.bk9.dev/stalk/ip?q=${ip}`);
            const d = res.data.BK9;

            if (!d || d.status !== 'success') {
                return await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ɪᴘ ɪɴꜰᴏ.');
            }

            const result = `┌─ム ɪᴘ sᴛᴀʟᴋᴇʀ
│
│ ᪣ ɪᴘ: ${d.ip}
│ ᪣ ᴄᴏɴᴛɪɴᴇɴᴛ: ${d.continent}
│ ᪣ ᴄᴏᴜɴᴛʀʏ: ${d.country} (${d.countryCode})
│ ᪣ ʀᴇɢɪᴏɴ: ${d.regionName}
│ ᪣ ᴄɪᴛʏ: ${d.city}
│ ᪣ ᴢɪᴘ: ${d.zip}
│ ᪣ ʟᴀᴛ/ʟᴏɴ: ${d.lat}, ${d.lon}
│ ᪣ ᴛɪᴍᴇᴢᴏɴᴇ: ${d.timezone}
│ ᪣ ᴄᴜʀʀᴇɴᴄʏ: ${d.currency}
│ ᪣ ɪsᴘ: ${d.isp}
│ ᪣ ᴏʀɢ: ${d.org}
│ ᪣ ᴀs: ${d.as}
│ ᪣ ʀᴇᴠᴇʀsᴇ: ${d.reverse || 'N/A'}
│ ᪣ ᴍᴏʙɪʟᴇ: ${d.mobile ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ᴘʀᴏxʏ: ${d.proxy ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ʜᴏsᴛɪɴɢ: ${d.hosting ? 'ʏᴇs' : 'ɴᴏ'}
│
│ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ
╰─────────◆────────╯`;

            await m.reply(result);
        } catch (error) {
            console.error('Error in ipstalk command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ɪᴘ ɪɴꜰᴏ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
