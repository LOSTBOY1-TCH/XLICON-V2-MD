const { exec } = require('child_process');

module.exports = {
    name: 'update',
    description: 'Redeploy the bot server',
    aliases: ['redeploy', 'restart'],
    tags: ['owner'],
    command: /^\.?(update|redeploy|restart)$/i,

    async execute(sock, m) {
        if (!m.isOwner) return m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');

        await m.reply('┌─ム ᴜᴘᴅᴀᴛɪɴɢ...\n│\n│ ⏳ ᴘᴜʟʟɪɴɢ ʟᴀᴛᴇsᴛ ᴄʜᴀɴɢᴇs...\n╰─────────◆────────╯');

        exec('git pull', async (err, stdout) => {
            if (err) {
                await m.reply(`┌─ム ɢɪᴛ ᴘᴜʟʟ ꜰᴀɪʟᴇᴅ\n│\n│ ❌ ${err.message}\n╰─────────◆────────╯`);
            } else {
                await m.reply(`┌─ム ɢɪᴛ ᴘᴜʟʟ\n│\n│ ✅ ${stdout.trim() || 'Already up to date.'}\n│ ⏳ ʀᴇsᴛᴀʀᴛɪɴɢ...\n╰─────────◆────────╯`);
            }

            exec('pm2 restart all', async (err2, stdout2) => {
                if (err2) {
                    exec('npm start', () => {});
                    await m.reply('┌─ム ʀᴇsᴛᴀʀᴛ\n│\n│ ✅ ʀᴇsᴛᴀʀᴛɪɴɢ ᴠɪᴀ ɴᴘᴍ sᴛᴀʀᴛ...\n╰─────────◆────────╯');
                } else {
                    await m.reply('┌─ム ʀᴇsᴛᴀʀᴛ\n│\n│ ✅ ʙᴏᴛ ʀᴇsᴛᴀʀᴛᴇᴅ sᴜᴄᴄᴇssꜰᴜʟʟʏ\n│ ᴘᴍ2: ' + (stdout2?.split('\n')[0] || 'ok') + '\n╰─────────◆────────╯');
                }
            });
        });
    }
};
