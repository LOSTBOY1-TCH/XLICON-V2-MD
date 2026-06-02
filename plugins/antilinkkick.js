const LINK_REGEX = /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/|t\.me\/|discord\.gg\/|(?:youtube\.com|youtu\.be)\/|instagram\.com\/|(?:facebook\.com|fb\.com)\/|(?:x\.com|twitter\.com)\/)[^\s]*/i;

function normalizeJid(jid = '') {
    return String(jid).split(':')[0];
}

function initStore(groupId) {
    if (!global.antilinkKickStore) global.antilinkKickStore = {};
    if (!global.antilinkKickStore[groupId]) {
        global.antilinkKickStore[groupId] = {
            enabled: false
        };
    }
}

function getStore(groupId) {
    initStore(groupId);
    return global.antilinkKickStore[groupId];
}

function isExempt(m) {
    if (!m) return true;
    if (m.isOwner) return true;
    if (m.isAdmin) return true;
    if (m.isGroupOwner) return true;
    return false;
}

async function resolveKickJid(sock, groupId, sender) {
    try {
        const meta = await sock.groupMetadata(groupId).catch(() => null);
        if (!meta) return null;
        const senderNorm = normalizeJid(sender);
        const participant = meta.participants.find(p => normalizeJid(p.id || p.jid || '') === senderNorm);
        if (!participant) return null;
        return participant.phoneNumber || participant.id || null;
    } catch (e) {
        return null;
    }
}

async function kickUser(sock, groupId, sender) {
    try {
        let targetJid = await resolveKickJid(sock, groupId, sender);
        if (!targetJid) {
            targetJid = normalizeJid(sender) + '@s.whatsapp.net';
        }
        if (targetJid.includes(':')) {
            targetJid = targetJid.split(':')[0] + '@s.whatsapp.net';
        }
        if (!targetJid.includes('@')) {
            targetJid = targetJid + '@s.whatsapp.net';
        }
        await sock.groupParticipantsUpdate(groupId, [targetJid], 'remove');
        return true;
    } catch (e) {
        console.error('AntiLinkKick error:', e.message);
        return false;
    }
}

module.exports = {
    name: 'antilinkkick',
    description: 'Delete messages with links and kick instantly',
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

            const senderNumber = (m.sender || '').split('@')[0].split(':')[0];

            // Delete message first
            if (m.isBotAdmin) {
                try {
                    await sock.sendMessage(groupId, { delete: m.key });
                } catch (e) {
                    console.error('AntiLinkKick delete error:', e.message);
                }
            }

            // Kick instantly - no warnings, no counter
            if (m.isBotAdmin) {
                await kickUser(sock, groupId, m.sender);
                const kickCard = `┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ ᴜsᴇʀ: @${senderNumber}\n│ ᪣ ᴀᴄᴛɪᴏɴ: ᴋɪᴄᴋᴇᴅ\n│\n│ sᴇɴᴛ ᴀ ʟɪɴᴋ ᴀɴᴅ ᴡᴀs ʀᴇᴍᴏᴠᴇᴅ\n│ ɪɴsᴛᴀɴᴛʟʏ\n│\n╰─────────◆────────╯`;
                await sock.sendMessage(groupId, {
                    text: kickCard,
                    mentions: [m.sender]
                });
            } else {
                const noAdminCard = `┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ ʙᴏᴛ ɴᴏᴛ ᴀᴅᴍɪɴ\n│\n│ ᴄᴀɴɴᴏᴛ ᴋɪᴄᴋ ᴜsᴇʀ\n│\n╰─────────◆────────╯`;
                await sock.sendMessage(groupId, { text: noAdminCard });
            }

            return true;
        } catch (err) {
            console.error('AntiLinkKick onMessage error:', err.message);
            return false;
        }
    },

    async execute(sock, m, args) {
        try {
            if (!m.isGroup) {
                return await m.reply('┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ ɢʀᴏᴜᴘ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n│\n╰─────────◆────────╯');
            }

            if (!m.isAdmin && !m.isOwner) {
                return await m.reply('┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ ᴀᴅᴍɪɴs ᴏɴʟʏ\n│\n╰─────────◆────────╯');
            }

            const groupId = m.from;
            const store = getStore(groupId);

            const rawBody = (m.body || '').trim().toLowerCase();
            const prefix = global.BOT_PREFIX || '.';

            // Check if this is the antilinkkick command
            if (!rawBody.startsWith(prefix + 'antilinkkick')) {
                return false;
            }

            const sub = args[0]?.toLowerCase();

            if (!sub || sub === 'status') {
                const status = store.enabled ? 'ᴏɴ' : 'ᴏꜰꜰ';
                return await m.reply(`┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ${status}\n│\n│ ᴍᴏᴅᴇ: ɪɴsᴛᴀɴᴛ ᴋɪᴄᴋ\n│\n╰─────────◆────────╯`);
            }

            if (sub === 'on') {
                store.enabled = true;
                return await m.reply('┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏɴ\n│\n│ ᴜsᴇʀs sᴇɴᴅɪɴɢ ʟɪɴᴋs\n│ ᴡɪʟʟ ʙᴇ ᴋɪᴄᴋᴇᴅ ɪɴsᴛᴀɴᴛʟʏ\n│\n╰─────────◆────────╯');
            }

            if (sub === 'off') {
                store.enabled = false;
                return await m.reply('┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏꜰꜰ\n│\n╰─────────◆────────╯');
            }

            return await m.reply('┌─ம ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᴜsᴀɢᴇ:\n│ ᪣ .antilinkkick on\n│ ᪣ .antilinkkick off\n│ ᪣ .antilinkkick (status)\n│\n╰─────────◆────────╯');

        } catch (err) {
            console.error('AntiLinkKick execute error:', err.message);
            await m.reply('❌ ᴀɴᴛɪʟɪɴᴋᴋɪᴄᴋ ᴇʀʀᴏʀ: ' + err.message);
        }
    }
};
