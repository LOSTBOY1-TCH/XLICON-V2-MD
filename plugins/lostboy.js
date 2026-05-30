const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'me',
    description: 'Send replied viewonce to your DM silently',
    tags: ['owner'],
    command: /^\.?me$/i,

    async execute(sock, m) {
        if (!m.isOwner) return;
        if (!m.quoted) return;

        const ownerJid = global.owners?.[0];
        if (!ownerJid) return;

        const dmJid = ownerJid.includes('@') ? ownerJid : ownerJid + '@s.whatsapp.net';

        try {
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

            // Use the original quoted message for download
            const msgToDownload = m.quoted;

            if (actualType === 'imageMessage' || actualType === 'videoMessage') {
                const buffer = await downloadMediaMessage(
                    msgToDownload,
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );
                
                if (actualType === 'imageMessage') {
                    await sock.sendMessage(dmJid, {
                        image: buffer,
                        caption: actualMsg?.imageMessage?.caption || '',
                        viewOnce: true
                    });
                } else {
                    await sock.sendMessage(dmJid, {
                        video: buffer,
                        caption: actualMsg?.videoMessage?.caption || '',
                        viewOnce: true
                    });
                }
            } else if (actualType === 'audioMessage') {
                const buffer = await downloadMediaMessage(
                    msgToDownload,
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );
                await sock.sendMessage(dmJid, {
                    audio: buffer,
                    mimetype: actualMsg?.audioMessage?.mimetype || 'audio/mp4',
                    ptt: actualMsg?.audioMessage?.ptt || false,
                    viewOnce: true
                });
            } else {
                const text = m.quoted.body || '';
                if (text) {
                    await sock.sendMessage(dmJid, { 
                        text,
                        viewOnce: true
                    });
                }
            }
        } catch (err) {
            console.error('me.js error:', err);
        }
    }
};
