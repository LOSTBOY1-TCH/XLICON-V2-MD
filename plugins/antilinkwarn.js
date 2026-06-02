const LINK_REGEX = /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/|t\.me\/|discord\.gg\/|(?:youtube\.com|youtu\.be)\/|instagram\.com\/|(?:facebook\.com|fb\.com)\/|(?:x\.com|twitter\.com)\/)[^\s]*/i;

function normalizeJid(jid = '') {
    return String(jid).split(':')[0];
}

function initStore(groupId) {
    if (!global.antilinkWarnStore) global.antilinkWarnStore = {};
    if (!global.antilinkWarnStore[groupId]) {
        global.antilinkWarnStore[groupId] = {
            enabled: false,
            maxWarns: 3,
            warns: {}
        };
    }
}

function getStore(groupId) {
    initStore(groupId);
    return global.antilinkWarnStore[groupId];
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
        console.error('AntiLinkWarn kick error:', e.message);
        return false;
    }
}

module.exports = {
    name: 'antilinkwarn',
    description: 'Delete messages with links and warn users',
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
            const senderNorm = normalizeJid(m.sender);

            // Delete message first
            if (m.isBotAdmin) {
                try {
                    await sock.sendMessage(groupId, { delete: m.key });
                } catch (e) {
                    console.error('AntiLinkWarn delete error:', e.message);
                }
            }

            // Initialize warns for this user if not exists
            if (!store.warns[senderNorm]) store.warns[senderNorm] = 0;
            store.warns[senderNorm]++;

            const currentWarn = store.warns[senderNorm];
            const maxWarns = store.maxWarns || 3;

            if (currentWarn >= maxWarns) {
                // Max warns reached — kick
                const maxCard = `┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ᴜsᴇʀ: @${senderNumber}\n│ ᪣ ᴡᴀʀɴ: ${currentWarn}/${maxWarns}\n│\n│ ᴍᴀx ᴡᴀʀɴɪɴɢs ʀᴇᴀᴄʜᴇᴅ\n│ ᴜsᴇʀ ʀᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ ɢʀᴏᴜᴘ\n│\n╰─────────◆────────╯`;
                
                await sock.sendMessage(groupId, {
                    text: maxCard,
                    mentions: [m.sender]
                });

                store.warns[senderNorm] = 0;

                if (m.isBotAdmin) {
                    await kickUser(sock, groupId, m.sender);
                } else {
                    const noAdminCard = `┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ʙᴏᴛ ɴᴏᴛ ᴀᴅᴍɪɴ\n│\n│ ᴄᴀɴɴᴏᴛ ʀᴇᴍᴏᴠᴇ ᴜsᴇʀ\n│\n╰─────────◆────────╯`;
                    await sock.sendMessage(groupId, { text: noAdminCard });
                }
            } else {
                // Send warn message
                const warnCard = `┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ᴜsᴇʀ: @${senderNumber}\n│ ᪣ ᴡᴀʀɴ: ${currentWarn}/${maxWarns}\n│\n│ ʟɪɴᴋs ᴀʀᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ\n│\n╰─────────◆────────╯`;
                
                await sock.sendMessage(groupId, {
                    text: warnCard,
                    mentions: [m.sender]
                });
            }

            return true;
        } catch (err) {
            console.error('AntiLinkWarn onMessage error:', err.message);
            return false;
        }
    },

    async execute(sock, m, args) {
        try {
            if (!m.isGroup) {
                return await m.reply('┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ɢʀᴏᴜᴘ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n│\n╰─────────◆────────╯');
            }

            if (!m.isAdmin && !m.isOwner) {
                return await m.reply('┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ᴀᴅᴍɪɴs ᴏɴʟʏ\n│\n╰─────────◆────────╯');
            }

            const groupId = m.from;
            const store = getStore(groupId);

            const rawBody = (m.body || '').trim().toLowerCase();
            const prefix = global.BOT_PREFIX || '.';

            // Check if this is the antilinkwarn command
            if (!rawBody.startsWith(prefix + 'antilinkwarn')) {
                return false;
            }

            const num = parseInt(args[0]);

            if (!args[0]) {
                // No args - show status
                const status = store.enabled ? 'ᴏɴ' : 'ᴏꜰꜰ';
                return await m.reply(`┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ sᴛᴀᴛᴜs: ${status}\n│ ᪣ ᴍᴀx ᴡᴀʀɴs: ${store.maxWarns}\n│\n│ ᴜsᴀɢᴇ: .antilinkwarn <ɴᴜᴍʙᴇʀ>\n│ ᴇxᴀᴍᴘʟᴇ: .antilinkwarn 3\n│ ᴛᴏ ᴛᴜʀɴ ᴏꜰꜰ: .antilinkwarn off\n│\n╰─────────◆────────╯`);
            }

            if (args[0].toLowerCase() === 'off') {
                store.enabled = false;
                store.warns = {};
                return await m.reply('┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏꜰꜰ\n│\n│ ᴀʟʟ ᴡᴀʀɴɪɴɢs ᴄʟᴇᴀʀᴇᴅ\n│\n╰─────────◆────────╯');
            }

            if (isNaN(num) || num < 1) {
                return await m.reply(`┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ᴇʀʀᴏʀ: ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ\n│\n│ ᴜsᴀɢᴇ: .antilinkwarn <ɴᴜᴍʙᴇʀ>\n│ ᴇxᴀᴍᴘʟᴇ: .antilinkwarn 3\n│\n╰─────────◆────────╯`);
            }

            store.enabled = true;
            store.maxWarns = num;
            store.warns = {};

            return await m.reply(`┌─ม ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴇɴᴀʙʟᴇᴅ\n│ ᪣ ᴍᴀx ᴡᴀʀɴs: ${num}\n│\n│ ᴜsᴇʀs ᴡɪʟʟ ʙᴇ ʀᴇᴍᴏᴠᴇᴅ\n│ ᴀꜰᴛᴇʀ ${num} ᴡᴀʀɴɪɴɢs\n│\n╰─────────◆────────╯`);

        } catch (err) {
            console.error('AntiLinkWarn execute error:', err.message);
            await m.reply('❌ ᴀɴᴛɪʟɪɴᴋᴡᴀʀɴ ᴇʀʀᴏʀ: ' + err.message);
        }
    }
};
