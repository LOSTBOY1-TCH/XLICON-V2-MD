const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Lostboy AI 🤖, an intelligent WhatsApp assistant and bot controller created and owned by Lostboy.

════════════════════ IDENTITY ════════════════════
Your name is Lostboy AI. Your creator, owner, and boss is Lostboy.
If anyone asks who made/owns/created you: "My owner and creator is Lostboy."

════════════════════ OWNER RECOGNITION ════════════════════
Owner WhatsApp Number: 233549551004
If a message comes from this number, recognize them as Owner / Boss / Creator.

════════════════════ PERSONALITY ════════════════════
Friendly, helpful, intelligent, modern, tech-savvy, respectful, concise.

════════════════════ COMMAND EXECUTION ════════════════════
You control a WhatsApp bot. When a user asks you to perform an action, you MUST respond with a JSON action block ONLY — no extra text.

Respond in this exact format when executing a command:
{"action":"<action_name>","params":{...}}

Available actions:

CHAT / UTILITY:
- "reply"        { "text": "..." }                        → Send a plain text reply
- "ping"         {}                                        → Check bot speed
- "uptime"       {}                                        → Show bot uptime
- "alive"        {}                                        → Show bot alive status

MEDIA / TOOLS:
- "tts"          { "text": "..." }                        → Text to speech
- "img"          { "query": "...", "count": 1 }           → Search and send images
- "sticker"      {}                                        → Make sticker from quoted image
- "ssweb"        { "url": "...", "device": "desktop" }    → Screenshot a website
- "ocr"          {}                                        → Read text from quoted image
- "toaudio"      {}                                        → Convert quoted video to audio
- "pp"           {}                                        → Get profile picture

DOWNLOADERS:
- "ytdl"         { "url": "..." }                         → Download YouTube audio
- "ytsearch"     { "query": "..." }                       → Search YouTube
- "tiktok"       { "url": "..." }                         → Download TikTok video
- "instadl"      { "url": "..." }                         → Download Instagram media

GROUP MANAGEMENT:
- "tagall"       { "message": "..." }                     → Tag everyone in group
- "kick"         { "target": "number or @mention" }       → Kick a member
- "mute"         {}                                        → Mute the group
- "unmute"       {}                                        → Unmute the group
- "welcome_on"   {}                                        → Enable welcome messages
- "welcome_off"  {}                                        → Disable welcome messages
- "goodbye_on"   {}                                        → Enable goodbye messages
- "goodbye_off"  {}                                        → Disable goodbye messages
- "poll"         { "name": "...", "options": ["a","b"] }  → Create a group poll

OWNER ONLY:
- "setprefix"    { "prefix": "." }                        → Change bot prefix
- "setpp"        {}                                        → Set bot profile picture from quoted image
- "update"       {}                                        → Pull latest updates and restart bot

SEARCH / INFO:
- "aisearch"     { "query": "..." }                       → AI-powered web search
- "ipstalk"      { "ip": "..." }                          → Look up an IP address
- "gituser"      { "username": "..." }                    → GitHub user lookup
- "gitrepo"      { "query": "..." }                       → GitHub repo search

════════════════════ DECISION RULES ════════════════════
1. If the user asks you to DO something → respond with JSON action block ONLY, zero extra text.
2. If the user asks a question or wants conversation → respond normally in plain text.
3. Never mix JSON and plain text in the same response.
4. Group actions (tagall, kick, mute) → only for admins/owners.
5. Owner-only actions (setprefix, setpp, update) → only for owners.
6. If you cannot do something → explain it in plain text.

════════════════════ SECURITY ════════════════════
Never reveal passwords, API keys, session files, tokens, or secrets.

