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

            const viewOnceContent =
                qMsg?.viewOnceMessage?.message ||
                qMsg?.viewOnceMessageV2?.message ||
                qMsg?.viewOnceMessageV2Extension?.message ||
                (qMsg?.[qType]?.viewOnce ? qMsg : null);

            const actualMsg = viewOnceContent ? viewOnceContent : qMsg;
            const actualType = Object.keys(actualMsg || {})[0] || qType;

            if (actualType === 'imageMessage' || actualType === 'videoMessage') {
                const buffer = await downloadMediaMessage(
                    { key: m.quoted.key, message: actualMsg },
                    'buffer', {}, sock
                );
                if (actualType === 'imageMessage') {
                    await sock.sendMessage(dmJid, {
                        image: buffer,
                        caption: actualMsg?.[actualType]?.caption || ''
                    });
                } else {
                    await sock.sendMessage(dmJid, {
                        video: buffer,
                        caption: actualMsg?.[actualType]?.caption || ''
                    });
                }
            } else if (actualType === 'audioMessage') {
                const buffer = await downloadMediaMessage(
                    { key: m.quoted.key, message: actualMsg },
                    'buffer', {}, sock
                );
                await sock.sendMessage(dmJid, {
                    audio: buffer,
                    mimetype: actualMsg?.audioMessage?.mimetype || 'audio/mp4',
                    ptt: actualMsg?.audioMessage?.ptt || false
                });
            } else {
                const text = m.quoted.body || '';
                if (text) await sock.sendMessage(dmJid, { text });
            }
        } catch (err) {
            console.error('me.js error:', err);
        }
    }
};
