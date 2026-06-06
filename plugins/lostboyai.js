const axios = require('axios');

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION & COMMAND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const BK9_API = 'https://api.bk9.dev/ai/BK92';
const MODEL = 'openai/gpt-oss-120b';
const OWNER_JID = '233549551004@s.whatsapp.net';

// Comprehensive command mapping with all available commands
const COMMAND_CONFIG = {
	// Chat/Reply
	'reply': { plugin: null, requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// General Commands
	'alive': { plugin: 'alive', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ping': { plugin: 'ping', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'uptime': { plugin: 'uptime', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'menu': { plugin: 'main-menu', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'help': { plugin: 'main-menu', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'creator': { plugin: 'creator', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'owner': { plugin: 'creator', requiresGroup: false, requiresAdmin: false, requiresOwner: false },

	// Media/Tools
	'tts': { plugin: 'tts', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'img': { plugin: 'img', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'image': { plugin: 'img', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'sticker': { plugin: 'sticker', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ssweb': { plugin: 'ssweb', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ocr': { plugin: 'ocr', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'toaudio': { plugin: 'toaudio', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'pp': { plugin: 'pp', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'shazam': { plugin: 'shazam', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'compress': { plugin: 'compress', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'pollfunc': { plugin: 'poll', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'poll': { plugin: 'poll', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'tagme': { plugin: 'tagme', requiresGroup: true, requiresAdmin: false, requiresOwner: false },
	
	// Downloaders
	'ytdl': { plugin: 'ytdl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ytsearch': { plugin: 'ytsearch', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'youtube': { plugin: 'ytsearch', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'yt': { plugin: 'ytsearch', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'tiktok': { plugin: 'ttdl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'tt': { plugin: 'ttdl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'instadl': { plugin: 'instadl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ig': { plugin: 'instadl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'save': { plugin: 'save', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// Group Management (require admin or owner)
	'tagall': { plugin: 'tagall', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'everyone': { plugin: 'tagall', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'kick': { plugin: 'kick', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'remove': { plugin: 'kick', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'mute': { plugin: 'mute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'unmute': { plugin: 'unmute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'close': { plugin: 'mute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'lock': { plugin: 'mute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'open': { plugin: 'unmute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'unlock': { plugin: 'unmute', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'welcome': { plugin: 'welcome', requiresGroup: true, requiresAdmin: false, requiresOwner: false },
	'goodbye': { plugin: 'goodbye', requiresGroup: true, requiresAdmin: false, requiresOwner: false },
	'group': { plugin: 'groupsettings', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'gsettings': { plugin: 'groupsettings', requiresGroup: true, requiresAdmin: true, requiresOwner: false },
	'autodetect': { plugin: 'autoreact', requiresGroup: true, requiresAdmin: false, requiresOwner: false },
	
	// Owner Only
	'setprefix': { plugin: 'setprefix', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'prefix': { plugin: 'setprefix', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'changeprefix': { plugin: 'setprefix', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'setpp': { plugin: 'setpp', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'update': { plugin: 'update', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'addowner': { plugin: 'Addowner', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'add owner': { plugin: 'Addowner', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	'exec': { plugin: 'exec', requiresGroup: false, requiresAdmin: false, requiresOwner: true },
	
	// Search/Info
	'aisearch': { plugin: 'ai-search', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'ipstalk': { plugin: 'ipstalk', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'gituser': { plugin: 'gituserstalk', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'gitrepo': { plugin: 'gitrepostalk', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// AI Commands
	'ai': { plugin: 'ai', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'aiv': { plugin: 'aiv', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'gen': { plugin: 'gen2', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'gen2': { plugin: 'gen2', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'editimage': { plugin: 'gen2', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'imgpro': { plugin: 'gen2', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// Fun
	'anime': { plugin: 'animedl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'animesearch': { plugin: 'animesearch', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'naruto': { plugin: 'naruto', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'dragonball': { plugin: 'dragonball', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'marvel': { plugin: 'marvel', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'couplepp': { plugin: 'couplepp', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'bluearchive': { plugin: 'bluearchive', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	
	// Utilities
	'tourl': { plugin: 'tourl', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'tempmail': { plugin: 'tempmail', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'tweet': { plugin: 'tweet', requiresGroup: false, requiresAdmin: false, requiresOwner: false },
	'channelid': { plugin: 'channelid', requiresGroup: false, requiresAdmin: false, requiresOwner: false }
};

const SYSTEM_PROMPT = `You are Lostboy AI 🤖, an intelligent WhatsApp assistant and bot controller for XLICON bot.

════════════════════ COMMAND EXECUTION ════════════════════
When a user asks to execute a command, respond with ONLY JSON:
{"action":"<command_name>","params":{...}}

Available commands - choose the best match:
reply, alive, ping, uptime, menu, help, creator, owner,
tts, img, image, sticker, ssweb, ocr, toaudio, pp, shazam, compress, poll, tagme,
ytdl, ytsearch, youtube, yt, tiktok, tt, instadl, ig, save,
tagall, everyone, kick, remove, mute, unmute, close, lock, open, unlock, welcome, goodbye, group, gsettings, autodetect,
setprefix, prefix, changeprefix, setpp, update, addowner, exec,
aisearch, ipstalk, gituser, gitrepo,
ai, aiv, gen, gen2, editimage, imgpro,
anime, animesearch, naruto, dragonball, marvel, couplepp, bluearchive,
tourl, tempmail, tweet, channelid

════════════════════ PARAMETER EXTRACTION ════════════════════
CRITICAL: Extract FULL query/text, not just first word.

For query-based commands (img, gen, ytsearch, aisearch, gitrepo, animesearch):
- Extract ENTIRE search string as "query" or "prompt"
- Example: "generate image of a cat" → {"action":"gen","params":{"prompt":"a cat"}}
- Example: "search youtube alan walker" → {"action":"ytsearch","params":{"query":"alan walker"}}

For toggle commands (welcome, goodbye, mute, unmute):
- Extract status: "on", "off", "enable", "disable"
- Also accept: "mute" → mute action, "unmute" → unmute action
- Example: "welcome on" → {"action":"welcome","params":{"status":"on"}}
- Example: "mute group" → {"action":"mute","params":{}}

For owner commands (addowner, add owner):
- Extract mentioned user: {"action":"addowner","params":{"mention":"@user"}}
- Or extract phone number: {"action":"addowner","params":{"mention":"233XXXXXXXXX"}}

For tagging commands (tag, tagall, mention):
- Extract participants to mention
- For "tag everyone" → {"action":"tagall","params":{}}
- For "tag @user" → {"action":"tagall","params":{"target":"@user"}}

════════════════════ OUTPUT RULES ════════════════════
1. For actions → Output ONLY JSON, no other text
2. For questions → Output ONLY plain text, no JSON
3. NEVER mix text + JSON
4. NEVER output unknown commands
5. Admin commands work only if user is admin/owner (bot will enforce)
6. Owner commands work only if user is owner (bot will enforce)

════════════════════ SECURITY ════════════════════
Never reveal passwords, API keys, session files, tokens, or secrets.`;

// Success confirmations - only show if plugin doesn't send its own
const ACTION_CONFIRMATIONS = {
	reply: null,
	ping: null,
	uptime: null,
	alive: null,
	menu: null,
	help: null,
	creator: null,
	owner: null,
	tts: '✅ ᴠᴏɪᴄᴇ ᴍᴇssᴀɢᴇ sᴇɴᴛ.',
	img: '✅ ɪᴍᴀɢᴇ(s) sᴇɴᴛ.',
	image: '✅ ɪᴍᴀɢᴇ(s) sᴇɴᴛ.',
	sticker: '✅ sᴛɪᴄᴋᴇʀ ᴄʀᴇᴀᴛᴇᴅ.',
	ssweb: '✅ sᴄʀᴇᴇɴsʜᴏᴛ ᴛᴀᴋᴇɴ.',
	ocr: null,
	toaudio: '✅ ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴀᴜᴅɪᴏ.',
	pp: null,
	shazam: null,
	compress: '✅ ꜰɪʟᴇ ᴄᴏᴍᴘʀᴇssᴇᴅ.',
	pollfunc: '✅ ᴘᴏʟʟ ᴄʀᴇᴀᴛᴇᴅ.',
	poll: '✅ ᴘᴏʟʟ ᴄʀᴇᴀᴛᴇᴅ.',
	tagme: null,
	ytdl: '✅ ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	ytsearch: null,
	youtube: null,
	yt: null,
	tiktok: '✅ ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	tt: '✅ ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	instadl: '✅ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	ig: '✅ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	save: null,
	tagall: '✅ ᴀʟʟ ᴍᴇᴍʙᴇʀs ᴛᴀɢɢᴇᴅ.',
	everyone: '✅ ᴀʟʟ ᴍᴇᴍʙᴇʀs ᴛᴀɢɢᴇᴅ.',
	kick: '✅ ᴍᴇᴍʙᴇʀ ʀᴇᴍᴏᴠᴇᴅ.',
	remove: '✅ ᴍᴇᴍʙᴇʀ ʀᴇᴍᴏᴠᴇᴅ.',
	mute: '✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ.',
	unmute: '✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ.',
	close: '✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ.',
	lock: '✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ.',
	open: '✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ.',
	unlock: '✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ.',
	welcome: null,
	goodbye: null,
	group: null,
	gsettings: null,
	autodetect: null,
	setprefix: '✅ ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ.',
	prefix: '✅ ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ.',
	changeprefix: '✅ ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ.',
	setpp: '✅ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ.',
	update: '✅ ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ sᴛᴀʀᴛᴇᴅ.',
	addowner: '✅ ᴏᴡɴᴇʀ ᴀᴅᴅᴇᴅ.',
	exec: null,
	aisearch: null,
	ipstalk: null,
	gituser: null,
	gitrepo: null,
	ai: null,
	aiv: null,
	gen: null,
	gen2: null,
	editimage: null,
	imgpro: null,
	anime: null,
	animesearch: null,
	naruto: null,
	dragonball: null,
	marvel: null,
	couplepp: null,
	bluearchive: null,
	tourl: null,
	tempmail: null,
	tweet: null,
	channelid: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📍 ROBUST JSON PARSER WITH FALLBACKS (FIX #10)
// ═══════════════════════════════════════════════════════════════════════════════

function parseActionFromText(text) {
	if (!text || typeof text !== 'string') return null;
	const trimmed = text.trim();

	// Strategy 1: Entire response is valid JSON
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (parsed?.action && COMMAND_CONFIG[parsed.action.toLowerCase()]) {
				return parsed;
			}
		} catch (e) { /* ignore */ }
	}

	// Strategy 2: Extract first valid JSON object with "action"
	const jsonPattern = /\{[^{}]*"action"[^{}]*\}/g;
	const matches = trimmed.match(jsonPattern);
	if (matches) {
		for (const match of matches) {
			try {
				const parsed = JSON.parse(match);
				if (parsed?.action && COMMAND_CONFIG[parsed.action.toLowerCase()]) {
					return parsed;
				}
			} catch (e) { /* ignore */ }
		}
	}

	// Strategy 3: Find JSON within larger text (with markers like ```json...```)
	const codeBlockPattern = /```json\s*([\s\S]*?)\s*```/;
	const codeMatch = trimmed.match(codeBlockPattern);
	if (codeMatch) {
		try {
			const parsed = JSON.parse(codeMatch[1]);
			if (parsed?.action && COMMAND_CONFIG[parsed.action.toLowerCase()]) {
				return parsed;
			}
		} catch (e) { /* ignore */ }
	}

	// Strategy 4: Try to extract JSON from line-by-line
	const lines = trimmed.split('\n');
	for (const line of lines) {
		const cleanedLine = line.trim();
		if (cleanedLine.startsWith('{') && cleanedLine.endsWith('}')) {
			try {
				const parsed = JSON.parse(cleanedLine);
				if (parsed?.action && COMMAND_CONFIG[parsed.action.toLowerCase()]) {
					return parsed;
				}
			} catch (e) { /* ignore */ }
		}
	}

	return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PERMISSION & OWNER CHECKS (FIX #4, #5, #12)
// ═══════════════════════════════════════════════════════════════════════════════

function normalizeJid(jid = '') {
	if (!jid) return '';
	return String(jid).split(':')[0];
}

function isLostboyOwner(m) {
	if (!m || !m.sender) return false;
	const normalized = normalizeJid(m.sender);
	return normalized === OWNER_JID || m.sender === OWNER_JID;
}

function canExecuteCommand(m, config) {
	// Owner-only commands
	if (config.requiresOwner && !m.isOwner && !isLostboyOwner(m)) {
		return false;
	}

	// Group-only commands
	if (config.requiresGroup && !m.isGroup) {
		return false;
	}

	// Admin-required commands
	if (config.requiresAdmin && !m.isAdmin && !m.isOwner && !isLostboyOwner(m) && !m.isGroupOwner) {
		return false;
	}

	return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 ARGUMENT PARSER FOR EXTRACTED QUERIES (FIX #1, #2, #3, #7)
// ═══════════════════════════════════════════════════════════════════════════════

async function buildCommandArgs(sock, m, action, params) {
	const args = [];

	try {
		// Image/Prompt-based commands (FIX #1)
		if (['gen', 'gen2', 'editimage', 'imgpro'].includes(action)) {
			// params.prompt contains the full query
			if (params.prompt) {
				args.push(params.prompt.trim());
			}
		}
		// Image search commands
		else if (['img', 'image'].includes(action)) {
			if (params.query) {
				args.push(params.query.trim());
			}
		}
		// Search commands
		else if (['ytsearch', 'youtube', 'yt', 'aisearch', 'gitrepo', 'animesearch'].includes(action)) {
			if (params.query) {
				args.push(params.query.trim());
			}
		}
		// Download commands
		else if (['ytdl', 'tiktok', 'tt', 'instadl', 'ig', 'tourl'].includes(action)) {
			if (params.url) {
				args.push(params.url.trim());
			}
		}
		// IP and Git user search
		else if (['ipstalk', 'gituser'].includes(action)) {
			if (params.username || params.ip) {
				args.push((params.username || params.ip).trim());
			}
		}
		// AI commands
		else if (['ai', 'aiv'].includes(action)) {
			if (params.text) {
				args.push(params.text.trim());
			}
		}
		// Audio and tweet
		else if (['tts', 'tweet'].includes(action)) {
			if (params.text) {
				args.push(params.text.trim());
			}
		}
		// Toggle commands (FIX #2)
		else if (['welcome', 'goodbye'].includes(action)) {
			// Extract status: on/off
			const status = params.status || params.option;
			if (status) {
				args.push(status.toLowerCase());
			}
		}
		// Mute/Unmute - no args needed, action itself determines behavior (FIX #6)
		else if (['mute', 'unmute', 'close', 'lock', 'open', 'unlock'].includes(action)) {
			// Mute commands don't need args, the action name determines behavior
		}
		// Tagging commands (FIX #7)
		else if (['tagall', 'everyone'].includes(action)) {
			// Use mentionedJid from m
			// Will handle in executeAction
		}
		// Kick command
		else if (['kick', 'remove'].includes(action)) {
			if (params.target || params.mention) {
				args.push(params.target || params.mention);
			}
		}
		// Poll command
		else if (['poll', 'pollfunc'].includes(action)) {
			if (params.name && Array.isArray(params.options)) {
				args.push([params.name, ...params.options].join(';'));
			}
		}
		// Owner/Admin commands (FIX #3)
		else if (['addowner'].includes(action)) {
			if (params.mention) {
				args.push('add');
				args.push(params.mention.trim());
			}
		}
		// Other commands
		else if (['setprefix', 'prefix', 'changeprefix'].includes(action)) {
			if (params.prefix) {
				args.push(params.prefix.trim());
			}
		}
		else if (['tempmail'].includes(action)) {
			args.push(params.action || 'create');
		}

	} catch (err) {
		console.error(`Error building args for ${action}:`, err.message);
	}

	return args;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💫 COMMAND EXECUTION ENGINE (FIX #8, #9)
// ═══════════════════════════════════════════════════════════════════════════════

async function executeAction(sock, m, plugins, action, params) {
	const actionLower = action.toLowerCase();
	const config = COMMAND_CONFIG[actionLower];

	if (!config || !config.plugin) {
		return false;
	}

	// Check permissions
	if (!canExecuteCommand(m, config)) {
		let errorMsg = '';
		if (config.requiresOwner && !m.isOwner && !isLostboyOwner(m)) {
			errorMsg = '❌ ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.';
		} else if (config.requiresAdmin && !m.isAdmin && !m.isGroupOwner) {
			errorMsg = '❌ ᴀᴅᴍɪɴs ᴏɴʟʏ.';
		} else if (config.requiresGroup && !m.isGroup) {
			errorMsg = '❌ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs.';
		}
		if (errorMsg) {
			await m.reply(errorMsg);
			return false;
		}
	}

	const plugin = plugins.get(config.plugin);
	if (!plugin || typeof plugin.execute !== 'function') {
		await m.reply(`❌ ᴘʟᴜɢɪɴ ɴᴏᴛ ꜰᴏᴜɴᴅ: ${config.plugin}`);
		return false;
	}

	try {
		// Special handling for mute/unmute
		if (['mute', 'unmute', 'close', 'lock', 'open', 'unlock'].includes(actionLower)) {
			let muteAction = actionLower;
			if (['close', 'lock'].includes(actionLower)) {
				muteAction = 'mute';
			}
			if (['open', 'unlock'].includes(actionLower)) {
				muteAction = 'unmute';
			}

			const mutePlugin = ['mute', 'close', 'lock'].includes(actionLower) 
				? plugins.get('mute')
				: plugins.get('unmute');
			
			if (mutePlugin && typeof mutePlugin.execute === 'function') {
				await mutePlugin.execute(sock, m, [], plugins);
			}
			return true;
		}

		// Special handling for tagging
		if (['tagall', 'everyone'].includes(actionLower)) {
			const tagPlugin = plugins.get('tagall');
			if (tagPlugin && typeof tagPlugin.execute === 'function') {
				await tagPlugin.execute(sock, m, [], plugins);
			}
			return true;
		}

		// Build args based on action and params
		const args = await buildCommandArgs(sock, m, actionLower, params);

		// Execute the plugin
		await plugin.execute(sock, m, args, plugins);
		return true;

	} catch (err) {
		console.error(`Error executing ${actionLower}:`, err.message);
		// Don't send error message here - let caller decide (FIX #9)
		throw err;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 MAIN PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
	name: 'lostboy',
	aliases: ['lb', 'lbai', 'lostboyai'],
	description: 'Lostboy AI — chat and execute any bot command via natural language',
	tags: ['ai'],
	command: /^\.?(lostboy|lb|lbai|lostboyai)/i,

	async execute(sock, m, args, plugins) {
		try {
			// Show help if no args and not replying to anything
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
					`│  .lb generate image of a cat\n` +
					`│  .lb kick @user\n` +
					`│  .lb search youtube alan walker\n` +
					`│  .lb welcome on\n` +
					`┃\n` +
					`╰━━━━━━━━━━⬣`
				);
			}

			// Show loading reaction
			await m.react('⏳');

			// Build the query for AI
			let query = args.join(' ').trim();

			if (m.quoted?.body) {
				query = query
					? `${query}\n\n[Replying to: "${m.quoted.body}"]`
					: `[Replying to: "${m.quoted.body}"]`;
			}

			// Add context about group and sender permissions
			if (m.isGroup) {
				const meta = m.groupMetadata || await sock.groupMetadata(m.from).catch(() => null);
				if (meta) {
					query +=
						`\n\n[Group: "${meta.subject}" | Members: ${meta.participants?.length || 0}` +
						` | Sender: ${m.pushName || m.senderNumber}` +
						` | IsAdmin: ${m.isAdmin} | IsGroupOwner: ${m.isGroupOwner} | IsOwner: ${m.isOwner}]`;
				}
			} else {
				query += `\n\n[DM | Sender: ${m.pushName || m.senderNumber} | IsOwner: ${m.isOwner}]`;
			}

			// Call AI API
			const apiUrl = `${BK9_API}?q=${encodeURIComponent(query)}&BK9=${encodeURIComponent(SYSTEM_PROMPT)}&model=${encodeURIComponent(MODEL)}`;
			const { data } = await axios.get(apiUrl, { timeout: 30000 });

			const raw = data?.BK9 || data?.answer || data?.response || data?.result || data?.text || (typeof data === 'string' ? data : null);

			if (!raw) {
				await m.react('❌');
				return m.reply('❌ ɴᴏ ʀᴇsᴘᴏɴsᴇ ғʀᴏᴍ ʟᴏsᴛʙᴏʏ ᴀɪ.');
			}

			const answer = String(raw).trim();

			// Try to parse as action
			const parsedAction = parseActionFromText(answer);

			if (parsedAction) {
				const action = parsedAction.action?.toLowerCase?.();
				const params = parsedAction.params || {};

				if (!action) {
					await m.react('❌');
					return m.reply('❌ ɴᴏ ᴀᴄᴛɪᴏɴ sᴘᴇᴄɪғɪᴇᴅ.');
				}

				if (!COMMAND_CONFIG[action]) {
					await m.react('❌');
					return m.reply(`❌ ᴜɴᴋɴᴏᴡɴ ᴄᴏᴍᴍᴀɴᴅ: ${action}`);
				}

				try {
					const executed = await executeAction(sock, m, plugins || global._pluginMap || new Map(), action, params);

					if (executed) {
						await m.react('✅');
						
						// Send confirmation ONLY if plugin didn't already send one (FIX #8)
						const confirmMsg = ACTION_CONFIRMATIONS[action];
						if (confirmMsg) {
							// Give plugin a moment to send its own message
							await new Promise(resolve => setTimeout(resolve, 500));
							await m.reply(confirmMsg);
						}
						return;
					}

					// Permission denied - error already sent by executeAction
					await m.react('❌');
					return;

				} catch (execErr) {
					console.error('❌ Lostboy executeAction error:', execErr.message);
					await m.react('❌');
					// Only ONE error message (FIX #9)
					return m.reply(`❌ ᴇʀʀᴏʀ: ${execErr.message}`);
				}
			}

			// Not a recognized action, treat as plain text response
			if (answer.startsWith('{') && answer.includes('"action') && !answer.endsWith('}')) {
				await m.react('❌');
				return m.reply('❌ ᴀɪ ʀᴇsᴘᴏɴᴅᴇᴅ ᴡɪᴛʜ ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ. ᴛʀʏ ᴀɢᴀɪɴ.');
			}

			// Send plain text response
			await m.react('✅');
			await m.reply(`\u200B${answer}\n\n> 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ`);

		} catch (err) {
			console.error('❌ Lostboy AI error:', err.message);
			await m.react('❌');
			// Only ONE error message (FIX #9)
			await m.reply('❌ ʟᴏsᴛʙᴏʏ ᴀɪ ғᴀɪʟᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
		}
	}
};
