const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DB_FILE = path.join(__dirname, '../data/tempmail.json');

function ensureDb() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

function readDb() {
    ensureDb();
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function writeDb(data) {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function saveSession(userId, email, session, expires) {
    const db = readDb();
    db[userId] = { email, session, expires, createdAt: new Date().toISOString() };
    writeDb(db);
}

module.exports = {
    name: 'tempmail',
    aliases: ['tmail', 'genmail'],
    description: 'Generate a temporary email address',
    tags: ['tools'],
    command: /^(tempmail|tmail|genmail)$/i,

    async execute(sock, m) {
        try {
            await m.react('⏳');

            const { data } = await axios.get('https://api.bk9.dev/tools/tempmail', { timeout: 15000 });

            if (!data?.status || !Array.isArray(data?.BK9) || data.BK9.length < 3) {
                await m.react('❌');
                return m.reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ᴛᴇᴍᴘ ᴍᴀɪʟ. ᴛʀʏ ᴀɢᴀɪɴ.');
            }

            const [email, session, expires] = data.BK9;

            saveSession(m.sender, email, session, expires);

            const caption =
                `╭━━〔 📧 ᴛᴇᴍᴘᴍᴀɪʟ 〕━━⬣\n` +
                `┃\n` +
                `├─ム ᴇᴍᴀɪʟ\n` +
                `│  ${email}\n` +
                `┃\n` +
                `├─ム sᴇssɪᴏɴ\n` +
                `│  ${session}\n` +
                `┃\n` +
                `├─ム ᴇxᴘɪʀᴇs\n` +
                `│  ${expires}\n` +
                `┃\n` +
                `├─ム ᴜsᴇ .ɪɴʙᴏx ᴛᴏ ᴄʜᴇᴄᴋ ᴍᴀɪʟs\n` +
                `┃\n` +
                `╰━━━━━━━━━━⬣`;

            await m.react('✅');
            await m.reply(caption);

        } catch (err) {
            console.error('❌ tempmail error:', err.message);
            await m.react('❌');
            await m.reply('❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
