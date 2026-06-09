const axios = require('axios');

module.exports = {
    name: 'seedream',
    description: 'Transform images using SEE Dream AI endpoint',
    aliases: ['seedream', 'dream', 'dreami'],
    tags: ['ai', 'image', 'tools'],
    command: /^\.?(seedream|dream|dreami)/i,

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
                    '┌─ム sᴇᴇ ᴅʀᴇᴀᴍ ᴛʀᴀɴsꜰᴏʀᴍ\n' +
                    '│\n' +
                    '│ ᴜsᴀɢᴇ:\n' +
                    '│ 1️⃣ Qᴜᴏᴛᴇ ᴀɴ ɪᴍᴀɢᴇ & ʀᴇᴘʟʏ: .seedream\n' +
                    '│ 2️⃣ .seedream <ɪᴍᴀɢᴇ_ᴜʀʟ>\n' +
                    '│\n' +
                    '│ ᴀʟɪᴀsᴇs: .dream, .dreami\n' +
                    '│\n' +
                    '│ ᴇxᴀᴍᴘʟᴇ:\n' +
                    '│ .seedream https://example.com/image.jpg\n' +
                    '│\n' +
                    '│ > ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ\n' +
                    '╰─────────◆────────╯'
                );
            }

            await m.reply('⏳ ᴀᴘᴘʟʏɪɴɢ sᴇᴇ ᴅʀᴇᴀᴍ ᴛʀᴀɴsꜰᴏʀᴍᴀᴛɪᴏɴ...');

            try {
                // Prepare the request payload
                const payload = {
                    image: imageUrl,
                    model: 'seedream-50' // Specify the model version from the endpoint
                };

                // Send to the API endpoint
                const response = await axios({
                    method: 'POST',
                    url: 'https://apis.davidcyril.name.ng/endpoints/imageToImage/',
                    data: payload,
                    params: {
                        endpoint: 'seedream-50'
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 60000
                });

                const result = response.data;

                // Check if we got a valid response
                if (!result || (!result.image && !result.result && !result.url && !result.data && !result.output)) {
                    return m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴘʀᴏᴄᴇss ɪᴍᴀɢᴇ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
                }

                // Extract the image URL from response (try multiple possible fields)
                let processedImageUrl = result.image || result.result || result.url || result.data || result.output;

                // If it's an array, take the first element
                if (Array.isArray(processedImageUrl)) {
                    processedImageUrl = processedImageUrl[0];
                }

                if (!processedImageUrl) {
                    return m.reply('❌ ɪɴᴠᴀʟɪᴅ ʀᴇsᴘᴏɴsᴇ ꜰʀᴏᴍ ᴀᴘɪ.');
                }

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
                    caption: '🌙 sᴇᴇ ᴅʀᴇᴀᴍ ᴛʀᴀɴsꜰᴏʀᴍᴀᴛɪᴏɴ ᴄᴏᴍᴘʟᴇᴛᴇ\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏsᴛʙᴏʏ',
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363230794474148@newsletter',
                            newsletterName: 'sᴇᴇ ᴅʀᴇᴀᴍ ᴛʀᴀɴsꜰᴏʀᴍ',
                            serverMessageId: 1
                        }
                    }
                }, { quoted: m });

            } catch (apiErr) {
                console.error('API Error:', apiErr.message);
                
                if (apiErr.response?.status === 429) {
                    return m.reply('⏱️ ᴛᴏᴏ ᴍᴀɴʏ ʀᴇqᴜᴇsᴛs. ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ᴀ ᴍᴏᴍᴇɴᴛ.');
                } else if (apiErr.response?.status === 404) {
                    return m.reply('❌ ᴇɴᴅᴘᴏɪɴᴛ ɴᴏᴛ ꜰᴏᴜɴᴅ. ᴘʟᴇᴀsᴇ ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴅᴇᴠᴇʟᴏᴘᴇʀ.');
                }
                
                return m.reply('❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴘʀᴏᴄᴇss ɪᴍᴀɢᴇ. ᴘʟᴇᴀsᴇ ᴄʜᴇᴄᴋ ʏᴏᴜʀ ɪᴍᴀɢᴇ ᴀɴᴅ ᴛʀʏ ᴀɢᴀɪɴ.');
            }

        } catch (error) {
            console.error('SEE Dream Error:', error.message);
            m.reply('❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
        }
    }
};
