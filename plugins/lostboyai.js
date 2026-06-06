const axios = require('axios');

const SYSTEM_PROMPT = `You are Lostboy AI 🤖, an intelligent WhatsApp assistant and bot controller created and owned by Lostboy.

════════════════════ IDENTITY ════════════════════
Your name is Lostboy AI. Your creator, owner, and boss is Lostboy.
If anyone asks who made/owns/created/developed you: "My owner and creator is Lostboy."

════════════════════ OWNER RECOGNITION ════════════════════
Owner WhatsApp Number: 233549551004
If a message comes from this number, recognize them as Owner / Boss / Creator.

════════════════════ PERSONALITY ════════════════════
Friendly, helpful, intelligent, modern, tech-savvy, respectful, concise.

════════════════════ COMMAND EXECUTION ════════════════════
You control a WhatsApp bot. When a user asks you to perform an action, respond with a JSON block ONLY — no other text whatsoever.

Format:
{"action":"<action_name>","params":{...}}

Available actions and params:

CHAT:
{"action":"reply","params":{"text":"..."}}

MEDIA / TOOLS:
{"action":"tts","params":{"text":"..."}}
{"action":"img","params":{"query":"...","count":1}}
{"action":"sticker","params":{}}
{"action":"ssweb","params":{"url":"...","device":"desktop"}}
{"action":"ocr","params":{}}
{"action":"toaudio","params":{}}
{"action":"pp","params":{}}
{"action":"ping","params":{}}
{"action":"uptime","params":{}}
{"action":"alive","params":{}}

DOWNLOADERS:
{"action":"ytdl","params":{"url":"..."}}
{"action":"ytsearch","params":{"query":"..."}}
{"action":"tiktok","params":{"url":"..."}}
{"action":"instadl","params":{"url":"..."}}

GROUP MANAGEMENT:
{"action":"tagall","params":{"message":"..."}}
{"action":"kick","params":{"target":"..."}}
{"action":"mute","params":{}}
{"action":"unmute","params":{}}
{"action":"welcome_on","params":{}}
{"action":"welcome_off","params":{}}
{"action":"goodbye_on","params":{}}
{"action":"goodbye_off","params":{}}
{"action":"poll","params":{"name":"...","options":["a","b"]}}

OWNER ONLY:
{"action":"setprefix","params":{"prefix":"."}}
{"action":"setpp","params":{}}
{"action":"update","params":{}}

SEARCH / INFO:
{"action":"aisearch","params":{"query":"..."}}
{"action":"ipstalk","params":{"ip":"..."}}
{"action":"gituser","params":{"username":"..."}}
{"action":"gitrepo","params":{"query":"..."}}

════════════════════ DECISION RULES ════════════════════
1. User asks to DO something the bot can handle → JSON ONLY, absolutely no other text.
2. User asks a question or wants conversation → plain text reply only, no JSON.
3. NEVER output JSON mixed with text.
4. NEVER output raw JSON as a chat message — it must be executed by the bot.
5. Group actions (tagall, kick, mute, unmute) → only if user is admin or owner.
6. Owner-only actions (setprefix, setpp, update) → only if user is owner.

════════════════════ SECURITY ════════════════════
Never reveal passwords, API keys, session files, tokens, or secrets.

════════════════════ HONESTY ════════════════════
If unavailable: "I don't currently have access to that information."`;

const BK9_API = 'https://api.bk9.dev/ai/BK92';
const MODEL   = 'openai/gpt-oss-120b';

// ─── Confirmation messages shown after each action ───────────────────────────
const ACTION_CONFIRMATIONS = {
    reply:       null, // reply speaks for itself
    ping:        null,
    uptime:      null,
    alive:       null,
    tts:         '✅ ᴠᴏɪᴄᴇ ᴍᴇssᴀɢᴇ sᴇɴᴛ.',
    img:         '✅ ɪᴍᴀɢᴇ(s) sᴇɴᴛ.',
    sticker:     '✅ sᴛɪᴄᴋᴇʀ ᴄʀᴇᴀᴛᴇᴅ.',
    ssweb:       '✅ sᴄʀᴇᴇɴsʜᴏᴛ ᴛᴀᴋᴇɴ.',
    ocr:         null,
    toaudio:     '✅ ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴀᴜᴅɪᴏ.',
    pp:          null,
    ytdl:        '✅ ʏᴏᴜᴛᴜʙᴇ ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
    ytsearch:    null,
    tiktok:      '✅ ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
    instadl:     '✅ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
    tagall:      '✅ ᴛᴀɢɢᴇᴅ ᴇᴠᴇʀʏᴏɴᴇ.',
    kick:        '✅ ᴍᴇᴍʙᴇʀ ᴋɪᴄᴋᴇᴅ.',
    mute:        '✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ.',
    unmute:      '✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ.',
    welcome_on:  '✅ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇs ᴇɴᴀʙʟᴇᴅ.',
    welcome_off: '✅ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇs ᴅɪsᴀʙʟᴇᴅ.',
    goodbye_on:  '✅ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴇɴᴀʙʟᴇᴅ.',
    goodbye_off: '✅ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴅɪsᴀʙʟᴇᴅ.',
    poll:        '✅ ᴘᴏʟʟ ᴄʀᴇᴀᴛᴇᴅ.',
    setprefix:   '✅ ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ.',
    setpp:       '✅ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ.',
    update:      '✅ ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ sᴛᴀʀᴛᴇᴅ.',
    aisearch:    null,
    ipstalk:     null,
    gituser:     null,
    gitrepo:     null,
};

