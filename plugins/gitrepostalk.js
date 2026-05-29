const axios = require('axios');

module.exports = {
    name: 'gitrepostalk',
    description: 'Lookup GitHub repository information',
    aliases: ['githubrepo', 'grs', 'grepo'],
    tags: ['stalker'],
    command: /^\.?(gitrepostalk|githubrepo|ghrepo|grepo)$/i,

    async execute(sock, m, args) {
        try {
            const repoUrl = args[0];
            if (!repoUrl) {
                return await m.reply('ᴘʀᴏᴠɪᴅᴇ ᴀ ɢɪᴛʜᴜʙ ʀᴇᴘᴏ ᴜʀʟ!\n\nᴜsᴀɢᴇ: .gitrepostalk <repo_url>');
            }

            const res = await axios.get(`https://api.bk9.dev/stalk/githubrepo?url=${encodeURIComponent(repoUrl)}`);
            const d = res.data.BK9;

            if (!d || !d.name) {
                return await m.reply('❌ ʀᴇᴘᴏ ɴᴏᴛ ꜰᴏᴜɴᴅ ᴏʀ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ.');
            }

            const ownerAvatar = d.owner?.avatar_url;

            const caption = `┌─ム ɢɪᴛʜᴜʙ ʀᴇᴘᴏ sᴛᴀʟᴋᴇʀ
│
│ ᪣ ɴᴀᴍᴇ: ${d.name}
│ ᪣ ꜰᴜʟʟ ɴᴀᴍᴇ: ${d.full_name}
│ ᪣ ᴏᴡɴᴇʀ: ${d.owner?.login || 'N/A'}
│ ᪣ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ: ${d.description || 'N/A'}
│ ᪣ ʟᴀɴɢᴜᴀɢᴇ: ${d.language || 'N/A'}
│ ᪣ ᴠɪsɪʙɪʟɪᴛʏ: ${d.visibility}
│ ᪣ ʜᴏᴍᴇᴘᴀɢᴇ: ${d.homepage || 'N/A'}
│ ᪣ sᴛᴀʀs: ${d.stargazers_count}
│ ᪣ ᴡᴀᴛᴄʜᴇʀs: ${d.watchers_count}
│ ᪣ ꜰᴏʀᴋs: ${d.forks_count}
│ ᪣ ᴏᴘᴇɴ ɪssᴜᴇs: ${d.open_issues_count}
│ ᪣ ᴅᴇꜰᴀᴜʟᴛ ʙʀᴀɴᴄʜ: ${d.default_branch}
│ ᪣ sɪᴢᴇ: ${d.size} KB
│ ᪣ ꜰᴏʀᴋ: ${d.fork ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ᴀʀᴄʜɪᴠᴇᴅ: ${d.archived ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ᴅɪsᴀʙʟᴇᴅ: ${d.disabled ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ʜᴀs ɪssᴜᴇs: ${d.has_issues ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ʜᴀs ᴡɪᴋɪ: ${d.has_wiki ? 'ʏᴇs' : 'ɴᴏ'}
│ ᪣ ᴄʟᴏɴᴇ ᴜʀʟ: ${d.clone_url}
│ ᪣ ᴄʀᴇᴀᴛᴇᴅ: ${new Date(d.created_at).toLocaleDateString('en-GB')}
│ ᪣ ᴜᴘᴅᴀᴛᴇᴅ: ${new Date(d.updated_at).toLocaleDateString('en-GB')}
│ ᪣ ʟɪɴᴋ: ${d.html_url}
│
│ > ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ
╰─────────◆────────╯`;

            if (ownerAvatar) {
                const avatarBuffer = (await axios.get(ownerAvatar, { responseType: 'arraybuffer' })).data;
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
            } else {
                await m.reply(caption);
            }
        } catch (error) {
            console.error('Error in gitrepostalk command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ʀᴇᴘᴏ ɪɴꜰᴏ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
