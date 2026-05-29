const axios = require('axios');
const { sendInteractiveMessage } = require('gifted-btns');

const sessions = new Map();

async function sendSlide(sock, m, results, index, jid) {
    const item = results[index];
    const total = results.length;

    const caption = `┌─ム ᴀɴɪᴍᴇ sᴇᴀʀᴄʜ ʀᴇsᴜʟᴛs
│
│ ᪣ [${index + 1}/${total}] ʀᴇsᴜʟᴛs ꜰᴏᴜɴᴅ: ${total}
│ ᪣ ᴛɪᴛʟᴇ: ${item.title}
│ ᪣ ᴅᴜʀᴀᴛɪᴏɴ: ${item.duration}
│ ᪣ ᴠɪᴇᴡs: ${item.views}
│ ᪣ ᴀᴜᴛʜᴏʀ: ${item.author?.name || 'N/A'}
│ ᪣ ʟɪɴᴋ: ${item.url}
│
│ > ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ
╰─────────◆────────╯`;

    const buttons = [];

    if (index > 0) {
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: '◀ ᴘʀᴇᴠ',
                id: `anisearch_prev_${jid}`
            })
        });
    }

    if (index < total - 1) {
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: 'ɴᴇxᴛ ▶',
                id: `anisearch_next_${jid}`
            })
        });
    }

    buttons.push({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: '⬇️ ᴅᴏᴡɴʟᴏᴀᴅ',
            id: `${global.BOT_PREFIX || '.'}animedl ${item.url}`
        })
    });

    buttons.push({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: '❌ ᴄʟᴏsᴇ',
            id: `anisearch_close_${jid}`
        })
    });

    try {
        const thumbBuffer = (await axios.get(item.tumbnail, { responseType: 'arraybuffer' })).data;

        await sendInteractiveMessage(sock, m.from, {
            image: thumbBuffer,
            title: `ム [${index + 1}/${total}] ${item.title}`,
            text: caption,
            footer: `ᴀɴɪᴍᴇ sᴇᴀʀᴄʜ • ${total} ʀᴇsᴜʟᴛs`,
            interactiveButtons: buttons
        });
    } catch {
        await m.reply(caption);
    }
}

module.exports = {
    name: 'animesearch',
    description: 'Search anime with slide results',
    aliases: ['anisearch', 'searchanime', 'findanime'],
    tags: ['anime'],
    command: /^\.?(animesearch|anisearch|searchanime|findanime)$/i,

    async execute(sock, m, args) {
        try {
            const query = args.join(' ');
            if (!query) {
                return await m.reply('ᴘʀᴏᴠɪᴅᴇ ᴀɴ ᴀɴɪᴍᴇ ɴᴀᴍᴇ!\n\nᴜsᴀɢᴇ: .animesearch <name>');
            }

            await m.reply('🔍 sᴇᴀʀᴄʜɪɴɢ ᴀɴɪᴍᴇ...');

            const res = await axios.get(`https://api-rebix.zone.id/api/anisearch?q=${encodeURIComponent(query)}`);
            const results = res.data?.result;

            if (!results || results.length === 0) {
                return await m.reply('❌ ɴᴏ ʀᴇsᴜʟᴛs ꜰᴏᴜɴᴅ ꜰᴏʀ: ' + query);
            }

            const jid = m.sender?.split('@')[0] || m.from;
            sessions.set(jid, { results, index: 0, from: m.from });

            await sendSlide(sock, m, results, 0, jid);

        } catch (error) {
            console.error('Error in animesearch command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ sᴇᴀʀᴄʜ ᴀɴɪᴍᴇ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    },

    async onButton(sock, m, body) {
        const jid = m.sender?.split('@')[0] || m.from;

        if (body === `anisearch_close_${jid}`) {
            sessions.delete(jid);
            return await m.reply('✅ sᴇᴀʀᴄʜ sᴇssɪᴏɴ ᴄʟᴏsᴇᴅ.');
        }

        const session = sessions.get(jid);
        if (!session) return;

        if (body === `anisearch_next_${jid}`) {
            session.index = Math.min(session.index + 1, session.results.length - 1);
        } else if (body === `anisearch_prev_${jid}`) {
            session.index = Math.max(session.index - 1, 0);
        } else {
            return;
        }

        sessions.set(jid, session);
        await sendSlide(sock, m, session.results, session.index, jid);
    }
};
