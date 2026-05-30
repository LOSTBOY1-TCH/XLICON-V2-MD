global.autoStatusView = global.autoStatusView ?? true;

module.exports = {
    name: 'autostatusview',
    description: 'Auto view all status updates',
    aliases: ['statusview', 'asv'],
    tags: ['owner'],
    command: /^\.?(autostatusview|statusview|asv)$/i,

    async execute(sock, m, args) {
        if (!m.isOwner) return m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
        const arg = args[0]?.toLowerCase();
        if (arg === 'on') {
            global.autoStatusView = true;
            return m.reply('┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ\n│\n│ sᴛᴀᴛᴜs: ᴏɴ ✅\n│ ʙᴏᴛ ᴡɪʟʟ ᴀᴜᴛᴏ ᴠɪᴇᴡ\n│ ᴀʟʟ sᴛᴀᴛᴜs ᴜᴘᴅᴀᴛᴇs\n╰─────────◆────────╯');
        }
        if (arg === 'off') {
            global.autoStatusView = false;
            return m.reply('┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ\n│\n│ sᴛᴀᴛᴜs: ᴏꜰꜰ ❌\n╰─────────◆────────╯');
        }
        return m.reply(`┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ\n│\n│ sᴛᴀᴛᴜs: ${global.autoStatusView ? 'ᴏɴ ✅' : 'ᴏꜰꜰ ❌'}\n│ ᴜsᴀɢᴇ: .asv on/off\n╰─────────◆────────╯`);
    }
};
