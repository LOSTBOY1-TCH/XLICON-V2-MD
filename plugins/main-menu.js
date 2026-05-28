const axios = require('axios');

module.exports = {
name: 'menu',
description: 'Show available bot commands',
aliases: ['help', 'cmdlist', 'commands'],

async execute(sock, m) {    
    const prefix = global.BOT_PREFIX || '.';    
    
    const now = new Date();
    
    const date = now.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'Africa/Accra'
    });
    
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true,
        timeZone: 'Africa/Accra'
    });
    
    const botOwner = global.ownerName  || 'ABZTECH';
    
    const user = m.pushName || m.sender?.split('@')[0] || 'User';
    
    const menuText = `

┌─ム xʟɪᴄᴏɴ ᴍᴜʟᴛɪᴅᴇᴠɪᴄᴇ
│ ᴏᴡɴᴇʀ: ${botOwner}
│ ᴜsᴇʀ: ${user}
│ ᴅᴀᴛᴇ: ${date}
│ ᴛɪᴍᴇ: ${time} (GMT)
│ ᴘʀᴇғɪx: ${prefix}
╰──────────────────╯

┌─ム ᴀᴠᴀɪʟᴀʙʟᴇ ᴄᴏᴍᴍᴀɴᴅs
│
├─ム *ɢᴇɴᴇʀᴀʟ*
│ ᪣ ${prefix}ᴀᴜᴛᴏʀɪsᴇ
│ ᪣ ${prefix}ᴀʟɪᴠᴇ
│ ᪣ ${prefix}ᴘɪɴɢ
│ ᪣ ${prefix}ᴜᴘᴛɪᴍᴇ
│ ᪣ ${prefix}ᴏᴡɴᴇʀ
│ ᪣ ${prefix}ᴄʀᴇᴀᴛᴏʀ
│ ᪣ ${prefix}sᴇʟғ
│ ᪣ ${prefix}sᴇᴛᴘʀᴇғɪx
│ ᪣ ${prefix}ʟᴏɢɢᴇʀ
│ ᪣ ${prefix}ᴇxᴇᴄ
│ ᪣ ${prefix}ᴍᴇɴᴜ2
│
├─ム *ᴅᴏᴡɴʟᴏᴀᴅᴇʀs*
│ ᪣ ${prefix}ᴛɪᴋᴛᴏᴋ / ${prefix}ᴛᴛ
│ ᪣ ${prefix}ʏᴛᴅʟ / ${prefix}ʏᴛᴍᴘ3
│ ᪣ ${prefix}ʏᴛsᴇᴀʀᴄʜ
│ ᪣ ${prefix}ɪɢ
│ ᪣ ${prefix}sᴀᴠᴇ
│ ᪣ ${prefix}ᴛᴏᴜʀʟ
│ ᪣ ${prefix}ᴛᴏᴀᴜᴅɪᴏ
│
├─ム *ᴛᴏᴏʟs*
│ ᪣ ${prefix}sᴛɪᴄᴋᴇʀ
│ ᪣ ${prefix}ᴏᴄʀ
│ ᪣ ${prefix}ᴛᴛs
│ ᪣ ${prefix}ᴘᴏʟʟ
│ ᪣ ${prefix}sʜᴀᴢᴀᴍ
│ ᪣ ${prefix}ɪᴘsᴛᴀʟᴋ
│ ᪣ ${prefix}ᴄᴏᴍᴘʀᴇss
│ ᪣ ${prefix}ɪᴍɢ
│ ᪣ ${prefix}ᴘᴘ
│ ᪣ ${prefix}sᴇᴛᴘᴘ
│ ᪣ ${prefix}ʀᴇᴛᴀɢ
│ ᪣ ${prefix}ᴠɪᴇᴡᴏɴᴄᴇ
│ ᪣ ${prefix}ᴛᴡᴇᴇᴛ
│ ᪣ ${prefix}ᴅᴇʟᴛᴍᴘ
│
├─ム *ᴀɪ*
│ ᪣ ${prefix}ᴀɪ
│ ᪣ ${prefix}ᴀɪ-sᴇᴀʀᴄʜ
│ ᪣ ${prefix}ᴀɪᴠ
│ ᪣ ${prefix}ɢᴇɴ
│ ᪣ ${prefix}ɢᴇɴ2
│
├─ム *ғᴜɴ*
│ ᪣ ${prefix}ʙʟᴜᴇ
│ ᪣ ${prefix}ᴄᴏᴜᴘʟᴇᴘᴘ
│
├─ム *ɢʀᴏᴜᴘ*
│ ᪣ ${prefix}ᴛᴀɢᴀʟʟ
│ ᪣ ${prefix}ᴛᴀɢᴀʟʟ1
│ ᪣ ${prefix}ᴛᴀɢᴍᴇ
│ ᪣ ${prefix}ᴀʟʟ
│ ᪣ ${prefix}ɢʀᴏᴜᴘ
│ ᪣ ${prefix}ᴡᴇʟᴄᴏᴍᴇ
│ ᪣ ${prefix}ᴊᴏɪɴ
│ ᪣ ${prefix}ʟᴇᴀᴠᴇ
│ ᪣ ${prefix}ᴍᴇɴᴛɪᴏɴ-ᴏᴡɴᴇʀ
│ ᪣ ${prefix}ᴀᴜᴛᴏʀᴇᴀᴄᴛ
│ ᪣ ${prefix}ᴋɪᴄᴋ
│ ᪣ ${prefix}ɢsᴛᴀᴛᴜs
│
├─ム *ᴄʜᴀɴɴᴇʟ*
│ ᪣ ${prefix}ᴄʜᴀɴɴᴇʟɪᴅ
│ ᪣ ${prefix}ᴜᴘᴄʜ
│
├─ム *ᴏᴡɴᴇʀ*
│ ᪣ ${prefix}ᴀᴅᴅᴏᴡɴᴇʀ
│ ᪣ ${prefix}ʀᴇᴍᴏᴠᴇᴏᴡɴᴇʀ
│
╰─────────◆────────╯

> 「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」
`.trim();

    try {    
        const imageBuffer = (await axios.get(global.menuImage, { responseType: 'arraybuffer' })).data;    
        
        await m.reply(imageBuffer, { 
            caption: menuText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363230794474148@newsletter',
                    newsletterName: '──𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                    serverMessageId: 1
                }
            }
        });
        
    } catch (err) {    
        console.error('Menu error:', err);    
        return;
    }    
}

};
