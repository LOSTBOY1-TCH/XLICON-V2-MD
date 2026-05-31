global.autoStatusView = global.autoStatusView ?? true;

module.exports = {
    name: 'autostatusview',
    description: 'Auto view all status updates',
    aliases: ['statusview', 'asv'],
    tags: ['owner'],
    command: /^\.?(autostatusview|statusview|asv)$/i,

    async execute(sock, m, args) {
        if (!m.isOwner) return m.reply('❌ Owner only.');
        const arg = args[0]?.toLowerCase();
        if (arg === 'on') {
            global.autoStatusView = true;
            return m.reply('┌─▰ AUTO STATUS VIEW\n│\n│ STATUS: ON ✅\n│ BOT WILL AUTO VIEW\n│ ALL STATUS UPDATES\n╰─────────◆────────╯');
        }
        if (arg === 'off') {
            global.autoStatusView = false;
            return m.reply('┌─▰ AUTO STATUS VIEW\n│\n│ STATUS: OFF ❌\n╰─────────◆────────╯');
        }
        return m.reply(`┌─▰ AUTO STATUS VIEW\n│\n│ STATUS: ${global.autoStatusView ? 'ON ✅' : 'OFF ❌'}\n│ USAGE: .asv on/off\n╰─────────◆────────╯`);
    },

    async onMessage(sock, m) {
        // Only auto-view if enabled
        if (!global.autoStatusView) return;
        
        // Check if message is from status broadcast
        // m.key is available from the serialized message
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
