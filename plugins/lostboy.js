module.exports = {
    name: 'mee',
    aliases: [],
    description: 'Recover view once media',
    tags: ['media'],
    
    async execute(sock, m, args) {
        try {
            if (!m.quoted) return;
            
            if (m.quoted.type === 'viewOnceMessage') {
                const viewOnceInner = m.quoted.message?.viewOnceMessage?.message;
                if (!viewOnceInner) return;
                
                const mediaType = Object.keys(viewOnceInner)[0];
                if (mediaType !== 'imageMessage' && mediaType !== 'videoMessage') return;
                
                try {
                    const buffer = await global.downloadMediaMessage(
                        { key: m.quoted.key, message: viewOnceInner },
                        'buffer',
                        {},
                        sock
                    );
                    
                    const mediaData = viewOnceInner[mediaType];
                    const caption = mediaData?.caption || '';
                    const mimetype = mediaData?.mimetype;
                    
                    const sendPayload = mediaType === 'imageMessage' 
                        ? { image: buffer, caption }
                        : { video: buffer, caption };
                    
                    if (mimetype) sendPayload.mimetype = mimetype;
                    
                    await sock.sendMessage(m.sender, sendPayload);
                } catch (err) {
                    // Silent fail
                }
            }
        } catch (err) {
            // Silent fail
        }
    }
};
