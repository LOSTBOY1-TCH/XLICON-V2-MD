module.exports = {
    name: 'autostatusview',
    aliases: ['asv'],
    description: 'Auto view WhatsApp statuses',
    tags: ['automation'],
    
    async execute(sock, m, args) {
        try {
            if (!global.autoStatusView) {
                global.autoStatusView = false;
            }

            const command = args[0]?.toLowerCase();

            if (!command || command === 'status') {
                const status = global.autoStatusView ? 'ᴏɴ' : 'ᴏғғ';
                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ
│
│ ᪣ ᴠɪᴇᴡ: ${status}
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'on') {
                global.autoStatusView = true;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ
│
│ ᪣ ᴠɪᴇᴡ: ᴏɴ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'off') {
                global.autoStatusView = false;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ
│
│ ᪣ ᴠɪᴇᴡ: ᴏғғ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            const helpMsg = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ
│
│ ᪣ .autostatusview on - Enable
│ ᪣ .autostatusview off - Disable
│ ᪣ .autostatusview - Show status
│
╰─────────◆────────╯`;

            return await m.reply(helpMsg);

        } catch (err) {
            console.error('❌ AutoStatusView error:', err);
            await m.reply('❌ Error: ' + err.message);
        }
    }
};
