module.exports = {
    name: 'autostatuslike',
    aliases: ['asl'],
    description: 'Auto react to WhatsApp statuses',

    async execute(sock, m, args) {
        try {
            if (!global.autoStatusConfig) {
                global.autoStatusConfig = {
                    enabled: false
                };
            }

            const command = args[0]?.toLowerCase();

            if (!command || command === 'status') {
                const status = global.autoStatusConfig.enabled ? 'ᴏɴ' : 'ᴏғғ';
                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs
│
│ ᪣ sᴛᴀᴛᴜs: ${status}
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'on') {
                global.autoStatusConfig.enabled = true;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs
│
│ ᪣ sᴛᴀᴛᴜs: ᴏɴ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'off') {
                global.autoStatusConfig.enabled = false;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs
│
│ ᪣ sᴛᴀᴛᴜs: ᴏғғ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            const helpMsg = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs
│
│ ᪣ .autostatus on - Enable
│ ᪣ .autostatus off - Disable
│ ᪣ .autostatus - Show status
│
╰─────────◆────────╯`;

            return await m.reply(helpMsg);

        } catch (err) {
            console.error('AutoStatus error:', err);
            await m.reply('❌ Error: ' + err.message);
        }
    }
};
