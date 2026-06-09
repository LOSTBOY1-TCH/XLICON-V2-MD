const axios = require('axios');
const fetch = require('node-fetch');

module.exports = {
    name: 'gptimage',
    description: 'Transform images using GPT-Image-2 AI',
    aliases: ['gpt', 'gpti', 'gptimg'],
    tags: ['ai', 'image', 'tools'],
    command: /^\.?(gpt|gpti|gptimg)/i,

    async execute(sock, m, args) {
        try {
            let imageUrl = null;

            // Check if there's a quoted image
            if (m.quoted && m.quoted.type === 'imageMessage') {
                try {
                    const quotedImage = await m.quoted.download();
                    const base64Image = quotedImage.toString('base64');
                    imageUrl = `data:image/jpeg;base64,${base64Image}`;
                } catch (err) {
                    return m.reply('❌ Failed to download quoted image. Please try again.');
                }
            }
            // Check if URL is provided as argument
            else if (args[0] && args[0].startsWith('http')) {
                imageUrl = args[0];
            }
            // Check for image in current message
            else if (m.type === 'imageMessage') {
                try {
                    const image = await m.download();
                    const base64Image = image.toString('base64');
                    imageUrl = `data:image/jpeg;base64,${base64Image}`;
                } catch (err) {
                    return m.reply('❌ Failed to download image. Please try again.');
                }
            }
            else {
                return m.reply(
                    '┌─ム ɢᴘᴛ-ɪᴍᴀɢᴇ ᴛʀᴀɴsꜰᴏʀᴍ\n' +
                    '│\n' +
                    '│ ᴜsᴀɢᴇ:\n' +
                    '│ 1️⃣ Qᴜᴏᴛᴇ ᴀɴ ɪᴍᴀɢᴇ & ʀᴇᴘʟʏ: .gpt\n' +
                    '│ 2️⃣ .gpt <ɪᴍᴀɢᴇ_ᴜʀʟ>\n' +
                    '│\n' +
                    '│ ᴇxᴀᴍᴘʟᴇ:\n' +
                    '│ .gpt https://example.com/image.jpg\n' +
                    '│\n' +
                    '│ > ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ\n' +
                    '╰─────────◆────────╯'
                );
            }

            await m.reply('⏳ ᴘʀᴏᴄᴇssɪɴɢ ɪᴍᴀɢᴇ ᴡɪᴛʜ ɢᴘᴛ-ɪᴍᴀɢᴇ-2...');

            try {
                // Prepare the request payload
                const payload = {
                    image: imageUrl
                };

                // Send to the API endpoint
                const response = await axios({
                    method: 'POST',
                    url: 'https://apis.davidcyril.name.ng/imageToImage/gpt-image-2',
                    data: payload,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 60000
                });

                const result = response.data;

                // Check if we got a valid response
                if (!result || (!result.image && !result.result && !result.url && !result.data)) {
                    return m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴘʀᴏᴄᴇss ɪᴍᴀɢᴇ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
                }

                // Extract the image URL from response
                let processedImageUrl = result.image || result.result || result.url || result.data;

                // Download the processed image
                const imageResponse = await axios.get(processedImageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                const imageBuffer = Buffer.from(imageResponse.data);

                // Send the processed image
                await sock.sendMessage(m.from, {
                    image: imageBuffer,
                    caption: '✨ ɢᴘᴛ-ɪᴍᴀɢᴇ-2 ᴘʀᴏᴄᴇssɪɴɢ ᴄᴏᴍᴘʟᴇᴛᴇ\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ',
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363230794474148@newsletter',
                            newsletterName: 'ɢᴘᴛ-ɪᴍᴀɢᴇ ᴛʀᴀɴsꜰᴏʀᴍ',
                            serverMessageId: 1
                        }
                    }
                }, { quoted: m });

            } catch (apiErr) {
                console.error('API Error:', apiErr.message);
                
                if (apiErr.response?.status === 429) {
                    return m.reply('⏱️ ᴛᴏᴏ ᴍᴀɴʏ ʀᴇqᴜᴇsᴛs. ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ᴀ ᴍᴏᴍᴇɴᴛ.');
                }
                
                return m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴘʀᴏᴄᴇss ɪᴍᴀɢᴇ. ᴘʟᴇᴀsᴇ ᴄʜᴇᴄᴋ ʏᴏᴜʀ ɪᴍᴀɢᴇ ᴀɴᴅ ᴛʀʏ ᴀɢᴀɪɴ.');
            }

        } catch (error) {
            console.error('GPT Image Error:', error.message);
            m.reply('❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
