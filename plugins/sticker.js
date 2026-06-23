const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

module.exports = {
    name: 'sticker',
    description: 'Convert an image to sticker',
    aliases: ['s', 'stkr'],
    tags: ['main'],
    command: /^\.?sticker$/i,

    async execute(sock, m) {
        try {
            const target = m.quoted || m;

            const hasImage =
                target?.message?.imageMessage ||
                (target?.isMedia && target?.mediaType === 'image');

            if (!hasImage) {
                return m.reply('Please reply to an image or send an image with .sticker command.');
            }

            if (typeof target.download !== 'function') {
                return m.reply('Cannot download the image.');
            }

            const mediaBuffer = await target.download();

            // Write input to temp file
            const tmpIn = path.join(os.tmpdir(), `sticker_in_${Date.now()}.jpg`);
            const tmpOut = path.join(os.tmpdir(), `sticker_out_${Date.now()}.webp`);
            fs.writeFileSync(tmpIn, mediaBuffer);

            // Try ffmpeg conversion (fast path)
            try {
                await execAsync(
                    `ffmpeg -y -i "${tmpIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0" "${tmpOut}"`,
                    { timeout: 30000 }
                );
                const stickerBuffer = fs.readFileSync(tmpOut);
                await sock.sendMessage(m.from, { sticker: stickerBuffer });
            } catch (ffErr) {
                // Fallback: send original image resized via Jimp as PNG (no webp)
                const JimpImport = require('jimp');
                const Jimp = JimpImport.read ? JimpImport : (JimpImport.Jimp || JimpImport.default);
                const image = await Jimp.read(mediaBuffer);
                image.contain(512, 512);
                const pngBuf = await image.getBufferAsync('image/png');
                await sock.sendMessage(m.from, { sticker: pngBuf });
            }

            // Cleanup
            try { fs.unlinkSync(tmpIn); } catch (_) {}
            try { fs.unlinkSync(tmpOut); } catch (_) {}

            console.log(`Sticker sent in chat ${m.from}`);
        } catch (err) {
            console.error('Sticker command error:', err);
            m.reply('Failed to create sticker.');
        }
    }
};
