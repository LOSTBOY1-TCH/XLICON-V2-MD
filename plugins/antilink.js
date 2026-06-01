const LINK_REGEX = /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/|t\.me\/|discord\.gg\/|(?:youtube\.com|youtu\.be)\/|instagram\.com\/|(?:facebook\.com|fb\.com)\/|(?:x\.com|twitter\.com)\/)[^\s]*/i;

function normalizeJid(jid = '') {
    return String(jid).split(':')[0];
}

function initStore(groupId) {
    if (!global.antiLinkStore) global.antiLinkStore = {};
    if (!global.antiLinkStore[groupId]) {
        global.antiLinkStore[groupId] = {
            enabled: false,
            kick: false,
            maxWarns: 3,
            warns: {}
        };
    }
}

function getStore(groupId) {
    initStore(groupId);
    return global.antiLinkStore[groupId];
}

function isExempt(m, sock) {
    if (!m || !sock) return true;
    const senderNorm = normalizeJid(m.sender || '');
    const botNorm = normalizeJid(sock.user?.id || sock.user?.lid || '');
    if (senderNorm === botNorm) return true;
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
        console.error('AntiLink kick error:', e.message);
        return false;
    }
}

module.exports = {
    name: 'antilink',
    aliases: ['antilinkwarn', 'antilinkkick'],
    description: 'AntiLink moderation system',
    tags: ['moderation'],

    async onMessage(sock, m) {
        try {
            if (!m.isGroup) return false;
            if (!m.body) return false;

            const groupId = m.from;
            const store = getStore(groupId);

            if (!store.enabled) return false;
            if (!LINK_REGEX.test(m.body)) return false;
            if (isExempt(m, sock)) return false;

            const senderNumber = (m.sender || '').split('@')[0].split(':')[0];

            // Delete message first
            if (m.isBotAdmin) {
                try {
                    await sock.sendMessage(groupId, { delete: m.key });
                } catch (e) {
                    console.error('AntiLink delete error:', e.message);
                }
            }

            // Kick mode
            if (store.kick) {
                if (m.isBotAdmin) {
                    await kickUser(sock, groupId, m.sender);
                    const kickCard = `┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ ᴜsᴇʀ: @${senderNumber}\n│ ᪣ ᴀᴄᴛɪᴏɴ: ᴋɪᴄᴋᴇᴅ\n│\n│ sᴇɴᴛ ᴀ ʟɪɴᴋ ᴀɴᴅ ᴡᴀs ʀᴇᴍᴏᴠᴇᴅ\n│\n╰─────────◆────────╯`;
                    await sock.sendMessage(groupId, {
                        text: kickCard,
                        mentions: [m.sender]
                    });
                } else {
                    const noAdminCard = `┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ ʙᴏᴛ ɴᴏᴛ ᴀᴅᴍɪɴ\n│\n│ ᴄᴀɴɴᴏᴛ ᴋɪᴄᴋ ᴜsᴇʀ\n│\n╰─────────◆────────╯`;
                    await sock.sendMessage(groupId, { text: noAdminCard });
                }
                return true;
            }

            // Warn mode
            const senderNorm = normalizeJid(m.sender);
            if (!store.warns[senderNorm]) store.warns[senderNorm] = 0;
            store.warns[senderNorm]++;

            const currentWarn = store.warns[senderNorm];
            const maxWarns = store.maxWarns || 3;

            if (currentWarn >= maxWarns) {
                // Max warns reached — kick
                const maxCard = `┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ ᴜsᴇʀ: @${senderNumber}\n│ ᪣ ᴡᴀʀɴ: ${currentWarn}/${maxWarns}\n│\n│ ᴍᴀx ᴡᴀʀɴɪɴɢs ʀᴇᴀᴄʜᴇᴅ\n│ ᴜsᴇʀ ʀᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ ɢʀᴏᴜᴘ\n│\n╰─────────◆────────╯`;
                await sock.sendMessage(groupId, {
                    text: maxCard,
                    mentions: [m.sender]
                });
                store.warns[senderNorm] = 0;
                if (m.isBotAdmin) {
                    await kickUser(sock, groupId, m.sender);
                } else {
                    const noAdminCard = `┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ ʙᴏᴛ ɴᴏᴛ ᴀᴅᴍɪɴ\n│\n│ ᴄᴀɴɴᴏᴛ ʀᴇᴍᴏᴠᴇ ᴜsᴇʀ\n│\n╰─────────◆────────╯`;
                    await sock.sendMessage(groupId, { text: noAdminCard });
                }
            } else {
                const warnCard = `┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ ᴜsᴇʀ: @${senderNumber}\n│ ᪣ ᴡᴀʀɴ: ${currentWarn}/${maxWarns}\n│\n│ ʟɪɴᴋs ᴀʀᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ\n│\n╰─────────◆────────╯`;
                await sock.sendMessage(groupId, {
                    text: warnCard,
                    mentions: [m.sender]
                });
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

            // Determine which sub-command was invoked
            const rawBody = (m.body || '').trim().toLowerCase();
            const prefix = global.BOT_PREFIX || '.';

            // .antilinkkick
            if (rawBody.startsWith(prefix + 'antilinkkick')) {
                const sub = args[0]?.toLowerCase();
                if (!sub || sub === 'status') {
                    const status = store.kick ? 'ᴏɴ' : 'ᴏꜰꜰ';
                    return await m.reply(`┌─ム ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ${status}\n│\n╰─────────◆────────╯`);
                }
                if (sub === 'on') {
                    store.kick = true;
                    return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏɴ\n│\n│ ᴜsᴇʀs sᴇɴᴅɪɴɢ ʟɪɴᴋs\n│ ᴡɪʟʟ ʙᴇ ᴋɪᴄᴋᴇᴅ ɪᴍᴍᴇᴅɪᴀᴛᴇʟʏ\n│\n╰─────────◆────────╯');
                }
                if (sub === 'off') {
                    store.kick = false;
                    return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏꜰꜰ\n│\n╰─────────◆────────╯');
                }
                return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ ᴋɪᴄᴋ\n│\n│ ᪣ .antilinkkick on\n│ ᪣ .antilinkkick off\n│ ᪣ .antilinkkick\n│\n╰─────────◆────────╯');
            }

            // .antilinkwarn
            if (rawBody.startsWith(prefix + 'antilinkwarn')) {
                const num = parseInt(args[0]);
                if (!args[0] || isNaN(num) || num < 1) {
                    return await m.reply(`┌─ム ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ᴄᴜʀʀᴇɴᴛ: ${store.maxWarns}\n│\n│ ᴜsᴀɢᴇ: .antilinkwarn <ɴᴜᴍʙᴇʀ>\n│ ᴇxᴀᴍᴘʟᴇ: .antilinkwarn 3\n│\n╰─────────◆────────╯`);
                }
                store.maxWarns = num;
                return await m.reply(`┌─ム ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀʀɴ\n│\n│ ᪣ ᴍᴀx ᴡᴀʀɴs: ${num}\n│\n│ ᴜsᴇʀs ᴡɪʟʟ ʙᴇ ʀᴇᴍᴏᴠᴇᴅ\n│ ᴀꜰᴛᴇʀ ${num} ᴡᴀʀɴɪɴɢs\n│\n╰─────────◆────────╯`);
            }

            // .antilink
            const sub = args[0]?.toLowerCase();

            if (!sub || sub === 'status') {
                const status = store.enabled ? 'ᴏɴ' : 'ᴏꜰꜰ';
                const kickStatus = store.kick ? 'ᴏɴ' : 'ᴏꜰꜰ';
                return await m.reply(`┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ${status}\n│ ᪣ ᴋɪᴄᴋ ᴍᴏᴅᴇ: ${kickStatus}\n│ ᪣ ᴍᴀx ᴡᴀʀɴs: ${store.maxWarns}\n│\n╰─────────◆────────╯`);
            }

            if (sub === 'on') {
                store.enabled = true;
                return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏɴ\n│\n│ ʟɪɴᴋs ᴀʀᴇ ɴᴏᴡ ʙʟᴏᴄᴋᴇᴅ\n│\n╰─────────◆────────╯');
            }

            if (sub === 'off') {
                store.enabled = false;
                return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ sᴛᴀᴛᴜs: ᴏꜰꜰ\n│\n╰─────────◆────────╯');
            }

            return await m.reply('┌─ム ᴀɴᴛɪ ʟɪɴᴋ\n│\n│ ᪣ .antilink on\n│ ᪣ .antilink off\n│ ᪣ .antilink\n│ ᪣ .antilinkwarn <ɴᴜᴍ>\n│ ᪣ .antilinkkick on/off\n│\n╰─────────◆────────╯');

        } catch (err) {
            console.error('AntiLink execute error:', err.message);
            await m.reply('❌ ᴀɴᴛɪʟɪɴᴋ ᴇʀʀᴏʀ: ' + err.message);
        }
    }
};
