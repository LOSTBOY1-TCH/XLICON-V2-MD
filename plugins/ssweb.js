const axios = require('axios');

module.exports = {
    name: 'ssweb',
    aliases: ['screenshot', 'ss'],
    description: 'Take screenshot of a website',
    tags: ['tools'],
    
    async execute(sock, m, args) {
        try {
            const url = args[0];
            const device = (args[1] || 'desktop').toLowerCase();
            
            if (!url) {
                return await m.reply(`┌─ം sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ
│
│ ᪣ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴜʀʟ
│
│ ᴜsᴀɢᴇ: .ssweb <url> [device]
│ ᴅᴇᴠɪᴄᴇs: desktop, mobile, tablet
│
╰─────────◆────────╯`);
            }
            
            // Validate device
            if (!['desktop', 'mobile', 'tablet'].includes(device)) {
                return await m.reply(`┌─ം sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ
│
│ ᪣ ɪɴᴠᴀʟɪᴅ ᴅᴇᴠɪᴄᴇ: ${device}
│
│ ᴀʟʟᴏᴡᴇᴅ: desktop, mobile, tablet
│
╰─────────◆────────╯`);
            }
            
            // Validate URL format
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return await m.reply(`┌─ം sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ
│
│ ᪣ ɪɴᴠᴀʟɪᴅ ᴜʀʟ
│
│ ᴜʀʟ ᴍᴜsᴛ sᴛᴀʀᴛ ᴡɪᴛʜ:
│ http:// ᴏʀ https://
│
╰─────────◆────────╯`);
            }
            
            await m.reply(`┌─ം sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ
│
│ ᪣ ᴄᴀᴘᴛᴜʀɪɴɢ ${device} ᴠɪᴇᴡ...
│
╰─────────◆────────╯`);
            
            const encodedUrl = encodeURIComponent(url);
            const apiUrl = `https://api.bk9.dev/tools/screenshot?url=${encodedUrl}&device=${device}`;
            
            console.log(`📸 Fetching screenshot from: ${apiUrl}`);
            
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.data || response.data.length === 0) {
                console.error('❌ Empty response from screenshot API');
                return await m.reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴄᴀᴘᴛᴜʀᴇ ᴛʜᴀᴛ ᴡᴇʙsɪᴛᴇ.');
            }
            
            const buffer = Buffer.from(response.data, 'binary');
            
            const caption = `┌─ം sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ
│
│ ᪣ ᴜʀʟ: ${url}
│ ᪣ ᴅᴇᴠɪᴄᴇ: ${device}
│
╰─────────◆────────╯`;
            
            await m.reply(buffer, {
                caption: caption,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363230794474148@newsletter',
                        newsletterName: '──𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙎𝙘𝙧𝙚𝙚𝙣𝙨𝙝𝙤𝙩 」',
                        serverMessageId: 1
                    }
                }
            });
            
            console.log(`✅ Screenshot taken successfully for ${url}`);
            
        } catch (error) {
            console.error('❌ Screenshot error:', error.message);
            
            let errorMsg = error.message;
            
            if (error.code === 'ECONNABORTED') {
                errorMsg = 'Request timeout - website took too long to respond';
            } else if (error.response?.status === 404) {
                errorMsg = 'Website not found';
            } else if (error.response?.status === 403) {
                errorMsg = 'Access denied to that website';
            } else if (error.message.includes('getaddrinfo')) {
                errorMsg = 'Invalid URL or domain not found';
            }
            
            await m.reply(`┌─ം sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ
│
│ ❌ ᴇʀʀᴏʀ
│ ${errorMsg}
│
╰─────────◆────────╯`);
        }
    }
};