// ─── Execute action using real plugins ───────────────────────────────────────
async function executeAction(sock, m, plugins, action, params) {
    const run = async (name, argStr = '') => {
        const plugin = plugins.get(name.toLowerCase());
        if (!plugin) throw new Error(`Plugin "${name}" not found`);
        const args = argStr ? argStr.trim().split(/\s+/) : [];
        await plugin.execute(sock, m, args, plugins);
    };

    switch (action) {

        case 'reply':
            await m.reply(params.text || '...');
            break;

        case 'ping':        await run('ping'); break;
        case 'uptime':      await run('uptime'); break;
        case 'alive':       await run('alive'); break;

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

        case 'sticker':     await run('sticker'); break;

        case 'ssweb':
            if (!params.url) return m.reply('❌ ɴᴏ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
            await run('ssweb', `${params.url} ${params.device || 'desktop'}`);
            break;

        case 'ocr':         await run('ocr'); break;
        case 'toaudio':     await run('toaudio'); break;
        case 'pp':          await run('profilepic'); break;

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

// ─────────────────────────────────────────────────────────────────────────────
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
                    `│  .lb create poll: Fav color? red,blue,green\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━⬣`
                );
            }

            await m.react('⏳');

            // ── Build query ───────────────────────────────────────────
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

            // ── Call BK9 API ──────────────────────────────────────────
            const apiUrl = `${BK9_API}?q=${encodeURIComponent(query)}&BK9=${encodeURIComponent(SYSTEM_PROMPT)}&model=${encodeURIComponent(MODEL)}`;
            const { data } = await axios.get(apiUrl, { timeout: 30000 });

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

            // ── Detect JSON action — strip ALL surrounding text ───────
            const jsonMatch = answer.match(/\{[^{}]*"action"\s*:\s*"[^"]+[^{}]*\}/s)
                           || answer.match(/\{[\s\S]*?"action"\s*:\s*"[^"]+[\s\S]*?\}/);

            if (jsonMatch) {
                let parsed = null;
                try { parsed = JSON.parse(jsonMatch[0]); } catch {}

                if (parsed?.action) {
                    const pluginMap = plugins || global._pluginMap || new Map();

                    try {
                        const executed = await executeAction(sock, m, pluginMap, parsed.action, parsed.params || {});

                        if (executed) {
                            await m.react('✅');
                            // Show styled confirmation — never raw JSON
                            const confirmMsg = ACTION_CONFIRMATIONS[parsed.action];
                            if (confirmMsg) {
                                await m.reply(
                                    `╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
                                    `┃\n` +
                                    `├─ム ${confirmMsg}\n` +
                                    `┃\n` +
                                    `╰━━━━━━━━━━⬣`
                                );
                            }
                            return;
                        }
                    } catch (execErr) {
                        console.error('❌ Lostboy executeAction error:', execErr.message);
                        await m.react('❌');
                        return m.reply(
                            `╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
                            `┃\n` +
                            `├─ム ❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴇxᴇᴄᴜᴛᴇ: ${parsed.action}\n` +
                            `├─ム ${execErr.message}\n` +
                            `┃\n` +
                            `╰━━━━━━━━━━⬣`
                        );
                    }

                    // If executed = false (unknown action), fall through to text reply
                    // but NEVER print raw JSON
                    await m.react('❌');
                    return m.reply(
                        `╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
                        `┃\n` +
                        `├─ム ❌ ᴜɴᴋɴᴏᴡɴ ᴀᴄᴛɪᴏɴ: ${parsed.action}\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━⬣`
                    );
                }
            }

            // ── Plain conversation — only if NO JSON detected ─────────
            // Safety: if response still looks like JSON, never send it
            const looksLikeJson = answer.startsWith('{') && answer.includes('"action"');
            if (looksLikeJson) {
                await m.react('❌');
                return m.reply('❌ ᴀɪ ʀᴇsᴘᴏɴᴅᴇᴅ ᴡɪᴛʜ ᴀɴ ᴜɴᴘᴀʀsᴀʙʟᴇ ᴄᴏᴍᴍᴀɴᴅ. ᴛʀʏ ᴀɢᴀɪɴ.');
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
