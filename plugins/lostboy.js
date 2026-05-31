const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'me',
    description: 'Send replied viewonce to your DM silently',
    aliases: ['lostboy'],
    tags: ['owner'],
    command: /^\.?me$/i,

    async execute(sock, m, args) {
        if (!m.isOwner) return;
        if (!m.quoted) return m.reply('Reply to a view-once message!');

        const ownerJid = global.owners?.[0];
        if (!ownerJid) return m.reply('No owner configured!');

        const dmJid = ownerJid.includes('@') ? ownerJid : ownerJid + '@s.whatsapp.net';

        try {
            // Get the quoted message properly from the serialized message
            if (!m.quoted.key || !m.quoted.message) {
                return m.reply('Could not access quoted message!');
            }

            const qMsg = m.quoted.message;
            
            // Unwrap viewonce messages
            const unwrapViewOnce = (msg) => {
                if (!msg) return null;
                if (msg.viewOnceMessageV2?.message) return msg.viewOnceMessageV2.message;
                if (msg.viewOnceMessageV2Extension?.message) return msg.viewOnceMessageV2Extension.message;
                if (msg.viewOnceMessage?.message) return msg.viewOnceMessage.message;
                return null;
            };

            const unwrapped = unwrapViewOnce(qMsg);
            const actualMsg = unwrapped || qMsg;
            const actualType = Object.keys(actualMsg || {})[0];

            // Download the media using the quoted message key
            const msgToDownload = {
                key: m.quoted.key,
                message: qMsg
            };

            if (actualType === 'imageMessage') {
                const buffer = await downloadMediaMessage(
                    msgToDownload,
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );
                
                await sock.sendMessage(dmJid, {
                    image: buffer,
                    caption: actualMsg?.imageMessage?.caption || '',
                });
                await m.reply('✅ Image sent to your DM!');
            } 
            else if (actualType === 'videoMessage') {
                const buffer = await downloadMediaMessage(
                    msgToDownload,
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );
                
                await sock.sendMessage(dmJid, {
                    video: buffer,
                    caption: actualMsg?.videoMessage?.caption || '',
                });
                await m.reply('✅ Video sent to your DM!');
            } 
            else if (actualType === 'audioMessage') {
                const buffer = await downloadMediaMessage(
                    msgToDownload,
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );
                await sock.sendMessage(dmJid, {
                    audio: buffer,
                    mimetype: actualMsg?.audioMessage?.mimetype || 'audio/mp4',
                    ptt: actualMsg?.audioMessage?.ptt || false
                });
                await m.reply('✅ Audio sent to your DM!');
            } 
            else if (actualType === 'conversation' || actualType === 'extendedTextMessage') {
                const text = actualMsg?.conversation || actualMsg?.extendedTextMessage?.text || m.quoted.body || '';
                if (text) {
                    await sock.sendMessage(dmJid, { text });
                    await m.reply('✅ Text sent to your DM!');
                } else {
                    await m.reply('No text content found!');
                }
            }
            else {
                await m.reply(`Unsupported message type: ${actualType}`);
            }
        } catch (err) {
            console.error('lostboy.js error:', err);
            await m.reply(`Error: ${err.message}`);
        }
    }
};
