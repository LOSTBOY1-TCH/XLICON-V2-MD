const axios = require('axios');

module.exports = {
    name: 'gituserstalk',
    description: 'Lookup GitHub user information',
    aliases: ['githubuser', 'gus', 'guser'],
    tags: ['stalker'],
    command: /^\.?(gituserstalk|githubuser|ghuser|guser)$/i,

    async execute(sock, m, args) {
        try {
            const username = args[0];
            if (!username) {
                return await m.reply('ᴘʀᴏᴠɪᴅᴇ ᴀ ɢɪᴛʜᴜʙ ᴜsᴇʀɴᴀᴍᴇ!\n\nᴜsᴀɢᴇ: .gituserstalk <username>');
            }

            const res = await axios.get(`https://api.bk9.dev/stalk/githubuser?q=${username}`);
            const d = res.data.BK9;

            if (!d || !d.login) {
                return await m.reply('❌ ᴜsᴇʀ ɴᴏᴛ ꜰᴏᴜɴᴅ ᴏʀ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ.');
            }

            const caption = `┌─ム ɢɪᴛʜᴜʙ ᴜsᴇʀ sᴛᴀʟᴋᴇʀ
│
│ ᪣ ᴜsᴇʀɴᴀᴍᴇ: ${d.login}
│ ᪣ ɴᴀᴍᴇ: ${d.name || 'N/A'}
│ ᪣ ɪᴅ: ${d.id}
│ ᪣ ᴛʏᴘᴇ: ${d.type}
│ ᪣ ᴄᴏᴍᴘᴀɴʏ: ${d.company || 'N/A'}
│ ᪣ ʙʟᴏɢ: ${d.blog || 'N/A'}
│ ᪣ ʟᴏᴄᴀᴛɪᴏɴ: ${d.location || 'N/A'}
│ ᪣ ʙɪᴏ: ${d.bio || 'N/A'}
│ ᪣ ᴛᴡɪᴛᴛᴇʀ: ${d.twitter_username || 'N/A'}
│ ᪣ ᴘᴜʙʟɪᴄ ʀᴇᴘᴏs: ${d.public_repos}
│ ᪣ ᴘᴜʙʟɪᴄ ɢɪsᴛs: ${d.public_gists}
│ ᪣ ꜰᴏʟʟᴏᴡᴇʀs: ${d.followers}
│ ᪣ ꜰᴏʟʟᴏᴡɪɴɢ: ${d.following}
│ ᪣ sɪᴛᴇ ᴀᴅᴍɪɴ: ${d.site_admin ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ᴄʀᴇᴀᴛᴇᴅ: ${new Date(d.created_at).toLocaleDateString('en-GB')}
│ ᪣ ᴜᴘᴅᴀᴛᴇᴅ: ${new Date(d.updated_at).toLocaleDateString('en-GB')}
│ ᪣ ᴘʀᴏꜰɪʟᴇ: ${d.html_url}
│
│ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ
╰─────────◆────────╯`;

            const avatarBuffer = (await axios.get(d.avatar_url, { responseType: 'arraybuffer' })).data;

            await m.reply(avatarBuffer, {
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
            console.error('Error in gituserstalk command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ɢɪᴛʜᴜʙ ᴜsᴇʀ ɪɴꜰᴏ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
