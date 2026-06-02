const LINK_REGEX = /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/|t\.me\/|discord\.gg\/|(?:youtube\.com|youtu\.be)\/|instagram\.com\/|(?:facebook\.com|fb\.com)\/|(?:x\.com|twitter\.com)\/)[^\s]*/i;

function normalizeJid(jid = '') {
    return String(jid).split(':')[0];
}

function initStore(groupId) {
    if (!global.antilinkDeleteStore) global.antilinkDeleteStore = {};
    if (!global.antilinkDeleteStore[groupId]) {
        global.antilinkDeleteStore[groupId] = {
            enabled: false
        };
    }
}

function getStore(groupId) {
    initStore(groupId);
    return global.antilinkDeleteStore[groupId];
}

function isExempt(m) {
    if (!m) return true;
    if (m.isOwner) return true;
    if (m.isAdmin) return true;
    if (m.isGroupOwner) return true;
    return false;
}

module.exports = {
    name: 'antilink',
    description: 'Delete messages with links only',
    tags: ['moderation'],

    async onMessage(sock, m) {
        try {
            if (!m.isGroup) return false;
            if (!m.body) return false;

            const groupId = m.from;
            const store = getStore(groupId);

            if (!store.enabled) return false;
            if (!LINK_REGEX.test(m.body)) return false;
            if (isExempt(m)) return false;

            // Delete message only
            if (m.isBotAdmin) {
                try {
                    await sock.sendMessage(groupId, { delete: m.key });
                } catch (e) {
                    console.error('AntiLink delete error:', e.message);
                }
            }

            return true;
        } catch (err) {
            console.error('AntiLink onMessage error:', err.message);
            return false;
        }
    },

    async execute(sock, m, args) {
        try {
            if (!m.isGroup) {
                return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ ɢʀᴏᴜᴘ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n│\n╰─────────◆────────╯');
            }

            if (!m.isAdmin && !m.isOwner) {
                return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ ᴀᴅᴍɪɴs ᴏɴʟʏ\n│\n╰─────────◆────────╯');
            }

            const groupId = m.from;
            const store = getStore(groupId);

            const rawBody = (m.body || '').trim().toLowerCase();
            const prefix = global.BOT_PREFIX || '.';

            // Check if this is the antilink command (not antilinkwarn or antilinkkick)
            if (!rawBody.startsWith(prefix + 'antilink') || 
                rawBody.startsWith(prefix + 'antilinkwarn') || 
                rawBody.startsWith(prefix + 'antilinkkick')) {
                return false;
            }

            const sub = args[0]?.toLowerCase();

            if (!sub || sub === 'status') {
                const status = store.enabled ? 'ᴏɴ' : 'ᴏꜰꜰ';
                return await m.reply(`┌─ม ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ${status}\n│\n│ ᴍᴏᴅᴇ: ᴅᴇʟᴇᴛᴇ ᴏɴʟʏ\n│\n╰─────────◆────────╯`);
            }

            if (sub === 'on') {
                store.enabled = true;
                return await m.reply('┌─ม ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏɴ\n│\n│ ʟɪɴᴋs ᴡɪʟʟ ʙᴇ ᴅᴇʟᴇᴛᴇᴅ\n│ ɴᴏ ᴡᴀʀɴɪɴɢs ᴏʀ ᴋɪᴄᴋs\n│\n╰─────────◆────────╯');
            }

            if (sub === 'off') {
                store.enabled = false;
                return await m.reply('┌─ม ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏꜰꜰ\n│\n╰─────────◆────────╯');
            }

            return await m.reply('┌─ม ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᴜsᴀɢᴇ:\n│ ᪣ .antilink on\n│ ᪣ .antilink off\n│ ᪣ .antilink (status)\n│\n╰─────────◆────────╯');

        } catch (err) {
            console.error('AntiLink execute error:', err.message);
            await m.reply('❌ ᴀɴᴛɪʟɪɴᴋ ᴇʀʀᴏʀ: ' + err.message);
        }
    }
};
