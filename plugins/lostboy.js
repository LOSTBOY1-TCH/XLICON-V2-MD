const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'me',
    description: 'Send replied viewonce to your DM silently',
    tags: ['owner'],
    command: /^\.?me$/i,

    async execute(sock, m) {
        if (!m.isOwner) return;
        if (!m.quoted) return;

        // FIXED: Filter out bot JID from owner list, get real owner
        const ownerJid = global.owners?.find(jid => jid !== sock.user?.id && jid !== sock.user?.lid);
        if (!ownerJid) {
            console.log('[lostboy] No valid owner JID found (all are bot JID)');
            return;
        }

        const dmJid = ownerJid.includes('@') ? ownerJid : ownerJid + '@s.whatsapp.net';
        console.log(`[lostboy] Sending recovered media to owner: ${dmJid}`);

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
                        ephemeralExpiration: 86400 // 24 hours view-once
                    });
                } else {
                    await sock.sendMessage(dmJid, {
                        video: buffer,
                        caption: actualMsg?.videoMessage?.caption || '',
                        ephemeralExpiration: 86400 // 24 hours view-once
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
                    ptt: actualMsg?.audioMessage?.ptt || false
                });
            } else {
                const text = m.quoted.body || '';
                if (text) {
                    await sock.sendMessage(dmJid, { 
                        text
                    });
                }
            }
        } catch (err) {
            console.error('lostboy.js error:', err);
        }
    }
};
