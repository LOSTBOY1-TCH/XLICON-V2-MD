module.exports = {
    name: 'autostatusview',
    aliases: ['asv'],
    description: 'Auto view WhatsApp statuses',

    async execute(sock, m, args) {
        try {
            if (!global.autoStatusViewConfig) {
                global.autoStatusViewConfig = {
                    enabled: false
                };
            }

            const command = args[0]?.toLowerCase();

            if (!command || command === 'status') {
                const status = global.autoStatusViewConfig.enabled ? 'ᴏɴ' : 'ᴏғғ';
                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ
│
│ ᪣ sᴛᴀᴛᴜs: ${status}
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'on') {
                global.autoStatusViewConfig.enabled = true;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ
│
│ ᪣ sᴛᴀᴛᴜs: ᴏɴ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'off') {
                global.autoStatusViewConfig.enabled = false;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ
│
│ ᪣ sᴛᴀᴛᴜs: ᴏғғ
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
            console.error('AutoStatusView error:', err);
            await m.reply('❌ Error: ' + err.message);
        }
    }
};
