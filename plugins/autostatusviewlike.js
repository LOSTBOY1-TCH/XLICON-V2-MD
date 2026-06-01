module.exports = {
    name: 'autostatusviewlike',
    aliases: ['asvl', 'autostat'],
    description: 'Control both auto status view and like',
    tags: ['automation'],

    async execute(sock, m, args) {
        try {
            if (global.autoStatusView === undefined) {
                global.autoStatusView = false;
            }
            if (global.autoStatusLike === undefined) {
                global.autoStatusLike = false;
            }

            const command = args[0]?.toLowerCase();

            if (!command || command === 'status') {
                const viewStatus = global.autoStatusView ? 'ᴏɴ' : 'ᴏғғ';
                const likeStatus = global.autoStatusLike ? 'ᴏɴ' : 'ᴏғғ';
                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ ʟɪᴋᴇ
│
│ ᪣ ᴠɪᴇᴡ: ${viewStatus}
│ ᪣ ʟɪᴋᴇ: ${likeStatus}
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'on') {
                global.autoStatusView = true;
                global.autoStatusLike = true;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ ʟɪᴋᴇ
│
│ ᪣ ᴠɪᴇᴡ: ᴏɴ
│ ᪣ ʟɪᴋᴇ: ᴏɴ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            if (command === 'off') {
                global.autoStatusView = false;
                global.autoStatusLike = false;

                const statusCard = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ ʟɪᴋᴇ
│
│ ᪣ ᴠɪᴇᴡ: ᴏғғ
│ ᪣ ʟɪᴋᴇ: ᴏғғ
│
╰─────────◆────────╯`;

                return await m.reply(statusCard);
            }

            const helpMsg = `┌─ム ᴀᴜᴛᴏ sᴛᴀᴛᴜs ᴠɪᴇᴡ ʟɪᴋᴇ
│
│ ᪣ .autostatusviewlike on - Enable both
│ ᪣ .autostatusviewlike off - Disable both
│ ᪣ .autostatusviewlike - Show status
│
╰─────────◆────────╯`;

            return await m.reply(helpMsg);

        } catch (err) {
            console.error('❌ AutoStatusViewLike error:', err);
            await m.reply('❌ Error: ' + err.message);
        }
    }
};
