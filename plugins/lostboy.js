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

            // Unwrap viewonce messages to get the raw content
            const unwrapViewOnce = (msg) => {
                return msg?.viewOnceMessage?.message ||
                    msg?.viewOnceMessageV2?.message ||
                    msg?.viewOnceMessageV2Extension?.message ||
                    null;
            };

            const unwrapped = unwrapViewOnce(qMsg);
            const actualMsg = unwrapped || qMsg;
            const actualType = Object.keys(actualMsg || {})[0] || qType;

            if (actualType === 'imageMessage' || actualType === 'videoMessage') {
                const buffer = await downloadMediaMessage(
                    unwrapped 
                        ? { key: m.quoted.key, message: actualMsg }
                        : (m.quoted.raw || m.quoted),
                    'buffer', {}, sock
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
                    unwrapped 
                        ? { key: m.quoted.key, message: actualMsg }
                        : (m.quoted.raw || m.quoted),
                    'buffer', {}, sock
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
