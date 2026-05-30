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
            const qType = m.quoted.type;

            // Unwrap viewonce layers
            const unwrapped =
                qMsg?.viewOnceMessage?.message ||
                qMsg?.viewOnceMessageV2?.message ||
                qMsg?.viewOnceMessageV2Extension?.message ||
                null;

            const isViewOnce = !!unwrapped;
            const actualMsg = unwrapped || qMsg;
            const actualType = Object.keys(actualMsg || {})[0] || qType;

            // Build the correct message object for download
            const msgForDownload = {
                key: m.quoted.key,
                message: isViewOnce ? { [actualType]: actualMsg[actualType] } : actualMsg
            };

            if (actualType === 'imageMessage' || actualType === 'videoMessage') {
                const buffer = await downloadMediaMessage(
                    msgForDownload,
                    'buffer',
                    {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );

                if (actualType === 'imageMessage') {
                    await sock.sendMessage(dmJid, {
                        image: buffer,
                        caption: actualMsg?.imageMessage?.caption || ''
                    });
                } else {
                    await sock.sendMessage(dmJid, {
                        video: buffer,
                        caption: actualMsg?.videoMessage?.caption || '',
                        mimetype: actualMsg?.videoMessage?.mimetype || 'video/mp4'
                    });
                }
                await m.react('✅');

            } else if (actualType === 'audioMessage') {
                const buffer = await downloadMediaMessage(
                    msgForDownload,
                    'buffer',
                    {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );
                await sock.sendMessage(dmJid, {
                    audio: buffer,
                    mimetype: actualMsg?.audioMessage?.mimetype || 'audio/mp4',
                    ptt: actualMsg?.audioMessage?.ptt || false
                });
                await m.react('✅');

            } else if (actualType === 'stickerMessage') {
                const buffer = await downloadMediaMessage(
                    msgForDownload,
                    'buffer',
                    {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );
                await sock.sendMessage(dmJid, { sticker: buffer });
                await m.react('✅');

            } else {
                const text = m.quoted.body || '';
                if (text) {
                    await sock.sendMessage(dmJid, { text });
                    await m.react('✅');
                } else {
                    await m.react('❌');
                }
            }
        } catch (err) {
            console.error('me.js error:', err);
            await m.react('❌');
        }
    }
};
