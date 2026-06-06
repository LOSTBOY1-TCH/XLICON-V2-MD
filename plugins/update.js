const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

module.exports = {
    name: 'update',
    aliases: ['redeploy', 'restart', 'reboot'],
    description: 'Pull latest changes and redeploy the bot server',
    tags: ['owner'],
    command: /^\.?(update|redeploy|restart|reboot)$/i,

    async execute(sock, m) {
        if (!m.isOwner) {
            return m.reply(
                `╭━━〔 🔒 ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ 〕━━⬣\n` +
                `┃\n` +
                `├─ム ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n` +
                `┃\n` +
                `╰━━━━━━━━━━⬣`
            );
        }

        await m.react('⏳');

        await m.reply(
            `╭━━〔 🔄 ᴜᴘᴅᴀᴛᴇ 〕━━⬣\n` +
            `┃\n` +
            `├─ム sᴛᴀᴛᴜs  : sᴛᴀʀᴛɪɴɢ\n` +
            `├─ム sᴛᴇᴘ    : ᴘᴜʟʟɪɴɢ ʟᴀᴛᴇsᴛ ᴄʜᴀɴɢᴇs...\n` +
            `┃\n` +
            `╰━━━━━━━━━━⬣`
        );

        // ── STEP 1: git pull ──────────────────────────────────────────
        let gitOutput = '';
        let gitFailed = false;

        try {
            const { stdout, stderr } = await execAsync('git pull', { timeout: 30000 });
            gitOutput = stdout.trim() || stderr.trim() || 'Already up to date.';
        } catch (err) {
            gitFailed = true;
            gitOutput = err.message?.split('\n')[0] || 'git pull failed';
        }

        if (gitFailed) {
            await m.react('❌');
            return m.reply(
                `╭━━〔 🔄 ᴜᴘᴅᴀᴛᴇ 〕━━⬣\n` +
                `┃\n` +
                `├─ム sᴛᴇᴘ    : ɢɪᴛ ᴘᴜʟʟ\n` +
                `├─ム sᴛᴀᴛᴜs  : ❌ ғᴀɪʟᴇᴅ\n` +
                `├─ム ᴇʀʀᴏʀ   : ${gitOutput}\n` +
                `┃\n` +
                `├─ム ᴛɪᴘ: ᴄʜᴇᴄᴋ ɪɴᴛᴇʀɴᴇᴛ ᴏʀ ɢɪᴛ ʀᴇᴍᴏᴛᴇ\n` +
                `┃\n` +
                `╰━━━━━━━━━━⬣`
            );
        }

        await m.reply(
            `╭━━〔 🔄 ᴜᴘᴅᴀᴛᴇ 〕━━⬣\n` +
            `┃\n` +
            `├─ム sᴛᴇᴘ    : ɢɪᴛ ᴘᴜʟʟ\n` +
            `├─ム sᴛᴀᴛᴜs  : ✅ ᴅᴏɴᴇ\n` +
            `├─ム ᴏᴜᴛᴘᴜᴛ  : ${gitOutput.split('\n')[0]}\n` +
            `┃\n` +
            `├─ム sᴛᴇᴘ    : ᴄʜᴇᴄᴋɪɴɢ ᴅᴇᴘᴇɴᴅᴇɴᴄɪᴇs...\n` +
            `┃\n` +
            `╰━━━━━━━━━━⬣`
        );

        // ── STEP 2: npm install (only if package.json changed) ────────
        const needsInstall = gitOutput.toLowerCase().includes('package.json') ||
                             gitOutput.toLowerCase().includes('package-lock');

        if (needsInstall) {
            try {
                await execAsync('npm install --omit=dev', { timeout: 120000 });
                await m.reply(
                    `╭━━〔 🔄 ᴜᴘᴅᴀᴛᴇ 〕━━⬣\n` +
                    `┃\n` +
                    `├─ム sᴛᴇᴘ    : ɴᴘᴍ ɪɴsᴛᴀʟʟ\n` +
                    `├─ム sᴛᴀᴛᴜs  : ✅ ᴅᴇᴘᴇɴᴅᴇɴᴄɪᴇs ᴜᴘᴅᴀᴛᴇᴅ\n` +
                    `┃\n` +
                    `├─ム sᴛᴇᴘ    : ʀᴇsᴛᴀʀᴛɪɴɢ ʙᴏᴛ...\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━⬣`
                );
            } catch (err) {
                await m.reply(
                    `╭━━〔 🔄 ᴜᴘᴅᴀᴛᴇ 〕━━⬣\n` +
                    `┃\n` +
                    `├─ム sᴛᴇᴘ    : ɴᴘᴍ ɪɴsᴛᴀʟʟ\n` +
                    `├─ム sᴛᴀᴛᴜs  : ⚠️ ᴡᴀʀɴɪɴɢ\n` +
                    `├─ム ɴᴏᴛᴇ    : ${err.message?.split('\n')[0] || 'install warning'}\n` +
                    `├─ム          ᴄᴏɴᴛɪɴᴜɪɴɢ ʀᴇsᴛᴀʀᴛ...\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━⬣`
                );
            }
        } else {
            await m.reply(
                `╭━━〔 🔄 ᴜᴘᴅᴀᴛᴇ 〕━━⬣\n` +
                `┃\n` +
                `├─ム sᴛᴇᴘ    : ᴅᴇᴘᴇɴᴅᴇɴᴄɪᴇs\n` +
                `├─ム sᴛᴀᴛᴜs  : ✅ ɴᴏ ᴄʜᴀɴɢᴇs ɴᴇᴇᴅᴇᴅ\n` +
                `┃\n` +
                `├─ム sᴛᴇᴘ    : ʀᴇsᴛᴀʀᴛɪɴɢ ʙᴏᴛ...\n` +
                `┃\n` +
                `╰━━━━━━━━━━⬣`
            );
        }

        // ── STEP 3: restart ───────────────────────────────────────────
        // Try pm2 by name first, then pm2 restart all, then node fallback
        const pm2Name = 'Xlicon';

        const tryRestart = () => {
            exec(`pm2 restart ${pm2Name} --update-env`, (err1, stdout1) => {
                if (!err1) {
                    const line = stdout1?.split('\n').find(l => l.includes(pm2Name)) || 'restarted';
                    sock.sendMessage(m.from, {
                        text:
                            `╭━━〔 ✅ ᴜᴘᴅᴀᴛᴇ ᴄᴏᴍᴘʟᴇᴛᴇ 〕━━⬣\n` +
                            `┃\n` +
                            `├─ム ɢɪᴛ ᴘᴜʟʟ  : ✅\n` +
                            `├─ム ʀᴇsᴛᴀʀᴛ   : ✅ ᴘᴍ2 (${pm2Name})\n` +
                            `├─ム sᴛᴀᴛᴜs    : 🟢 ᴏɴʟɪɴᴇ\n` +
                            `┃\n` +
                            `├─ム ʙᴏᴛ ɪs ʙᴀᴄᴋ ᴏɴʟɪɴᴇ ⚡\n` +
                            `┃\n` +
                            `╰━━━━━━━━━━⬣`
                    }, { quoted: m });
                    return;
                }

                exec('pm2 restart all --update-env', (err2, stdout2) => {
                    if (!err2) {
                        sock.sendMessage(m.from, {
                            text:
                                `╭━━〔 ✅ ᴜᴘᴅᴀᴛᴇ ᴄᴏᴍᴘʟᴇᴛᴇ 〕━━⬣\n` +
                                `┃\n` +
                                `├─ム ɢɪᴛ ᴘᴜʟʟ  : ✅\n` +
                                `├─ム ʀᴇsᴛᴀʀᴛ   : ✅ ᴘᴍ2 (ᴀʟʟ)\n` +
                                `├─ム sᴛᴀᴛᴜs    : 🟢 ᴏɴʟɪɴᴇ\n` +
                                `┃\n` +
                                `├─ム ʙᴏᴛ ɪs ʙᴀᴄᴋ ᴏɴʟɪɴᴇ ⚡\n` +
                                `┃\n` +
                                `╰━━━━━━━━━━⬣`
                        }, { quoted: m });
                        return;
                    }

                    // pm2 not available — spawn detached node process
                    sock.sendMessage(m.from, {
                        text:
                            `╭━━〔 ✅ ᴜᴘᴅᴀᴛᴇ ᴄᴏᴍᴘʟᴇᴛᴇ 〕━━⬣\n` +
                            `┃\n` +
                            `├─ム ɢɪᴛ ᴘᴜʟʟ  : ✅\n` +
                            `├─ム ʀᴇsᴛᴀʀᴛ   : ✅ ɴᴏᴅᴇ (ғᴀʟʟʙᴀᴄᴋ)\n` +
                            `├─ム sᴛᴀᴛᴜs    : 🟢 ʀᴇsᴘᴀᴡɴɪɴɢ\n` +
                            `┃\n` +
                            `├─ム ʙᴏᴛ ɪs ʀᴇsᴛᴀʀᴛɪɴɢ ⚡\n` +
                            `┃\n` +
                            `╰━━━━━━━━━━⬣`
                    }, { quoted: m }).then(() => {
                        const { spawn } = require('child_process');
                        const child = spawn(process.execPath, ['index.js'], {
                            detached: true,
                            stdio: 'ignore',
                            cwd: process.cwd()
                        });
                        child.unref();
                        setTimeout(() => process.exit(0), 1500);
                    });
                });
            });
        };

        // Small delay so final message sends before restart fires
        setTimeout(tryRestart, 1200);
    }
};
