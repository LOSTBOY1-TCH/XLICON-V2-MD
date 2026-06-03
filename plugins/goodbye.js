const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SETTINGS_FILE = path.join(__dirname, '../data/groupSettings.json');

function ensureSettingsFile() {
    const dataDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}));
    }
}

function getGroupSettings(groupId) {
    ensureSettingsFile();
    try {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        return data[groupId] || { welcome: false, goodbye: false };
    } catch {
        return { welcome: false, goodbye: false };
    }
}

function setGroupSettings(groupId, settings) {
    ensureSettingsFile();
    try {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        data[groupId] = { ...getGroupSettings(groupId), ...settings };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving group settings:', err);
    }
}

module.exports = {
    name: 'goodbye',
    aliases: 'goodbyemsg',
    description: 'Toggle goodbye messages on or off in the group',
    enabled: true,

    async execute(sock, m, args) {
        if (!m.isGroup) {
            return m.reply('❌ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs.');
        }

        const metadata = await sock.groupMetadata(m.from);
        const sender = metadata.participants.find(p =>
            p.id === m.sender || p.phoneNumber === m.sender.split('@')[0]
        );

        const isAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';
        const isGroupOwner = sender?.id === metadata.owner || m.isGroupOwner;

        if (!isAdmin && !isGroupOwner && !m.isOwner) {
            return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
        }

        const currentSettings = getGroupSettings(m.from);
        const currentStatus = currentSettings.goodbye;

        if (!args[0]) {
            return m.reply(
                `⚡ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs: ${currentStatus ? '✅ ON' : '❌ OFF'}\n\nᴜsᴀɢᴇ: ${global.BOT_PREFIX}goodbye on|off`
            );
        }

        const option = args[0].toLowerCase();

        if (option === 'on') {
            setGroupSettings(m.from, { goodbye: true });
            await m.reply('✅ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴇɴᴀʙʟᴇᴅ.');
        } else if (option === 'off') {
            setGroupSettings(m.from, { goodbye: false });
            await m.reply('❌ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴅɪsᴀʙʟᴇᴅ.');
        } else {
            await m.reply('❌ ᴜsᴇ `on` ᴏʀ `ᴏғғ`.');
        }
    }
};
