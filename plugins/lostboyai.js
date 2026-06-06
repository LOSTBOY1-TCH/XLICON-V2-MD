const axios = require('axios');

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION & COMMAND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const BK9_API = 'https://api.bk9.dev/ai/BK92';
const MODEL = 'openai/gpt-oss-120b';

// Command requirements mapping - maps action names to plugin names and requirements
const COMMAND_CONFIG = {
	// Reply
	'reply': { plugin: null, requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// Media/Tools
	'tts': { plugin: 'tts', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'img': { plugin: 'img', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'sticker': { plugin: 'sticker', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ssweb': { plugin: 'ssweb', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ocr': { plugin: 'ocr', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'toaudio': { plugin: 'toaudio', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'pp': { plugin: 'profilepic', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// Status
	'ping': { plugin: 'ping', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'uptime': { plugin: 'uptime', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'alive': { plugin: 'alive', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// Downloaders
	'ytdl': { plugin: 'ytdl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ytsearch': { plugin: 'ytsearch', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'tiktok': { plugin: 'tiktok', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'instadl': { plugin: 'instadl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// Group Management (require admin or owner)
	'tagall': { plugin: 'tagall', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'kick': { plugin: 'kick', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'mute': { plugin: 'mute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'unmute': { plugin: 'unmute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'welcome_on': { plugin: 'welcome', param: 'on', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'welcome_off': { plugin: 'welcome', param: 'off', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'goodbye_on': { plugin: 'goodbye', param: 'on', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'goodbye_off': { plugin: 'goodbye', param: 'off', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'poll': { plugin: 'poll', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	
	// Owner Only
	'setprefix': { plugin: 'setprefix', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'setpp': { plugin: 'setpp', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'update': { plugin: 'update', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	
	// Search/Info
	'aisearch': { plugin: 'ai-search', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ipstalk': { plugin: 'ipstalk', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'gituser': { plugin: 'gituserstalk', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'gitrepo': { plugin: 'gitrepostalk', requiresGroup: false, requiresAdmin: false, requiresOwner: false }
};

const SYSTEM_PROMPT = `You are Lostboy AI 🤖, an intelligent WhatsApp assistant and bot controller.

════════════════════ COMMAND EXECUTION ════════════════════
When a user asks to execute a command, respond with ONLY JSON:
{"action":"<command_name>","params":{...}}

Available commands:
reply, tts, img, sticker, ssweb, ocr, toaudio, pp,
ping, uptime, alive,
ytdl, ytsearch, tiktok, instadl,
tagall, kick, mute, unmute, welcome_on, welcome_off, goodbye_on, goodbye_off, poll,
setprefix, setpp, update,
aisearch, ipstalk, gituser, gitrepo

════════════════════ OUTPUT RULES ════════════════════
1. For actions → Output ONLY JSON, no other text
2. For questions → Output ONLY plain text, no JSON
3. NEVER mix text + JSON
4. NEVER output unknown commands
5. Admin commands work only if user is admin/owner (bot will enforce)
6. Owner commands work only if user is owner (bot will enforce)

════════════════════ SECURITY ════════════════════
Never reveal passwords, API keys, session files, tokens, or secrets.`;

// Confirmation messages
const ACTION_CONFIRMATIONS = {
	reply: null,
	ping: null,
	uptime: null,
	alive: null,
	tts: '✅ ᴠᴏɪᴄᴇ ᴍᴇssᴀɢᴇ sᴇɴᴛ.',
	img: '✅ ɪᴍᴀɢᴇ(s) sᴇɴᴛ.',
	sticker: '✅ sᴛɪᴄᴋᴇʀ ᴄʀᴇᴀᴛᴇᴅ.',
	ssweb: '✅ sᴄʀᴇᴇɴsʜᴏᴛ ᴛᴀᴋᴇɴ.',
	ocr: null,
	toaudio: '✅ ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴀᴜᴅɪᴏ.',
	pp: null,
	ytdl: '✅ ʏᴏᴜᴛᴜʙᴇ ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	ytsearch: null,
	tiktok: '✅ ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	instadl: '✅ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	tagall: '✅ ᴛᴀɢɢᴇᴅ ᴇᴠᴇʀʏᴏɴᴇ.',
	kick: '✅ ᴍᴇᴍʙᴇʀ ᴋɪᴄᴋᴇᴅ.',
	mute: '✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ.',
	unmute: '✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ.',
	welcome_on: '✅ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇs ᴇɴᴀʙʟᴇᴅ.',
	welcome_off: '✅ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇs ᴅɪsᴀʙʟᴇᴅ.',
	goodbye_on: '✅ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴇɴᴀʙʟᴇᴅ.',
	goodbye_off: '✅ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴅɪsᴀʙʟᴇᴅ.',
	poll: '✅ ᴘᴏʟʟ ᴄʀᴇᴀᴛᴇᴅ.',
	setprefix: '✅ ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ.',
	setpp: '✅ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ.',
	update: '✅ ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ sᴛᴀʀᴛᴇᴅ.',
	aisearch: null,
	ipstalk: null,
	gituser: null,
	gitrepo: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧬 PARSER LAYER: Robust JSON Extraction
// ═══════════════════════════════════════════════════════════════════════════════

function parseActionFromText(text) {
	if (!text || typeof text !== 'string') return null;
	const trimmed = text.trim();

	// Strategy 1: Entire response is JSON
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (parsed?.action) return parsed;
		} catch (e) { }
	}

	// Strategy 2: Extract {..."action"...}
	const jsonPattern = /\{[^{}]*"action"[^{}]*\}/g;
	const matches = trimmed.match(jsonPattern);
	if (matches) {
		for (const match of matches) {
			try {
				const parsed = JSON.parse(match);
				if (parsed?.action) return parsed;
			} catch (e) { }
		}
	}

	// Strategy 3: Find balanced braces
	const openBrace = trimmed.indexOf('{');
	if (openBrace !== -1) {
		let braceCount = 0, closePos = -1;
		for (let i = openBrace; i < trimmed.length; i++) {
			if (trimmed[i] === '{') braceCount++;
			if (trimmed[i] === '}') {
				braceCount--;
				if (braceCount === 0) { closePos = i; break; }
			}
		}
		if (closePos !== -1) {
			const potentialJson = trimmed.substring(openBrace, closePos + 1);
			try {
				const parsed = JSON.parse(potentialJson);
				if (parsed?.action) return parsed;
			} catch (e) { }
		}
	}

	// Strategy 4: Try to fix common errors
	const bracketContent = trimmed.match(/\{[\s\S]*\}/);
	if (bracketContent) {
		let jsonStr = bracketContent[0]
			.replace(/```json\s*/g, '')
			.replace(/```\s*/g, '');
		try {
			const parsed = JSON.parse(jsonStr);
			if (parsed?.action) return parsed;
		} catch (e) {
			try {
				jsonStr = jsonStr
					.replace(/,\s*}/g, '}')
					.replace(/,\s*]/g, ']')
					.replace(/'/g, '"');
				const parsed = JSON.parse(jsonStr);
				if (parsed?.action) return parsed;
			} catch (e2) { }
		}
	}

	return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 EXECUTION LAYER: Safe Action Execution with Proper Admin Checks
// ═══════════════════════════════════════════════════════════════════════════════

async function executeAction(sock, m, plugins, action, params) {
	const config = COMMAND_CONFIG[action];
	
	if (!config) {
		await m.reply('❌ ᴜɴᴋɴᴏᴡɴ ᴄᴏᴍᴍᴀɴᴅ.');
		return false;
	}

	// Check group requirement
	if (config.requiresGroup && !m.isGroup) {
		await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
		return false;
	}

	// Check admin requirement (must be admin OR owner) ← PROPER ADMIN CHECK
	if (config.requiresAdmin && !m.isOwner && !m.isAdmin) {
		await m.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.');
		return false;
	}

	// Check owner requirement
	if (config.requiresOwner && !m.isOwner) {
		await m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
		return false;
	}

	// Handle reply command
	if (action === 'reply') {
		await m.reply(params.text || '...');
		return true;
	}

	// Get plugin
	const pluginName = config.plugin;
	const plugin = plugins.get(pluginName.toLowerCase());
	
	if (!plugin) {
		console.error(`Plugin "${pluginName}" not found`);
		await m.reply(`❌ Plugin not found: ${pluginName}`);
		return false;
	}

	try {
		// Build args based on action
		let args = [];

		if (action === 'tts') {
			if (!params.text) {
				await m.reply('❌ ɴᴏ ᴛᴇxᴛ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.text];
		} else if (action === 'img') {
			if (!params.query) {
				await m.reply('❌ ɴᴏ ɪᴍᴀɢᴇ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query, params.count || 1];
		} else if (action === 'ssweb') {
			if (!params.url) {
				await m.reply('❌ ɴᴏ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url, params.device || 'desktop'];
		} else if (action === 'ytdl') {
			if (!params.url) {
				await m.reply('❌ ɴᴏ ʏᴏᴜᴛᴜʙᴇ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		} else if (action === 'ytsearch') {
			if (!params.query) {
				await m.reply('❌ ɴᴏ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
		} else if (action === 'tiktok') {
			if (!params.url) {
				await m.reply('❌ ɴᴏ ᴛɪᴋᴛᴏᴋ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		} else if (action === 'instadl') {
			if (!params.url) {
				await m.reply('❌ ɴᴏ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		} else if (action === 'tagall') {
			args = [params.message || ''];
		} else if (action === 'kick') {
			args = [params.target || ''];
		} else if (action === 'poll') {
			if (!params.name || !Array.isArray(params.options) || params.options.length < 2) {
				await m.reply('❌ ᴘᴏʟʟ ɴᴇᴇᴅs ᴀ ɴᴀᴍᴇ ᴀɴᴅ ᴀᴛ ʟᴇᴀsᴛ 2 ᴏᴘᴛɪᴏɴs.');
				return false;
			}
			args = [[params.name, ...params.options].join(';')];
		} else if (action === 'welcome_on' || action === 'welcome_off') {
			args = [config.param];
		} else if (action === 'goodbye_on' || action === 'goodbye_off') {
			args = [config.param];
		} else if (action === 'setprefix') {
			args = [params.prefix || '.'];
		} else if (action === 'aisearch') {
			if (!params.query) {
				await m.reply('❌ ɴᴏ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
		} else if (action === 'ipstalk') {
			if (!params.ip) {
				await m.reply('❌ ɴᴏ ɪᴘ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.ip];
		} else if (action === 'gituser') {
			if (!params.username) {
				await m.reply('❌ ɴᴏ ᴜsᴇʀɴᴀᴍᴇ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.username];
		} else if (action === 'gitrepo') {
			if (!params.query) {
				await m.reply('❌ ɴᴏ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
		}

		// Execute plugin
		await plugin.execute(sock, m, args, plugins);
		return true;

	} catch (err) {
		console.error(`Error executing ${action}:`, err.message);
		await m.reply(`❌ ᴇʀʀᴏʀ: ${err.message}`);
		return false;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════

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

			const apiUrl = `${BK9_API}?q=${encodeURIComponent(query)}&BK9=${encodeURIComponent(SYSTEM_PROMPT)}&model=${encodeURIComponent(MODEL)}`;
			const { data } = await axios.get(apiUrl, { timeout: 30000 });

			const raw = data?.BK9 || data?.answer || data?.response || data?.result || data?.text || (typeof data === 'string' ? data : null);

			if (!raw) {
				await m.react('❌');
				return m.reply('❌ ɴᴏ ʀᴇsᴘᴏɴsᴇ ғʀᴏᴍ ʟᴏsᴛʙᴏʏ ᴀɪ.');
			}

			const answer = raw.trim();
			const parsedAction = parseActionFromText(answer);

			if (parsedAction) {
				const action = parsedAction.action?.toLowerCase?.();
				const params = parsedAction.params || {};

				if (!action || !COMMAND_CONFIG[action]) {
					await m.react('❌');
					return m.reply(`❌ ᴜɴᴋɴᴏᴡɴ ᴄᴏᴍᴍᴀɴᴅ: ${action}`);
				}

				try {
					const executed = await executeAction(sock, m, plugins || global._pluginMap || new Map(), action, params);

					if (executed) {
						await m.react('✅');
						const confirmMsg = ACTION_CONFIRMATIONS[action];
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

					await m.react('❌');
					return;

				} catch (execErr) {
					console.error('❌ Lostboy executeAction error:', execErr.message);
					await m.react('❌');
					return m.reply(
						`╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
						`┃\n` +
						`├─ム ❌ ᴇʀʀᴏʀ: ${execErr.message}\n` +
						`┃\n` +
						`╰━━━━━━━━━━⬣`
					);
				}
			}

			// Fallback to text reply
			if (answer.startsWith('{') && answer.includes('"action') && !answer.endsWith('}')) {
				await m.react('❌');
				return m.reply('❌ ᴀɪ ʀᴇsᴘᴏɴᴅᴇᴅ ᴡɪᴛʜ ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ. ᴛʀʏ ᴀɢᴀɪɴ.');
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
