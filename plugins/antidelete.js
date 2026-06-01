module.exports = {
    name: 'antidelete',
    aliases: ['ad'],
    description: 'Toggle and manage antidelete system',

    async execute(sock, m, args) {
        try {
            if (!global.antiDeleteStore) {
                global.antiDeleteStore = {};
            }

            const chatId = m.from;
            const command = args[0]?.toLowerCase();

            if (!command || command === 'status') {
                const isEnabled = global.antiDeleteStore[chatId]?.enabled || false;
                const status = isEnabled ? 'ᴏɴ' : 'ᴏғғ';
                
                const statusCard = `┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ
│
│ ᪣ sᴛᴀᴛᴜs: ${status}
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'on') {
                if (!global.antiDeleteStore[chatId]) {
                    global.antiDeleteStore[chatId] = {
                        enabled: true,
                        messages: {}
                    };
                } else {
                    global.antiDeleteStore[chatId].enabled = true;
                }

                const statusCard = `┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ
│
│ ᪣ sᴛᴀᴛᴜs: ᴏɴ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'off') {
                if (!global.antiDeleteStore[chatId]) {
                    global.antiDeleteStore[chatId] = {
                        enabled: false,
                        messages: {}
                    };
                } else {
                    global.antiDeleteStore[chatId].enabled = false;
                }

                const statusCard = `┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ
│
│ ᪣ sᴛᴀᴛᴜs: ᴏғғ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            const helpMsg = `┌─ム ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ
│
│ ᪣ .antidelete on - Enable
│ ᪣ .antidelete off - Disable
│ ᪣ .antidelete - Show status
│
╰─────────◆────────╯`;

            return await m.reply(helpMsg);

        } catch (err) {
            console.error('Antidelete error:', err);
            await m.reply('❌ Antidelete error: ' + err.message);
        }
    }
};
