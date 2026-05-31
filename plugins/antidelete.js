const { downloadMediaMessage } = require('@whiskeysockets/baileys');

let antideleteEnabled = false;
const msgCache = new Map();
const MAX_CACHE = 2000;
const MAX_AGE = 30 * 60 * 1000; // 30 minutes
const messageArchive = new Map();

// Auto-clean old messages every 2 minutes
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of msgCache.entries()) {
        if (now - value.timestamp > MAX_AGE) {
            msgCache.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[Anti-Delete] Cleaned ${cleaned} expired messages. Cache size: ${msgCache.size}`);
    }
}, 120000);

module.exports = {
    name: 'antidelete',
    description: 'Recover deleted messages',
    aliases: ['antidel', 'ad'],
    tags: ['owner'],
    command: /^\.?(antidelete|antidel|ad)$/i,

    async execute(sock, m, args) {
        if (!m.isOwner) return m.reply('❌ Owner only.');
        
        const arg = args[0]?.toLowerCase();
        
        if (arg === 'on') {
            antideleteEnabled = true;
            return m.reply('┌─▰ ANTI DELETE\n│\n│ STATUS: ON ✅\n│ RECOVERS: TEXT, IMAGES\n│ VIDEOS, DOCS, AUDIO\n│ CACHE TIME: 30 MINUTES\n│ MAX CACHE: 2000 MSGS\n╰─────────◆────────╯');
        }
        
        if (arg === 'off') {
            antideleteEnabled = false;
            msgCache.clear();
            messageArchive.clear();
            return m.reply('┌─▰ ANTI DELETE\n│\n│ STATUS: OFF ❌\n│ CACHE CLEARED ✅\n╰─────────◆────────╯');
        }
        
        return m.reply(`┌─▰ ANTI DELETE\n│\n│ STATUS: ${antideleteEnabled ? 'ON ✅' : 'OFF ❌'}\n│ CACHED: ${msgCache.size}/2000 MSGS\n│ ARCHIVE: ${messageArchive.size} DELETED\n│ USAGE: .antidelete on/off\n╰─────────◆────────╯`);
    },

    async onMessage(sock, m) {
        if (!m || !m.key) return;

        // Handle deleted messages (protocolMessage)
        // Check if m.message exists and has protocolMessage
        if (m.message?.protocolMessage) {
            const proto = m.message.protocolMessage;
            
            // type 0 = DELETE for everyone
            if (proto?.type === 0 && proto?.key && antideleteEnabled) {
                const msgId = proto.key.id;
                const cached = msgCache.get(msgId) || messageArchive.get(msgId);
                
                if (!cached) {
                    console.log(`[Anti-Delete] Message ${msgId} not in cache`);
                    return;
                }

                try {
                    const sender = proto.key.participant || proto.key.remoteJid || 'Unknown';
                    const senderNum = sender.split('@')[0];
                    const chat = m.key.remoteJid;

                    const header = `┌─▰ ANTI DELETE\n│\n│ 📬 FROM: @${senderNum}\n│ 🗑️ DELETED MSG RECOVERED\n│\n╰─────────◆────────╯`;

                    if (cached.type === 'text') {
                        await sock.sendMessage(chat, { 
                            text: `${header}\n\n${cached.body}`, 
                            mentions: [sender] 
                        });
                        console.log(`[Anti-Delete] ✅ Recovered text message from ${senderNum}`);
                    } 
                    else if (cached.type === 'imageMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            image: cached.buffer, 
                            caption: `${header}${cached.caption ? '\n\n' + cached.caption : ''}`, 
                            mentions: [sender]
                        });
                        console.log(`[Anti-Delete] ✅ Recovered image from ${senderNum}`);
                    } 
                    else if (cached.type === 'videoMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            video: cached.buffer, 
                            caption: `${header}${cached.caption ? '\n\n' + cached.caption : ''}`, 
                            mentions: [sender]
                        });
                        console.log(`[Anti-Delete] ✅ Recovered video from ${senderNum}`);
                    } 
                    else if (cached.type === 'documentMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            document: cached.buffer, 
                            fileName: cached.fileName || 'document', 
                            mimetype: cached.mimetype || 'application/octet-stream', 
                            caption: `${header}${cached.caption ? '\n\n' + cached.caption : ''}`, 
                            mentions: [sender] 
                        });
                        console.log(`[Anti-Delete] ✅ Recovered document from ${senderNum}`);
                    } 
                    else if (cached.type === 'audioMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            audio: cached.buffer, 
                            mimetype: cached.mimetype || 'audio/mp4', 
                            ptt: cached.ptt || false
                        });
                        console.log(`[Anti-Delete] ✅ Recovered audio from ${senderNum}`);
                    } 
                    else if (cached.type === 'stickerMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            sticker: cached.buffer
                        });
                        console.log(`[Anti-Delete] ✅ Recovered sticker from ${senderNum}`);
                    }
                    else {
                        await sock.sendMessage(chat, { 
                            text: `${header}\n\n[Deleted message type: ${cached.type}]`,
                            mentions: [sender] 
                        });
                    }

                    messageArchive.set(msgId, cached);
                    msgCache.delete(msgId);
                } catch (err) {
                    console.error('[Anti-Delete] Recovery error:', err.message);
                }
            }
            return;
        }

        // Cache messages if anti-delete is enabled
        if (!antideleteEnabled) return;
        if (!m.key?.id) return;

        try {
            const unwrapViewOnce = (msg) => {
                if (!msg) return null;
                if (msg.viewOnceMessageV2?.message) return msg.viewOnceMessageV2.message;
                if (msg.viewOnceMessageV2Extension?.message) return msg.viewOnceMessageV2Extension.message;
                if (msg.viewOnceMessage?.message) return msg.viewOnceMessage.message;
                return null;
            };

            const unwrapped = unwrapViewOnce(m.message);
            const isViewOnce = !!unwrapped;
            const actualMsg = unwrapped || m.message;
            const actualType = Object.keys(actualMsg || {})[0];

            // Cache text messages
            if (actualType === 'conversation' || actualType === 'extendedTextMessage') {
                const text = actualMsg?.conversation || actualMsg?.extendedTextMessage?.text || m.body || '';
                if (text && text.trim()) {
                    msgCache.set(m.key.id, { 
                        type: 'text', 
                        body: text,
                        timestamp: Date.now(),
                        fromJid: m.key.remoteJid,
                        senderJid: m.key.participant || m.key.remoteJid
                    });
                    console.log(`[Anti-Delete] Cached text: ${m.key.id}`);
                }
            } 
            // Cache image messages
            else if (actualType === 'imageMessage') {
                try {
                    const buffer = await downloadMediaMessage(
                        m,
                        'buffer',
                        {},
                        { reuploadRequest: sock.updateMediaMessage }
                    );
                    if (buffer) {
                        msgCache.set(m.key.id, {
                            type: 'imageMessage',
                            buffer: buffer,
                            caption: actualMsg?.imageMessage?.caption || '',
                            isViewOnce: isViewOnce,
                            timestamp: Date.now(),
                            fromJid: m.key.remoteJid,
                            senderJid: m.key.participant || m.key.remoteJid
                        });
                        console.log(`[Anti-Delete] Cached image: ${m.key.id}`);
                    }
                } catch (err) {
                    console.error('[Anti-Delete] Failed to cache image:', err.message);
                }
            } 
            // Cache video messages
            else if (actualType === 'videoMessage') {
                try {
                    const buffer = await downloadMediaMessage(
                        m,
                        'buffer',
                        {},
                        { reuploadRequest: sock.updateMediaMessage }
                    );
                    if (buffer) {
                        msgCache.set(m.key.id, {
                            type: 'videoMessage',
                            buffer: buffer,
                            caption: actualMsg?.videoMessage?.caption || '',
                            mimetype: actualMsg?.videoMessage?.mimetype || 'video/mp4',
                            isViewOnce: isViewOnce,
                            timestamp: Date.now(),
                            fromJid: m.key.remoteJid,
                            senderJid: m.key.participant || m.key.remoteJid
                        });
                        console.log(`[Anti-Delete] Cached video: ${m.key.id}`);
                    }
                } catch (err) {
                    console.error('[Anti-Delete] Failed to cache video:', err.message);
                }
            } 
            // Cache document messages
            else if (actualType === 'documentMessage') {
                try {
                    const buffer = await downloadMediaMessage(
                        m,
                        'buffer',
                        {},
                        { reuploadRequest: sock.updateMediaMessage }
                    );
                    if (buffer) {
                        msgCache.set(m.key.id, {
                            type: 'documentMessage',
                            buffer: buffer,
                            caption: actualMsg?.documentMessage?.caption || '',
                            fileName: actualMsg?.documentMessage?.fileName || 'document',
                            mimetype: actualMsg?.documentMessage?.mimetype || 'application/octet-stream',
                            timestamp: Date.now(),
                            fromJid: m.key.remoteJid,
                            senderJid: m.key.participant || m.key.remoteJid
                        });
                        console.log(`[Anti-Delete] Cached document: ${m.key.id}`);
                    }
                } catch (err) {
                    console.error('[Anti-Delete] Failed to cache document:', err.message);
                }
            } 
            // Cache audio messages
            else if (actualType === 'audioMessage') {
                try {
                    const buffer = await downloadMediaMessage(
                        m,
                        'buffer',
                        {},
                        { reuploadRequest: sock.updateMediaMessage }
                    );
                    if (buffer) {
                        msgCache.set(m.key.id, {
                            type: 'audioMessage',
                            buffer: buffer,
                            mimetype: actualMsg?.audioMessage?.mimetype || 'audio/mp4',
                            ptt: actualMsg?.audioMessage?.ptt || false,
                            timestamp: Date.now(),
                            fromJid: m.key.remoteJid,
                            senderJid: m.key.participant || m.key.remoteJid
                        });
                        console.log(`[Anti-Delete] Cached audio: ${m.key.id}`);
                    }
                } catch (err) {
                    console.error('[Anti-Delete] Failed to cache audio:', err.message);
                }
            }
            // Cache sticker messages
            else if (actualType === 'stickerMessage') {
                try {
                    const buffer = await downloadMediaMessage(
                        m,
                        'buffer',
                        {},
                        { reuploadRequest: sock.updateMediaMessage }
                    );
                    if (buffer) {
                        msgCache.set(m.key.id, {
                            type: 'stickerMessage',
                            buffer: buffer,
                            timestamp: Date.now(),
                            fromJid: m.key.remoteJid,
                            senderJid: m.key.participant || m.key.remoteJid
                        });
                        console.log(`[Anti-Delete] Cached sticker: ${m.key.id}`);
                    }
                } catch (err) {
                    console.error('[Anti-Delete] Failed to cache sticker:', err.message);
                }
            }

            // Enforce cache size limit
            if (msgCache.size > MAX_CACHE) {
                const entriesToDelete = msgCache.size - MAX_CACHE + 100;
                let deleted = 0;
                for (const [key, value] of msgCache.entries()) {
                    if (deleted >= entriesToDelete) break;
                    msgCache.delete(key);
                    deleted++;
                }
                console.log(`[Anti-Delete] Cache pruned: Removed ${deleted} old messages`);
            }
        } catch (err) {
            console.error('[Anti-Delete] Cache error:', err.message);
        }
    }
};
