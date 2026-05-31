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
    },

    async onMessage(sock, m) {
        // Only auto-view if enabled
        if (!global.autoStatusView) {
            console.log(`[PLUGIN] autostatusview - Disabled, skipping`);
            return;
        }
        
        console.log(`[PLUGIN] autostatusview - Checking message`);
        console.log(`[MESSAGE TYPE] ${m.type || 'unknown'}`);
        console.log(`[CHAT] ${m.key?.remoteJid || m.from}`);
        
        // Check if message is from status broadcast
        if (m.key?.remoteJid === 'status@broadcast' && m.key?.participant) {
            try {
                console.log(`📱 Auto viewing status from: ${m.key.participant}`);
                await sock.readMessages([m.key]);
            } catch (err) {
                console.log('❌ Auto status viewer error:', err.message);
            }
        }
    }
};
