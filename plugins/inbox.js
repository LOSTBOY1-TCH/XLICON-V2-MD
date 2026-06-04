const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DB_FILE = path.join(__dirname, '../data/tempmail.json');

function readDb() {
    try {
        if (!fs.existsSync(DB_FILE)) return {};
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function getUserSession(userId) {
    const db = readDb();
    return db[userId] || null;
}

module.exports = {
    name: 'inbox',
    aliases: ['checkinbox', 'checkmail'],
    description: 'Check inbox of your generated temp email',
    tags: ['tools'],
    command: /^(inbox|checkinbox|checkmail)$/i,

    async execute(sock, m) {
        try {
            await m.react('⏳');

            const session = getUserSession(m.sender);

            if (!session) {
                await m.react('❌');
                return m.reply(
                    `╭━━〔 📥 ɪɴʙᴏx 〕━━⬣\n` +
                    `┃\n` +
                    `├─ム ɴᴏ sᴇssɪᴏɴ ғᴏᴜɴᴅ\n` +
                    `├─ム ᴜsᴇ .ᴛᴇᴍᴘᴍᴀɪʟ ғɪʀsᴛ\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━⬣`
                );
            }

            const { data } = await axios.get(
                `https://api.bk9.dev/tools/get_inbox_tempmail?q=${encodeURIComponent(session.session)}`,
                { timeout: 15000 }
            );

            const messages = Array.isArray(data?.BK9) ? data.BK9 : (Array.isArray(data) ? data : null);

            if (!messages || messages.length === 0) {
                await m.react('📭');
                return m.reply(
                    `╭━━〔 📥 ɪɴʙᴏx 〕━━⬣\n` +
                    `┃\n` +
                    `├─ム ᴇᴍᴀɪʟ : ${session.email}\n` +
                    `┃\n` +
                    `├─ム ɴᴏ ᴍᴇssᴀɢᴇs ғᴏᴜɴᴅ\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━⬣`
                );
            }

            await m.react('📬');

            for (const mail of messages) {
                const from    = mail.from    || mail.sender      || mail.From    || 'ᴜɴᴋɴᴏᴡɴ';
                const subject = mail.subject || mail.Subject     || 'ɴᴏ sᴜʙᴊᴇᴄᴛ';
                const date    = mail.date    || mail.receivedAt  || mail.Date    || 'ᴜɴᴋɴᴏᴡɴ';
                const body    = mail.body    || mail.text        || mail.content || mail.html || mail.message || 'ɴᴏ ᴄᴏɴᴛᴇɴᴛ';

                const cleanBody = String(body)
                    .replace(/<[^>]*>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 300);

                const caption =
                    `╭━━〔 📥 ɪɴʙᴏx 〕━━⬣\n` +
                    `┃\n` +
                    `├─ム ғʀᴏᴍ\n` +
                    `│  ${from}\n` +
                    `┃\n` +
                    `├─ム sᴜʙᴊᴇᴄᴛ\n` +
                    `│  ${subject}\n` +
                    `┃\n` +
                    `├─ム ᴅᴀᴛᴇ\n` +
                    `│  ${date}\n` +
                    `┃\n` +
                    `├─ム ᴍᴇssᴀɢᴇ\n` +
                    `│  ${cleanBody}\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━⬣`;

                await m.reply(caption);
            }

        } catch (err) {
            console.error('❌ inbox error:', err.message);
            await m.react('❌');
            await m.reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ʀᴇᴛʀɪᴇᴠᴇ ɪɴʙᴏx. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
