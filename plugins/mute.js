module.exports = {
    name: 'mute',
    description: 'Mute the group (only admins can text)',
    aliases: ['silence', 'mutegroup'],
    tags: ['group'],
    command: /^\.?(mute|silence|mutegroup)$/i,

    async execute(sock, m, args) {
        try {
            if (!m.isGroup) {
                return await m.reply('ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs!');
            }

            if (!m.isBotAdmin) {
                return await m.reply('ʙᴏᴛ ᴍᴜsᴛ ʙᴇ ᴀɴ ᴀᴅᴍɪɴ ᴛᴏ ᴄʜᴀɴɢᴇ ɢʀᴏᴜᴘ sᴇᴛᴛɪɴɢs!');
            }

            if (!m.isOwner && !m.isAdmin) {
                return await m.reply('ᴏɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴏʀ ᴏᴡɴᴇʀs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!');
            }

            await sock.groupSettingUpdate(m.from, 'announcement');
            
            await m.reply('✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ! ᴏɴʟʏ ᴀᴅᴍɪɴs ᴄᴀɴ sᴇɴᴅ ᴍᴇssᴀɢᴇs ɴᴏᴡ.');
        } catch (error) {
            console.error('Error in mute command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴍᴜᴛᴇ ɢʀᴏᴜᴘ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