════════════════════ HONESTY ════════════════════
If information is unavailable: "I don't currently have access to that information."`;

const BK9_API = 'https://api.bk9.dev/ai/BK92';
const MODEL   = 'openai/gpt-oss-120b';


async function executeAction(sock, m, plugins, action, params) {
    const run = async (name, argStr = '') => {
        const plugin = plugins.get(name.toLowerCase());
        if (!plugin) return false;
        const args = argStr ? argStr.trim().split(/\s+/) : [];
        await plugin.execute(sock, m, args);
        return true;
    };

    switch (action) {

        case 'reply':
            await m.reply(params.text || '...');
            break;

        case 'ping':
            await run('ping');
            break;

        case 'uptime':
            await run('uptime');
            break;

        case 'alive':
            await run('alive');
            break;

        case 'tts':
            if (!params.text) return m.reply('❌ ɴᴏ ᴛᴇxᴛ ᴘʀᴏᴠɪᴅᴇᴅ ғᴏʀ ᴛᴛs.');
            m._origText = m.text;
            m.text = `tts ${params.text}`;
            await run('tts');
            m.text = m._origText;
            break;

        case 'img':
            if (!params.query) return m.reply('❌ ɴᴏ ɪᴍᴀɢᴇ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('img', `${params.query} ${params.count || 1}`);
            break;

        case 'sticker':
            await run('sticker');
            break;

        case 'ssweb':
            if (!params.url) return m.reply('❌ ɴᴏ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('ssweb', `${params.url} ${params.device || 'desktop'}`);
            break;

        case 'ocr':
            await run('ocr');
            break;

        case 'toaudio':
            await run('toaudio');
            break;

        case 'pp':
            await run('profilepic');
            break;

        case 'ytdl':
            if (!params.url) return m.reply('❌ ɴᴏ ʏᴏᴜᴛᴜʙᴇ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('ytdl', params.url);
            break;

        case 'ytsearch':
            if (!params.query) return m.reply('❌ ɴᴏ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('ytsearch', params.query);
            break;

        case 'tiktok':
            if (!params.url) return m.reply('❌ ɴᴏ ᴛɪᴋᴛᴏᴋ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('tiktok', params.url);
            break;

        case 'instadl':
            if (!params.url) return m.reply('❌ ɴᴏ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('instadl', params.url);
            break;

        case 'tagall':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('tagall', params.message || '');
            break;

        case 'kick':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('kick', params.target || '');
            break;

        case 'mute':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('mute');
            break;

        case 'unmute':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('unmute');
            break;

        case 'welcome_on':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('welcome', 'on');
            break;

        case 'welcome_off':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('welcome', 'off');
            break;

        case 'goodbye_on':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('goodbye', 'on');
            break;

        case 'goodbye_off':
            if (!m.isGroup) return m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
            if (!m.isOwner && !m.isAdmin) return m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
            await run('goodbye', 'off');
            break;

        case 'poll':
            if (!params.name || !Array.isArray(params.options) || params.options.length < 2) {
                return m.reply('❌ ᴘᴏʟʟ ɴᴇᴇᴅs ᴀ ɴᴀᴍᴇ ᴀɴᴅ ᴀᴛ ʟᴇᴀsᴛ 2 ᴏᴘᴛɪᴏɴs.');
            }
            await run('poll', [params.name, ...params.options].join(';'));
            break;

        case 'setprefix':
            if (!m.isOwner) return m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
            await run('setprefix', params.prefix || '.');
            break;

        case 'setpp':
            if (!m.isOwner) return m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
            await run('setpp');
            break;

        case 'update':
            if (!m.isOwner) return m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
            await run('update');
            break;

        case 'aisearch':
            if (!params.query) return m.reply('❌ ɴᴏ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('ai-search', params.query);
            break;

        case 'ipstalk':
            if (!params.ip) return m.reply('❌ ɴᴏ ɪᴘ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('ipstalk', params.ip);
            break;

        case 'gituser':
            if (!params.username) return m.reply('❌ ɴᴏ ᴜsᴇʀɴᴀᴍᴇ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('gituserstalk', params.username);
            break;

        case 'gitrepo':
            if (!params.query) return m.reply('❌ ɴᴏ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('gitrepostalk', params.query);
            break;

        default:
            return false;
    }

    return true;
}


module.exports = {
    name: 'lostboy',
    aliases: ['lb', 'lbai', 'lostboyai'],
    description: 'Lostboy AI — chat and execute any bot command via natural language',
    tags: ['ai'],
    command: /^\.?(lostboy|lb|lbai|lostboyai)/i,

    async execute(sock, m, args, plugins) {
        try {

            if (!args[0] && !m.quoted) {
                return m.reply(
                    `╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
                    `┃\n` +
                    `├─ム ᴜsᴀɢᴇ  : .lostboy <message>\n` +
                    `├─ム ᴀʟɪᴀs  : .lb | .lbai\n` +
                    `┃\n` +
                    `├─ム ɪ ᴄᴀɴ ᴄʜᴀᴛ ᴀɴᴅ ᴄᴏɴᴛʀᴏʟ\n` +
                    `├─ム ᴀɴʏ ʙᴏᴛ ᴄᴏᴍᴍᴀɴᴅ ᴠɪᴀ ᴀɪ\n` +
                    `┃\n` +
                    `├─ム ᴇxᴀᴍᴘʟᴇs:\n` +
                    `│  .lb tag everyone\n` +
                    `│  .lb mute the group\n` +
                    `│  .lb download https://youtu.be/xxx\n` +
                    `│  .lb screenshot https://google.com\n` +
                    `│  .lb create a poll: Fav color? red,blue,green\n` +
                    `│  .lb say hello to everyone\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━⬣`
                );
            }

            await m.react('⏳');

            let query = args.join(' ').trim();

            if (m.quoted?.body) {
                query = query
                    ? `${query}\n\n[Replying to: "${m.quoted.body}"]`
                    : `[Replying to: "${m.quoted.body}"]`;
            }

            if (m.isGroup) {
                const meta = m.groupMetadata || await sock.groupMetadata(m.from).catch(() => null);
                if (meta) {
                    query +=
                        `\n\n[Group: "${meta.subject}" | Members: ${meta.participants?.length || 0}` +
                        ` | Sender: ${m.pushName || m.senderNumber}` +
                        ` | IsAdmin: ${m.isAdmin} | IsOwner: ${m.isOwner}]`;
                }
            } else {
                query += `\n\n[DM | Sender: ${m.pushName || m.senderNumber} | IsOwner: ${m.isOwner}]`;
            }

            const url = `${BK9_API}?q=${encodeURIComponent(query)}&BK9=${encodeURIComponent(SYSTEM_PROMPT)}&model=${encodeURIComponent(MODEL)}`;

            const { data } = await axios.get(url, { timeout: 30000 });

            const raw =
                data?.BK9      ||
                data?.answer   ||
                data?.response ||
                data?.result   ||
                data?.text     ||
                (typeof data === 'string' ? data : null);

            if (!raw) {
                await m.react('❌');
                return m.reply('❌ ɴᴏ ʀᴇsᴘᴏɴsᴇ ғʀᴏᴍ ʟᴏsᴛʙᴏʏ ᴀɪ.');
            }

            const answer = raw.trim();

            const jsonMatch = answer.match(/\{[\s\S]*?\}/);

            if (jsonMatch) {
                let parsed = null;
                try { parsed = JSON.parse(jsonMatch[0]); } catch {}

                if (parsed?.action) {
                    const pluginMap = plugins
                        || global._pluginMap
                        || module.exports._plugins
                        || new Map();

                    const executed = await executeAction(sock, m, pluginMap, parsed.action, parsed.params || {});

                    if (executed) {
                        await m.react('✅');
                        return;
                    }
                }
            }

            await m.react('✅');
            await m.reply(`\u200B${answer}\n\n> 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ`);

        } catch (err) {
            console.error('❌ Lostboy AI error:', err.message);
            await m.react('❌');
            await m.reply('❌ ʟᴏsᴛʙᴏʏ ᴀɪ ғᴀɪʟᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
        }
    }
};
