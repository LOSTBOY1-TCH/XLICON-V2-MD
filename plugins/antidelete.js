const { downloadMediaMessage } = require('@whiskeysockets/baileys');

let antideleteEnabled = false;
const msgCache = new Map();
const MAX_CACHE = 500;

module.exports = {
    name: 'antidelete',
    description: 'Recover deleted messages',
    aliases: ['antidel', 'ad'],
    tags: ['owner'],
    command: /^\.?(antidelete|antidel|ad)$/i,

    async execute(sock, m, args) {
        if (!m.isOwner) return m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
        const arg = args[0]?.toLowerCase();
        if (arg === 'on') {
            antideleteEnabled = true;
            return m.reply('┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ sᴛᴀᴛᴜs: ᴏɴ ✅\n│ ʀᴇᴄᴏᴠᴇʀs: ᴛᴇxᴛ, ɪᴍᴀɢᴇs\n│ ᴠɪᴅᴇᴏs, ᴅᴏᴄs, ᴠɪᴇᴡᴏɴᴄᴇ\n╰─────────◆────────╯');
        }
        if (arg === 'off') {
            antideleteEnabled = false;
            msgCache.clear();
            return m.reply('┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ sᴛᴀᴛᴜs: ᴏꜰꜰ ❌\n╰─────────◆────────╯');
        }
        return m.reply(`┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ sᴛᴀᴛᴜs: ${antideleteEnabled ? 'ᴏɴ ✅' : 'ᴏꜰꜰ ❌'}\n│ ᴄᴀᴄʜᴇᴅ: ${msgCache.size} ᴍsɢs\n│ ᴜsᴀɢᴇ: .antidelete on/off\n╰─────────◆────────╯`);
    },

    async onMessage(sock, m) {
        if (!antideleteEnabled) return;
        if (!m || !m.key) return;

        const raw = m.raw || m;
        const msgObj = raw.message || {};
        const type = m.type || Object.keys(msgObj)[0] || '';

        if (type === 'protocolMessage') {
            const proto = msgObj?.protocolMessage;
            if (proto?.type === 0 && proto?.key) {
                const deletedId = proto.key.id;
                const cached = msgCache.get(deletedId);
                if (!cached) return;

            
                const isGroup = m.from?.endsWith('@g.us');
                const deleter = isGroup
                    ? (m.key?.participant || m.sender || 'Unknown')
                    : (m.from || 'Unknown');
                const senderNum = deleter.split('@')[0];
                const chat = m.from;

                const header = `┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ ᪣ ꜰʀᴏᴍ: @${senderNum}\n│ ᪣ ᴅᴇʟᴇᴛᴇᴅ ᴍsɢ ʀᴇᴄᴏᴠᴇʀᴇᴅ\n│\n╰─────────◆────────╯`;

                try {
                    if (cached.type === 'text') {
                        await sock.sendMessage(chat, {
                            text: `${header}\n${cached.body}`,
                            mentions: [deleter]
                        });
                    } else if ((cached.type === 'imageMessage') && cached.buffer) {
                        await sock.sendMessage(chat, {
                            image: cached.buffer,
                            caption: `${header}${cached.caption ? '\n' + cached.caption : ''}`,
                            mentions: [deleter]
                        });
                    } else if ((cached.type === 'videoMessage') && cached.buffer) {
                        await sock.sendMessage(chat, {
                            video: cached.buffer,
                            caption: `${header}${cached.caption ? '\n' + cached.caption : ''}`,
                            mimetype: cached.mimetype || 'video/mp4',
                            mentions: [deleter]
                        });
                    } else if ((cached.type === 'documentMessage') && cached.buffer) {
                        await sock.sendMessage(chat, {
                            document: cached.buffer,
                            fileName: cached.fileName || 'file',
                            mimetype: cached.mimetype || 'application/octet-stream',
                            caption: `${header}${cached.caption ? '\n' + cached.caption : ''}`,
                            mentions: [deleter]
                        });
                    } else if ((cached.type === 'audioMessage') && cached.buffer) {
                        await sock.sendMessage(chat, {
                            audio: cached.buffer,
                            mimetype: cached.mimetype || 'audio/mp4',
                            ptt: cached.ptt || false
                        });
                        await sock.sendMessage(chat, {
                            text: `${header}`,
                            mentions: [deleter]
                        });
                    } else {
                        await sock.sendMessage(chat, {
                            text: header,
                            mentions: [deleter]
                        });
                    }
                } catch (err) {
                    console.error('Anti-delete send error:', err);
                }
                msgCache.delete(deletedId);
            }
            return;
        }

        if (!m.key?.id) return;

        try {
            // Unwrap viewonce
            const unwrapViewOnce = (msg) =>
                msg?.viewOnceMessage?.message ||
                msg?.viewOnceMessageV2?.message ||
                msg?.viewOnceMessageV2Extension?.message ||
                null;

            const unwrapped = unwrapViewOnce(msgObj);
            const isViewOnce = !!unwrapped;
            const actualMsg = unwrapped || msgObj;
            const actualType = Object.keys(actualMsg || {})[0] || type;

            if (actualType === 'conversation' || actualType === 'extendedTextMessage' ||
                type === 'conversation' || type === 'extendedTextMessage') {
                msgCache.set(m.key.id, { type: 'text', body: m.body || '' });

            } else if (actualType === 'imageMessage') {
                const dlMsg = isViewOnce
                    ? { key: raw.key, message: { imageMessage: actualMsg.imageMessage } }
                    : { key: raw.key, message: { imageMessage: actualMsg.imageMessage } };
                const buffer = await downloadMediaMessage(
                    dlMsg, 'buffer', {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );
                msgCache.set(m.key.id, {
                    type: 'imageMessage',
                    buffer,
                    caption: actualMsg?.imageMessage?.caption || '',
                    isViewOnce
                });

            } else if (actualType === 'videoMessage') {
                const dlMsg = { key: raw.key, message: { videoMessage: actualMsg.videoMessage } };
                const buffer = await downloadMediaMessage(
                    dlMsg, 'buffer', {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );
                msgCache.set(m.key.id, {
                    type: 'videoMessage',
                    buffer,
                    caption: actualMsg?.videoMessage?.caption || '',
                    mimetype: actualMsg?.videoMessage?.mimetype || 'video/mp4',
                    isViewOnce
                });

            } else if (actualType === 'documentMessage') {
                const dlMsg = { key: raw.key, message: { documentMessage: actualMsg.documentMessage } };
                const buffer = await downloadMediaMessage(
                    dlMsg, 'buffer', {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );
                msgCache.set(m.key.id, {
                    type: 'documentMessage',
                    buffer,
                    caption: actualMsg?.documentMessage?.caption || '',
                    fileName: actualMsg?.documentMessage?.fileName || 'document',
                    mimetype: actualMsg?.documentMessage?.mimetype || 'application/octet-stream'
                });

            } else if (actualType === 'audioMessage') {
                const dlMsg = { key: raw.key, message: { audioMessage: actualMsg.audioMessage } };
                const buffer = await downloadMediaMessage(
                    dlMsg, 'buffer', {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );
                msgCache.set(m.key.id, {
                    type: 'audioMessage',
                    buffer,
                    mimetype: actualMsg?.audioMessage?.mimetype || 'audio/mp4',
                    ptt: actualMsg?.audioMessage?.ptt || false
                });
            }

            if (msgCache.size > MAX_CACHE) {
                msgCache.delete(msgCache.keys().next().value);
            }
        } catch (err) {
            console.error('Anti-delete cache error:', err);
        }
    }
};
