module.exports = {
    name: 'autostatuslike',
    aliases: ['asl'],
    description: 'Auto react to WhatsApp statuses',
    tags: ['automation'],

    async execute(sock, m, args) {
        try {
            if (!global.autoStatusLike) {
                global.autoStatusLike = false;
            }

            const command = args[0]?.toLowerCase();

            if (!command || command === 'status') {
                const status = global.autoStatusLike ? 'ᴏɴ' : 'ᴏғғ';
                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ʟɪᴋᴇ
│
│ ᪣ ʟɪᴋᴇ: ${status}
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'on') {
                global.autoStatusLike = true;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ʟɪᴋᴇ
│
│ ᪣ ʟɪᴋᴇ: ᴏɴ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'off') {
                global.autoStatusLike = false;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ʟɪᴋᴇ
│
│ ᪣ ʟɪᴋᴇ: ᴏғғ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            const helpMsg = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ʟɪᴋᴇ
│
│ ᪣ .autostatuslike on - Enable
│ ᪣ .autostatuslike off - Disable
│ ᪣ .autostatuslike - Show status
│
╰─────────◆────────╯`;

            return await m.reply(helpMsg);

        } catch (err) {
            console.error('❌ AutoStatusLike error:', err);
            await m.reply('❌ Error: ' + err.message);
        }
    }
};
