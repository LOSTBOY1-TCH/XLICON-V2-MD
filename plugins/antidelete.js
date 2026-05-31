/**
 * 🗑️ ANTIDELETE PLUGIN - SIMPLE VERSION
 * Recovers and resends deleted messages
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const messageCache = new Map();
const antideleteSettings = new Map();

const DEFAULT_CACHE_SIZE = 1000;
const MESSAGE_RETENTION_TIME = 60 * 60 * 1000;

module.exports = {
    name: 'antidelete',
    description: 'Recover deleted messages',
    aliases: ['ad', 'antidel'],

    async execute(sock, m, args) {
        try {
            const action = args[0]?.toLowerCase();

            if (action === 'on') {
                antideleteSettings.set(m.from, true);
                await m.send('ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ɪs ɴᴏᴡ ᴏɴ ✓', { quoted: m });
            } 
            else if (action === 'off') {
                antideleteSettings.set(m.from, false);
                await m.send('ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ɪs ɴᴏᴡ ᴏғғ', { quoted: m });
            }
            else if (action === 'help') {
                const help = `ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴄᴏᴍᴍᴀɴᴅs:

.ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴏɴ
.ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴏғғ`;
                await m.send(help, { quoted: m });
            }
            else {
                await m.send('ᴜsᴇ: .ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴏɴ/ᴏғғ', { quoted: m });
            }
        } catch (error) {
            console.error('Antidelete error:', error);
        }
    },

    initializeListener(sock) {
        console.log('ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ɪɴɪᴛɪᴀʟɪᴢᴇᴅ');

        // Cache messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            for (const msg of messages) {
                try {
                    if (msg.message && !msg.key.fromMe) {
                        await cacheMessage(msg);
                    }
                } catch (error) {
                    console.error('Cache error:', error);
                }
            }
        });

        // Detect deletions
        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                try {
                    if (update.update?.deleteMessage) {
                        await handleDeletedMessage(sock, update);
                    }
                } catch (error) {
                    console.error('Delete error:', error);
                }
            }
        });

        return true;
    }
};

async function cacheMessage(msg) {
    const chatId = msg.key.remoteJid;
    if (!messageCache.has(chatId)) {
        messageCache.set(chatId, []);
    }

    const cache = messageCache.get(chatId);
    const msgType = Object.keys(msg.message || {})[0];

    if (!msgType) return;

    const cachedMsg = {
        id: msg.key.id,
        from: msg.key.participant || msg.key.remoteJid,
        timestamp: msg.messageTimestamp,
        type: msgType,
        message: msg.message,
        originalMsg: msg,
        expireAt: Date.now() + MESSAGE_RETENTION_TIME
    };

    cache.push(cachedMsg);

    if (cache.length > DEFAULT_CACHE_SIZE) {
        cache.shift();
    }

    const now = Date.now();
    const activeMessages = cache.filter(m => m.expireAt > now);
    messageCache.set(chatId, activeMessages);
}

async function handleDeletedMessage(sock, update) {
    try {
        const chatId = update.key.remoteJid;
        const messageId = update.key.id;

        if (antideleteSettings.get(chatId) === false) {
            return;
        }

        const cache = messageCache.get(chatId);
        if (!cache) return;

        const deletedMsg = cache.find(m => m.id === messageId);
        if (!deletedMsg) return;

        messageCache.set(chatId, cache.filter(m => m.id !== messageId));

        const msgType = deletedMsg.type;
        
        switch (msgType) {
            case 'conversation':
            case 'extendedTextMessage':
                const text = deletedMsg.message.conversation || 
                           deletedMsg.message.extendedTextMessage?.text || 
                           '(empty)';
                await sock.sendMessage(chatId, { text: text });
                break;

            case 'imageMessage':
                await recoverMedia(sock, chatId, deletedMsg, 'image');
                break;

            case 'videoMessage':
                await recoverMedia(sock, chatId, deletedMsg, 'video');
                break;

            case 'audioMessage':
                await recoverMedia(sock, chatId, deletedMsg, 'audio');
                break;

            case 'documentMessage':
                await recoverMedia(sock, chatId, deletedMsg, 'document');
                break;

            case 'stickerMessage':
                await recoverMedia(sock, chatId, deletedMsg, 'sticker');
                break;
        }

    } catch (error) {
        console.error('Delete error:', error);
    }
}

async function recoverMedia(sock, chatId, deletedMsg, mediaType) {
    try {
        const media = await downloadMediaMessage(
            deletedMsg.originalMsg,
            'buffer',
            {},
            sock
        );

        if (!media) return;

        const msgObj = {
            mimetype: deletedMsg.originalMsg.message[deletedMsg.type].mimetype
        };

        if (mediaType === 'image') msgObj.image = media;
        else if (mediaType === 'video') msgObj.video = media;
        else if (mediaType === 'audio') {
            msgObj.audio = media;
            msgObj.ptt = true;
        }
        else if (mediaType === 'document') {
            msgObj.document = media;
            msgObj.fileName = deletedMsg.originalMsg.message[deletedMsg.type].fileName || 'file';
        }
        else if (mediaType === 'sticker') msgObj.sticker = media;

        await sock.sendMessage(chatId, msgObj);

    } catch (error) {
        console.error('Media error:', error);
    }
}
