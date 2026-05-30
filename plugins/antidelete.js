const { downloadMediaMessage } = require('@whiskeysockets/baileys');

let antideleteEnabled = false;
const msgCache = new Map();
const MAX_CACHE = 1000; // Increased to 1000 messages
const MAX_AGE = 10 * 60 * 1000; // 10 minutes cache lifetime

// Auto-clean old messages every minute
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
}, 60000); // Clean every minute

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
            return m.reply('┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ sᴛᴀᴛᴜs: ᴏɴ ✅\n│ ʀᴇᴄᴏᴠᴇʀs: ᴛᴇxᴛ, ɪᴍᴀɢᴇs\n│ ᴠɪᴅᴇᴏs, ᴅᴏᴄs, ᴠɪᴇᴡᴏɴᴄᴇ\n│ ᴄᴀᴄʜᴇ ᴛɪᴍᴇ: 10 ᴍɪɴᴜᴛᴇs\n│ ᴍᴀx ᴄᴀᴄʜᴇ: 1000 ᴍsɢs\n╰─────────◆────────╯');
        }
        
        if (arg === 'off') {
            antideleteEnabled = false;
            msgCache.clear();
            return m.reply('┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ sᴛᴀᴛᴜs: ᴏꜰꜰ ❌\n│ ᴄᴀᴄʜᴇ ᴄʟᴇᴀʀᴇᴅ ✅\n╰─────────◆────────╯');
        }
        
        return m.reply(`┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ sᴛᴀᴛᴜs: ${antideleteEnabled ? 'ᴏɴ ✅' : 'ᴏꜰꜰ ❌'}\n│ ᴄᴀᴄʜᴇᴅ: ${msgCache.size}/1000 ᴍsɢs\n│ ᴜsᴀɢᴇ: .antidelete on/off\n╰─────────◆────────╯`);
    },

    async onMessage(sock, m) {
        if (!antideleteEnabled) return;
        if (!m || !m.key) return;

        const type = m.type || Object.keys(m.message || {})[0] || '';

        // Handle deleted messages (protocolMessage type 0 = delete)
        if (type === 'protocolMessage') {
            const proto = m.message?.protocolMessage;
            
            // type 0 = DELETE for everyone
            // type 1 = DELETE for me (usually not recoverable)
            if (proto?.type === 0 && proto?.key) {
                const cacheKey = proto.key.id;
                const cached = msgCache.get(cacheKey);
                
                if (!cached) {
                    console.log(`[Anti-Delete] Message ${cacheKey} not found in cache (expired or not cached)`);
                    return;
                }

                const sender = proto.key.participant || proto.key.remoteJid || 'Unknown';
                const senderNum = sender.split('@')[0];
                const chat = m.key.remoteJid;

                const header = `┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ ᪣ ꜰʀᴏᴍ: @${senderNum}\n│ ᪣ ᴅᴇʟᴇᴛᴇᴅ ᴍsɢ ʀᴇᴄᴏᴠᴇʀᴇᴅ\n│\n╰─────────◆────────╯`;

                try {
                    if (cached.type === 'text') {
                        await sock.sendMessage(chat, { 
                            text: `${header}\n\n${cached.body}`, 
                            mentions: [sender] 
                        });
                        console.log(`[Anti-Delete] Recovered text message from ${senderNum}`);
                    } 
                    else if (cached.type === 'imageMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            image: cached.buffer, 
                            caption: `${header}${cached.caption ? '\n\n' + cached.caption : ''}`, 
                            mentions: [sender],
                            viewOnce: cached.isViewOnce || false
                        });
                        console.log(`[Anti-Delete] Recovered image from ${senderNum}`);
                    } 
                    else if (cached.type === 'videoMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            video: cached.buffer, 
                            caption: `${header}${cached.caption ? '\n\n' + cached.caption : ''}`, 
                            mentions: [sender],
                            viewOnce: cached.isViewOnce || false
                        });
                        console.log(`[Anti-Delete] Recovered video from ${senderNum}`);
                    } 
                    else if (cached.type === 'documentMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            document: cached.buffer, 
                            fileName: cached.fileName || 'file', 
                            mimetype: cached.mimetype || 'application/octet-stream', 
                            caption: `${header}${cached.caption ? '\n\n' + cached.caption : ''}`, 
                            mentions: [sender] 
                        });
                        console.log(`[Anti-Delete] Recovered document from ${senderNum}`);
                    } 
                    else if (cached.type === 'audioMessage' && cached.buffer) {
                        await sock.sendMessage(chat, { 
                            audio: cached.buffer, 
                            mimetype: cached.mimetype || 'audio/mp4', 
                            ptt: cached.ptt || false 
                        });
                        console.log(`[Anti-Delete] Recovered audio from ${senderNum}`);
                    } 
                    else {
                        await sock.sendMessage(chat, { text: header, mentions: [sender] });
                    }
                } catch (err) {
                    console.error('[Anti-Delete] Send error:', err);
                }
                
                // Remove from cache after recovery to save memory
                msgCache.delete(cacheKey);
            }
            return;
        }

        // Don't cache protocol messages
        if (type === 'protocolMessage') return;
        if (!m.key?.id) return;

        try {
            // Unwrap viewOnce messages for caching
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
            const actualType = Object.keys(actualMsg || {})[0] || type;

            // Cache text messages
            if (actualType === 'conversation' || actualType === 'extendedTextMessage') {
                const text = actualMsg?.conversation || actualMsg?.extendedTextMessage?.text || m.body || '';
                if (text && text.trim()) {
                    msgCache.set(m.key.id, { 
                        type: 'text', 
                        body: text,
                        timestamp: Date.now()
                    });
                    console.log(`[Anti-Delete] Cached text message: ${m.key.id}`);
                }
            } 
            // Cache image messages
            else if (actualType === 'imageMessage') {
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
                        timestamp: Date.now()
                    });
                    console.log(`[Anti-Delete] Cached image: ${m.key.id}`);
                }
            } 
            // Cache video messages
            else if (actualType === 'videoMessage') {
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
                        timestamp: Date.now()
                    });
                    console.log(`[Anti-Delete] Cached video: ${m.key.id}`);
                }
            } 
            // Cache document messages
            else if (actualType === 'documentMessage') {
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
                        timestamp: Date.now()
                    });
                    console.log(`[Anti-Delete] Cached document: ${m.key.id}`);
                }
            } 
            // Cache audio messages
            else if (actualType === 'audioMessage') {
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
                        timestamp: Date.now()
                    });
                    console.log(`[Anti-Delete] Cached audio: ${m.key.id}`);
                }
            }

            if (msgCache.size > MAX_CACHE) {
                let oldestKey = null;
                let oldestTime = Date.now();
                
                for (const [key, value] of msgCache.entries()) {
                    if (value.timestamp < oldestTime) {
                        oldestTime = value.timestamp;
                        oldestKey = key;
                    }
                }
                
                if (oldestKey) {
                    msgCache.delete(oldestKey);
                    console.log(`[Anti-Delete] Removed oldest message from cache (size: ${msgCache.size}/${MAX_CACHE})`);
                }
            }
        } catch (err) {
            console.error('[Anti-Delete] Cache error:', err);
        }
    }
};
