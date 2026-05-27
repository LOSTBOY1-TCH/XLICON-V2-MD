module.exports = {
    name: 'unmute',
    description: 'Unmute the group (everyone can text)',
    aliases: ['unsilence', 'unmutegroup'],
    tags: ['group'],
    command: /^\.?(unmute|unsilence|unmutegroup)$/i,

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

            await sock.groupSettingUpdate(m.from, 'not_announcement');
            
            await m.reply('✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ! ᴇᴠᴇʀʏᴏɴᴇ ᴄᴀɴ sᴇɴᴅ ᴍᴇssᴀɢᴇs ɴᴏᴡ.');
        } catch (error) {
            console.error('Error in unmute command:', error);
            await m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴜɴᴍᴜᴛᴇ ɢʀᴏᴜᴘ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
