module.exports = {
    name: 'mee',
    aliases: [],
    description: 'Recover view once media',
    tags: ['media'],
    
    async execute(sock, m, args) {
        try {
            if (!m.quoted) {
                console.log('❌ .mee: No quoted message found');
                return;
            }
            
            if (m.quoted.type === 'viewOnceMessage') {
                const viewOnceInner = m.quoted.message?.viewOnceMessage?.message;
                if (!viewOnceInner) {
                    console.log('❌ .mee: View once message structure invalid');
                    return;
                }
                
                const mediaType = Object.keys(viewOnceInner)[0];
                if (mediaType !== 'imageMessage' && mediaType !== 'videoMessage') {
                    console.log(`❌ .mee: Unsupported media type: ${mediaType}`);
                    return;
                }
                
                try {
                    console.log(`📥 .mee: Downloading ${mediaType} from view once...`);
                    
                    const buffer = await global.downloadMediaMessage(
                        { key: m.quoted.key, message: viewOnceInner },
                        'buffer',
                        {},
                        sock
                    );
                    
                    if (!buffer) {
                        console.log('❌ .mee: Failed to download media (buffer empty)');
                        return;
                    }
                    
                    const mediaData = viewOnceInner[mediaType];
                    const caption = mediaData?.caption || '';
                    const mimetype = mediaData?.mimetype;
                    
                    const sendPayload = mediaType === 'imageMessage' 
                        ? { image: buffer, caption }
                        : { video: buffer, caption };
                    
                    if (mimetype) sendPayload.mimetype = mimetype;
                    
                    // Send to current user's DM (m.sender)
                    await sock.sendMessage(m.sender, sendPayload);
                    console.log(`✅ .mee: ${mediaType} recovered and sent to user's DM (${m.sender})`);
                    
                } catch (downloadErr) {
                    console.error('❌ .mee: Download error:', downloadErr.message);
                    console.error(downloadErr);
                }
            } else {
                console.log(`❌ .mee: Quoted message is not viewOnceMessage (type: ${m.quoted.type})`);
            }
        } catch (err) {
            console.error('❌ .mee: Command error:', err.message);
            console.error(err);
        }
    }
};
