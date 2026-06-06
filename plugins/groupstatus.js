const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'groupstatus',
    description: 'Send group status silently',
    aliases: ['gstatus'],
    tags: ['group'],
    command: /^\.?(groupstatus|gstatus)$/i,

    async execute(sock, m, args) {
        try {

            // ── Use handler.js pre-computed isOwner — handles LID normalization correctly
            if (!m.isOwner) return;

            const COLORS = {
                green:  0xFF25D366,
                red:    0xFFFF0000,
                blue:   0xFF0000FF,
                yellow: 0xFFFFFF00,
                purple: 0xFF800080,
                black:  0xFF000000,
                white:  0xFFFFFFFF,
                orange: 0xFFFFA500
            };

            let groupId;
            let messageText;
            let chosenColor = COLORS.green;
            let quoted = m.quoted || null;

            if (!m.isGroup) {
                if (quoted) {
                    // Quoted media from DM — first arg must be the group JID
                    if (!args[0]) {
                        return m.reply(
                            'ᴜsᴀɢᴇ: .gstatus <groupjid>\n' +
                            'ᴇxᴀᴍᴘʟᴇ: .gstatus 123456789-123456@g.us\n' +
                            '(ᴡɪᴛʜ ǫᴜᴏᴛᴇᴅ ᴍᴇᴅɪᴀ)'
                        );
                    }
                    groupId = args[0].trim();
                } else {
                    // Text mode — format: groupjid,text,color
                    const fullText = args.join(' ').trim();
                    if (!fullText) {
                        return m.reply(
                            'ᴜsᴀɢᴇ: .gstatus <groupjid>,<text>,<color>\n' +
                            'ᴇxᴀᴍᴘʟᴇ: .gstatus 123456789-123456@g.us,Hello!,blue\n' +
                            'ᴄᴏʟᴏʀs: green red blue yellow purple black white orange'
                        );
                    }

                    const parts = fullText.split(',').map(p => p.trim());

                    if (parts.length < 2) {
                        return m.reply('❌ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ɢʀᴏᴜᴘ ᴊɪᴅ ᴀɴᴅ ᴛᴇxᴛ sᴇᴘᴀʀᴀᴛᴇᴅ ʙʏ ᴄᴏᴍᴍᴀ.');
                    }

                    groupId    = parts[0];
                    messageText = parts[1];

                    if (parts[2] && COLORS[parts[2].toLowerCase()]) {
                        chosenColor = COLORS[parts[2].toLowerCase()];
                    }
                }
            } else {
                // Inside a group — target is the current group
                groupId = m.from;

                // If no quoted message, require text in args
                if (!quoted && args.length === 0) {
                    return m.reply('❌ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴛᴇxᴛ ᴏʀ ǫᴜᴏᴛᴇ ᴀ ᴍᴇᴅɪᴀ ᴍᴇssᴀɢᴇ.');
                }

                if (!quoted) {
                    const parts = args.join(' ').split(',').map(p => p.trim());
                    messageText = parts[0];
                    if (parts[1] && COLORS[parts[1].toLowerCase()]) {
                        chosenColor = COLORS[parts[1].toLowerCase()];
                    }
                }
            }

            // ── Build inner message ───────────────────────────────────
            let innerMessage;

            if (quoted) {
                const qMsg = quoted.message;

                if (qMsg?.imageMessage) {
                    const buffer = await quoted.download();
                    const media = await prepareWAMessageMedia(
                        { image: buffer, caption: qMsg.imageMessage.caption || '' },
                        { upload: sock.waUploadToServer }
                    );
                    innerMessage = { imageMessage: media.imageMessage };

                } else if (qMsg?.videoMessage) {
                    const buffer = await quoted.download();
                    const media = await prepareWAMessageMedia(
                        { video: buffer, caption: qMsg.videoMessage.caption || '' },
                        { upload: sock.waUploadToServer }
                    );
                    innerMessage = { videoMessage: media.videoMessage };

                } else if (qMsg?.audioMessage) {
                    const buffer = await quoted.download();
                    const media = await prepareWAMessageMedia(
                        {
                            audio: buffer,
                            mimetype: qMsg.audioMessage.mimetype || 'audio/mp4',
                            ptt: qMsg.audioMessage.ptt || false
                        },
                        { upload: sock.waUploadToServer }
                    );
                    innerMessage = { audioMessage: media.audioMessage };

                } else {
                    return m.reply('❌ ᴜɴsᴜᴘᴘᴏʀᴛᴇᴅ ᴍᴇᴅɪᴀ ᴛʏᴘᴇ. ᴜsᴇ ɪᴍᴀɢᴇ, ᴠɪᴅᴇᴏ, ᴏʀ ᴀᴜᴅɪᴏ.');
                }

            } else {
                if (!messageText) return m.reply('❌ ɴᴏ ᴛᴇxᴛ ᴘʀᴏᴠɪᴅᴇᴅ.');

                innerMessage = {
                    extendedTextMessage: {
                        text: messageText,
                        backgroundArgb: chosenColor,
                        font: 1
                    }
                };
            }

            // ── Build and relay the group status message ──────────────
            const content = {
                groupStatusMessageV2: {
                    message: innerMessage
                }
            };

            // Guard: proto.Message.fromObject may not exist in all RC builds
            let protoMessage;
            try {
                protoMessage = proto.Message.fromObject(content);
            } catch {
                protoMessage = content;
            }

            const msg = generateWAMessageFromContent(
                groupId,
                protoMessage,
                { userJid: sock.user.id }
            );

            await sock.relayMessage(
                groupId,
                msg.message,
                { messageId: msg.key.id }
            );

            if (!m.isGroup) {
                await m.reply('✅ ɢʀᴏᴜᴘ sᴛᴀᴛᴜs sᴇɴᴛ.');
            }

        } catch (err) {
            console.error('❌ GroupStatus Error:', err);
            await m.reply('❌ ᴇʀʀᴏʀ: ' + (err.message || 'unknown')).catch(() => {});
        }
    }
};
