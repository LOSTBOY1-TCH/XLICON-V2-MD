const axios = require('axios');

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LOSTBOY AI - SUPER INTELLIGENT WHATSAPP BOT AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Advanced intent understanding
 * ✅ Natural language command mapping
 * ✅ Proper permission checks using handler.js
 * ✅ Quoted user/message context awareness
 * ✅ Group member intelligence
 * ✅ Dynamic plugin discovery
 * ✅ Robust JSON parsing
 * ✅ Smart query extraction
 * ✅ No duplicate messages
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const BK9_API = 'https://api.bk9.dev/ai/BK92';
const MODEL = 'openai/gpt-oss-120b';

// Owner JID for special recognition
const OWNER_JID = '233549551004@s.whatsapp.net';

/**
 * NATURAL LANGUAGE ALIAS MAPPING
 * Maps user intent phrases to actual plugin names
 * Handles various ways users might phrase the same command
 */
const INTENT_MAP = {
	// Menu/Help
	'menu': 'menu',
	'help': 'menu',
	'commands': 'menu',
	'help menu': 'menu',
	'show commands': 'menu',
	'bot menu': 'menu',
	'command list': 'menu',
	
	// Owner/Creator
	'owner': 'creator',
	'creator': 'creator',
	'about': 'creator',
	'who created you': 'creator',
	
	// Media Tools
	'image': 'img',
	'images': 'img',
	'img': 'img',
	'picture': 'img',
	'pic': 'img',
	'search image': 'img',
	'find image': 'img',
	
	'sticker': 'sticker',
	'stick': 'sticker',
	'make sticker': 'sticker',
	'create sticker': 'sticker',
	
	'screenshot': 'ssweb',
	'snap': 'ssweb',
	'screencapture': 'ssweb',
	'website screenshot': 'ssweb',
	'web screenshot': 'ssweb',
	
	'ocr': 'ocr',
	'read text': 'ocr',
	'extract text': 'ocr',
	'text from image': 'ocr',
	
	'audio': 'toaudio',
	'voice': 'toaudio',
	'convert to audio': 'toaudio',
	'make audio': 'toaudio',
	
	'tts': 'tts',
	'text to speech': 'tts',
	'speak': 'tts',
	
	'shazam': 'shazam',
	'identify song': 'shazam',
	'what song': 'shazam',
	
	'compress': 'compress',
	'reduce size': 'compress',
	'make smaller': 'compress',
	
	'poll': 'poll',
	'vote': 'poll',
	'create poll': 'poll',
	'make poll': 'poll',
	
	// Downloaders
	'youtube': 'ytdl',
	'yt': 'ytdl',
	'ytdl': 'ytdl',
	'download youtube': 'ytdl',
	'youtube download': 'ytdl',
	
	'youtube search': 'ytsearch',
	'search youtube': 'ytsearch',
	'yt search': 'ytsearch',
	
	'tiktok': 'ttdl',
	'tt': 'ttdl',
	'tiktok download': 'ttdl',
	'download tiktok': 'ttdl',
	
	'instagram': 'instadl',
	'ig': 'instadl',
	'insta': 'instadl',
	'instagram download': 'instadl',
	'download instagram': 'instadl',
	
	'save': 'save',
	'save media': 'save',
	'save message': 'save',
	
	// Group Management
	'tag': 'tagall',
	'tag all': 'tagall',
	'mention': 'tagall',
	'mention all': 'tagall',
	'tagall': 'tagall',
	'everyone': 'tagall',
	'tag everyone': 'tagall',
	'mention everyone': 'tagall',
	'call all': 'tagall',
	'mention members': 'tagall',
	
	'kick': 'kick',
	'remove': 'kick',
	'remove user': 'kick',
	'remove member': 'kick',
	'ban': 'kick',
	'boot': 'kick',
	
	'mute': 'mute',
	'mute group': 'mute',
	'silence': 'mute',
	'close group': 'mute',
	'lock group': 'mute',
	'make group silent': 'mute',
	
	'unmute': 'unmute',
	'unmute group': 'unmute',
	'unsilence': 'unmute',
	'open group': 'unmute',
	'unlock group': 'unmute',
	'make group open': 'unmute',
	
	'welcome': 'welcome',
	'welcome message': 'welcome',
	'greet new members': 'welcome',
	
	'goodbye': 'goodbye',
	'goodbye message': 'goodbye',
	'leave message': 'goodbye',
	'farewell': 'goodbye',
	
	'group settings': 'groupsettings',
	'group setting': 'groupsettings',
	'gsettings': 'groupsettings',
	'settings': 'groupsettings',
	
	// Owner Only
	'prefix': 'setprefix',
	'set prefix': 'setprefix',
	'change prefix': 'setprefix',
	
	'profile picture': 'setpp',
	'pp': 'setpp',
	'set pp': 'setpp',
	'change pp': 'setpp',
	'set profile': 'setpp',
	
	'update': 'update',
	'bot update': 'update',
	'upgrade': 'update',
	
	'owner': 'owner',
	'add owner': 'owner',
	'addowner': 'owner',
	'make owner': 'owner',
	'set owner': 'owner',
	'remove owner': 'owner',
	
	'exec': 'exec',
	'execute': 'exec',
	'run code': 'exec',
	'eval': 'exec',
	
	// AI/Search
	'ai': 'ai',
	'ask ai': 'ai',
	'chat': 'ai',
	
	'ai video': 'aiv',
	'aiv': 'aiv',
	'ai voice': 'aiv',
	
	'generate': 'gen2',
	'gen': 'gen2',
	'generate image': 'gen2',
	'create image': 'gen2',
	'draw': 'gen2',
	'imagine': 'gen2',
	'edit image': 'gen2',
	
	'search': 'aisearch',
	'ai search': 'aisearch',
	'web search': 'aisearch',
	
	'ip': 'ipstalk',
	'ip info': 'ipstalk',
	'ip address': 'ipstalk',
	'ipstalk': 'ipstalk',
	
	'github user': 'gituser',
	'git user': 'gituser',
	'gituser': 'gituser',
	
	'github repo': 'gitrepo',
	'git repo': 'gitrepo',
	'gitrepo': 'gitrepo',
	
	// Anime/Fun
	'anime': 'animedl',
	'anime download': 'animedl',
	'download anime': 'animedl',
	
	'anime search': 'animesearch',
	'search anime': 'animesearch',
	
	'naruto': 'naruto',
	'dragon ball': 'dragonball',
	'dragonball': 'dragonball',
	'marvel': 'marvel',
	'couple': 'couplepp',
	'couple pp': 'couplepp',
	'blue archive': 'bluearchive',
	'bluearchive': 'bluearchive',
	
	// Utilities
	'url': 'tourl',
	'to url': 'tourl',
	'short url': 'tourl',
	
	'mail': 'tempmail',
	'email': 'tempmail',
	'temp mail': 'tempmail',
	'tempmail': 'tempmail',
	
	'tweet': 'tweet',
	'twitter': 'tweet',
	
	'channel': 'channelid',
	'channel id': 'channelid',
	'channelid': 'channelid'
};

/**
 * Default command requirements
 * Plugins can override these in their module definition
 */
const DEFAULT_COMMAND_CONFIG = {
	requiresGroup: false,
	requiresAdmin: false,
	requiresOwner: false,
	requiresBotAdmin: false
};

/**
 * ACTION SUCCESS MESSAGES
 * Only sent after actual plugin execution success
 * null = plugin sends its own message
 */
const ACTION_CONFIRMATIONS = {
	tts: '✅ ᴠᴏɪᴄᴇ ᴍᴇssᴀɢᴇ sᴇɴᴛ.',
	img: '✅ ɪᴍᴀɢᴇ(s) sᴇɴᴛ.',
	sticker: '✅ sᴛɪᴄᴋᴇʀ ᴄʀᴇᴀᴛᴇᴅ.',
	ssweb: '✅ sᴄʀᴇᴇɴsʜᴏᴛ ᴛᴀᴋᴇɴ.',
	toaudio: '✅ ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴀᴜᴅɪᴏ.',
	compress: '✅ ꜰɪʟᴇ ᴄᴏᴍᴘʀᴇssᴇᴅ.',
	poll: '✅ ᴘᴏʟʟ ᴄʀᴇᴀᴛᴇᴅ.',
	ytdl: '✅ ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	tiktok: '✅ ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	tt: '✅ ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	instadl: '✅ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	ig: '✅ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	tagall: '✅ ᴀʟʟ ᴍᴇᴍʙᴇʀs ᴛᴀɢɢᴇᴅ.',
	kick: '✅ ᴍᴇᴍʙᴇʀ ʀᴇᴍᴏᴠᴇᴅ.',
	mute: '✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ.',
	unmute: '✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ.',
	setprefix: '✅ ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ.',
	setpp: '✅ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ.',
	update: '✅ ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ sᴛᴀʀᴛᴇᴅ.',
	addowner: '✅ ᴏᴡɴᴇʀ ᴀᴅᴅᴇᴅ.',
	owner: '✅ ᴏᴡɴᴇʀ ᴀᴅᴅᴇᴅ.'
};

/**
 * ENHANCED SYSTEM PROMPT
 * Instructs AI to understand intent, extract targets, and respond with JSON for actions
 */
const SYSTEM_PROMPT = `You are Lostboy AI 🤖, an advanced intelligent WhatsApp assistant and bot controller.

════════════════════════════════════════════════════════════════════════════════
CORE BEHAVIOR: AGENT MODE
════════════════════════════════════════════════════════════════════════════════

You must behave like an advanced AI agent, NOT a keyword matcher.

BEFORE EXECUTING ANY COMMAND:
✓ Understand the user's INTENT
✓ Analyze CONTEXT (group, sender, mentions, quoted messages)
✓ Extract TARGETS correctly (users, numbers, queries)
✓ Verify PERMISSIONS implicitly (the bot will enforce)
✓ Choose the most appropriate ACTION

════════════════════════════════════════════════════════════════════════════════
COMMAND EXECUTION FORMAT
════════════════════════════════════════════════════════════════════════════════

When executing a command, respond with ONLY valid JSON:
{
  "action": "command_name",
  "params": {
    "key": "value"
  }
}

For questions/chats: Respond ONLY with plain text, NO JSON.
NEVER mix text and JSON in the same response.

════════════════════════════════════════════════════════════════════════════════
INTELLIGENT PARAMETER EXTRACTION
════════════════════════════════════════════════════════════════════════════════

🎯 TAG/MENTION COMMANDS:
- "tag 3 random members" → {"action":"tagall","params":{"count":3,"random":true}}
- "tag 5 random people" → {"action":"tagall","params":{"count":5,"random":true}}
- "tag admins" → {"action":"tagall","params":{"role":"admin"}}
- "tag owner" → {"action":"tagall","params":{"role":"owner"}}
- "mention everyone" → {"action":"tagall","params":{}};

🎯 KICK/REMOVE COMMANDS:
- "kick him" (with quoted user) → {"action":"kick","params":{"target":"<quoted_jid>"}}
- "remove @user" → {"action":"kick","params":{"target":"<jid>"}}
- "kick 233XXXXXXXXX" → {"action":"kick","params":{"target":"233XXXXXXXXX"}}

🎯 MEDIA/SEARCH COMMANDS:
- "img cat" → {"action":"img","params":{"query":"cat"}}
- "img white tiger" → {"action":"img","params":{"query":"white tiger"}}
- "img cat 5" → {"action":"img","params":{"query":"cat","count":5}}

🎯 IMAGE GENERATION:
- "gen anime warrior" → {"action":"gen2","params":{"prompt":"anime warrior"}}
- "generate beautiful sunset" → {"action":"gen2","params":{"prompt":"beautiful sunset"}}
- Reply to image + "gen improve quality" → {"action":"gen2","params":{"prompt":"improve quality","edit":true}}

🎯 OWNER/ADMIN COMMANDS:
- "addowner @user" → {"action":"owner","params":{"command":"add","target":"<jid>"}}
- "make him owner" (quoted) → {"action":"owner","params":{"command":"add","target":"<quoted_jid>"}}
- "remove owner @user" → {"action":"owner","params":{"command":"remove","target":"<jid>"}}

🎯 GROUP SETTINGS:
- "welcome on" → {"action":"welcome","params":{"state":"on"}}
- "goodbye off" → {"action":"goodbye","params":{"state":"off"}}
- "mute group" → {"action":"mute","params":{}}
- "unmute group" → {"action":"unmute","params":{}}

🎯 DOWNLOADS:
- "download https://youtu.be/xxx" → {"action":"ytdl","params":{"url":"https://youtu.be/xxx"}}
- "tt https://tiktok.com/xxx" → {"action":"ttdl","params":{"url":"https://tiktok.com/xxx"}}

🎯 AI/SEARCH:
- "search kubernetes tutorial" → {"action":"aisearch","params":{"query":"kubernetes tutorial"}}
- "check ip 8.8.8.8" → {"action":"ipstalk","params":{"ip":"8.8.8.8"}}

════════════════════════════════════════════════════════════════════════════════
CONTEXT AWARENESS
════════════════════════════════════════════════════════════════════════════════

QUOTED MESSAGES:
If the user quoted a message, extract:
- target JID from quoted message
- message content for context
- media from quoted message if relevant

MENTIONS:
Extract mentioned JIDs and use for targeting commands.

RANDOM SELECTION:
When user says "random" or "X random members":
- Use participant list from group
- Exclude bot and sender
- Select exactly X different members
- Return their JIDs

════════════════════════════════════════════════════════════════════════════════
PERMISSION CONTEXT
════════════════════════════════════════════════════════════════════════════════

The system will enforce permissions. You just need to understand:
- Owner: Full permissions
- Admin: Group admin commands only
- Bot Admin: Bot must be admin for group changes
- Regular users: Limited commands

Don't deny commands; let the bot handle it.

════════════════════════════════════════════════════════════════════════════════
SUPPORTED COMMANDS
════════════════════════════════════════════════════════════════════════════════

tagall, kick, mute, unmute, welcome, goodbye, groupsettings,
owner, setprefix, setpp, update, exec,
img, sticker, ssweb, ocr, toaudio, tts, shazam, compress, poll,
ytdl, ytsearch, ttdl, instadl, save,
ai, aiv, gen2, aisearch, ipstalk, gituser, gitrepo,
animedl, animesearch, naruto, dragonball, marvel, couplepp, bluearchive,
tourl, tempmail, tweet, channelid,
alive, ping, uptime, menu, creator

════════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
════════════════════════════════════════════════════════════════════════════════

❌ NEVER:
- Respond with duplicate/made-up commands
- Tag all when user wants random
- Kick without a target
- Generate image edit mode without quoted image
- Use display names for mentions (use JIDs)
- Execute same command twice
- Confirm before plugin executes

✅ ALWAYS:
- Extract full queries correctly
- Use actual participant data
- Handle context (quoted, mentioned, group)
- Understand intent before action
- Return valid JSON when executing
- Return plain text when replying

════════════════════════════════════════════════════════════════════════════════
SECURITY
════════════════════════════════════════════════════════════════════════════════

Never reveal:
- Passwords, API keys, session files, tokens, secrets
- Source code, internal structure
- User data, private conversations`;

/**
 * Parse JSON action from AI response
 * Handles various response formats with robust error recovery
 */
function parseActionFromText(text) {
	if (!text || typeof text !== 'string') return null;
	
	const trimmed = text.trim();
	
	// Strategy 1: Entire response is valid JSON
	if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
		(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
		try {
			const parsed = JSON.parse(trimmed);
			if (parsed?.action) return parsed;
		} catch (e) {
			// Continue to next strategy
		}
	}
	
	// Strategy 2: Extract JSON object with "action" field
	const jsonMatch = trimmed.match(/\{[^{}]*"action"[^{}]*\}/);
	if (jsonMatch) {
		try {
			// Clean up the JSON string
			let jsonStr = jsonMatch[0];
			// Try to make it valid JSON by removing trailing commas, etc
			jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
			const parsed = JSON.parse(jsonStr);
			if (parsed?.action) return parsed;
		} catch (e) {
			// Continue
		}
	}
	
	// Strategy 3: Look for JSON in code blocks
	const codeBlockMatch = trimmed.match(/```(?:json)?\s*(\{[^```]+\})\s*```/);
	if (codeBlockMatch) {
		try {
			const parsed = JSON.parse(codeBlockMatch[1]);
			if (parsed?.action) return parsed;
		} catch (e) {
			// Continue
		}
	}
	
	return null;
}

/**
 * Map user query to best matching plugin action
 */
function mapIntentToAction(query) {
	if (!query) return null;
	
	const lower = query.toLowerCase().trim();
	
	// Exact match first
	if (INTENT_MAP[lower]) {
		return INTENT_MAP[lower];
	}
	
	// Check for partial matches (first few words)
	const words = lower.split(/\s+/);
	for (let i = words.length; i > 0; i--) {
		const phrase = words.slice(0, i).join(' ');
		if (INTENT_MAP[phrase]) {
			return INTENT_MAP[phrase];
		}
	}
	
	return null;
}

/**
 * Extract query from user input
 * Handles multi-word queries intelligently
 */
function extractQuery(args) {
	if (!args || args.length === 0) return '';
	
	let query = args.join(' ').trim();
	
	// Remove common prefixes
	query = query.replace(/^(search|find|get|show|make|create|generate)\s+/i, '');
	
	return query;
}

/**
 * Get random members from group excluding bot and sender
 */
function getRandomMembers(participants, count, senderJid, botJid) {
	if (!Array.isArray(participants) || count <= 0) return [];
	
	const candidates = participants.filter(p => {
		const pid = (p.id || p.jid || '').split(':')[0];
		const sender = (senderJid || '').split(':')[0];
		const bot = (botJid || '').split(':')[0];
		return pid !== sender && pid !== bot && pid;
	});
	
	if (candidates.length <= count) {
		return candidates.map(p => p.id || p.jid);
	}
	
	// Fisher-Yates shuffle
	const shuffled = [...candidates];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	
	return shuffled.slice(0, count).map(p => p.id || p.jid);
}

/**
 * Extract target user JID from various input formats
 */
function extractTarget(input, m) {
	if (!input) return null;
	
	// Quoted user
	if (m.quoted && m.quoted.sender) {
		return m.quoted.sender;
	}
	
	// Mentioned users
	if (m.mentionedJid && m.mentionedJid.length > 0) {
		return m.mentionedJid[0];
	}
	
	input = String(input).trim();
	
	// Already a JID
	if (input.includes('@')) {
		return input;
	}
	
	// Phone number
	if (/^\d{10,15}$/.test(input)) {
		return input + '@s.whatsapp.net';
	}
	
	// With @ symbol
	if (input.startsWith('@')) {
		const num = input.slice(1);
		if (/^\d{10,15}$/.test(num)) {
			return num + '@s.whatsapp.net';
		}
	}
	
	return null;
}

/**
 * Execute a command/action
 */
async function executeAction(sock, m, pluginMap, action, params, plugins) {
	try {
		// Normalize action name
		const actionLower = String(action || '').toLowerCase().trim();
		
		// Look up plugin by action name or alias
		let plugin = pluginMap.get(actionLower);
		
		if (!plugin) {
			// Try to find by alias
			for (const [name, p] of pluginMap.entries()) {
				const aliases = p.aliases || [];
				if (aliases.some(a => a.toLowerCase() === actionLower)) {
					plugin = p;
					break;
				}
			}
		}
		
		if (!plugin) {
			await m.reply(`❌ ᴘʟᴜɢɪɴ ɴᴏᴛ ꜰᴏᴜɴᴅ: ${actionLower}`);
			return false;
		}
		
		// Permission checks
		if (action === 'tagall' || action === 'kick' || action === 'mute' || action === 'unmute') {
			if (!m.isGroup) {
				await m.reply('❌ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs.');
				return false;
			}
			
			if (!m.isAdmin && !m.isOwner) {
				await m.reply('❌ ᴏɴʟʏ ᴀᴅᴍɪɴs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.');
				return false;
			}
		}
		
		if (action === 'owner' || action === 'addowner' || action === 'setprefix' || 
			action === 'setpp' || action === 'update' || action === 'exec') {
			if (!m.isOwner) {
				await m.reply('❌ ᴏɴʟʏ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.');
				return false;
			}
		}
		
		// Build args from params
		let args = [];
		
		// Handle specific commands
		if (action === 'tagall') {
			// tagall can accept message or random count
			if (params.random && params.count) {
				const participants = m.groupMetadata?.participants || [];
				const randomMembers = getRandomMembers(
					participants,
					parseInt(params.count),
					m.sender,
					sock.user?.id
				);
				args = [randomMembers.join(','), params.message || ''];
			} else {
				args = [params.message || ''];
			}
		} 
		else if (action === 'kick') {
			const target = extractTarget(params.target || params.mention, m);
			if (!target) {
				await m.reply('❌ ɴᴏ ᴛᴀʀɢᴇᴛ ᴜsᴇʀ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [target];
		}
		else if (action === 'owner' || action === 'addowner') {
			const cmd = params.command || 'add';
			const target = extractTarget(params.target, m);
			args = [cmd];
			if (target) args.push(target);
		}
		else if (action === 'img') {
			if (!params.query) {
				await m.reply('❌ ɴᴏ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
			if (params.count) args.push(String(params.count));
		}
		else if (action === 'gen2') {
			if (!params.prompt) {
				await m.reply('❌ ɴᴏ ᴘʀᴏᴍᴘᴛ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.prompt];
		}
		else if (action === 'ytdl') {
			if (!params.url) {
				await m.reply('❌ ɴᴏ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		}
		else if (action === 'ttdl') {
			if (!params.url) {
				await m.reply('❌ ɴᴏ ᴛɪᴋᴛᴏᴋ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		}
		else if (action === 'instadl' || action === 'ig') {
			if (!params.url) {
				await m.reply('❌ ɴᴏ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		}
		else if (action === 'welcome' || action === 'goodbye') {
			const state = params.state || 'on';
			args = [state];
		}
		else if (action === 'mute' || action === 'unmute') {
			args = [];
		}
		else if (action === 'aisearch') {
			if (!params.query) {
				await m.reply('❌ ɴᴏ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
		}
		else if (action === 'ipstalk') {
			if (!params.ip) {
				await m.reply('❌ ɴᴏ ɪᴘ ᴀᴅᴅʀᴇss ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.ip];
		}
		else if (action === 'gituser') {
			if (!params.username) {
				await m.reply('❌ ɴᴏ ɢɪᴛʜᴜʙ ᴜsᴇʀɴᴀᴍᴇ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.username];
		}
		else if (action === 'gitrepo') {
			if (!params.query) {
				await m.reply('❌ ɴᴏ ʀᴇᴘᴏ ɴᴀᴍᴇ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
		}
		else if (action === 'sticker') {
			args = [];
		}
		else if (action === 'ai' || action === 'aiv') {
			if (!params.text && !params.prompt) {
				await m.reply('❌ ɴᴏ ᴛᴇxᴛ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.text || params.prompt];
		}
		else if (action === 'poll') {
			if (!params.name || !params.options) {
				await m.reply('❌ ᴘᴏʟʟ ɴᴇᴇᴅs ᴀ ɴᴀᴍᴇ ᴀɴᴅ ᴏᴘᴛɪᴏɴs.');
				return false;
			}
			const optionString = Array.isArray(params.options) 
				? params.options.join(';')
				: params.options;
			args = [[params.name, optionString].join(';')];
		}
		
		// Execute plugin
		await plugin.execute(sock, m, args, plugins || pluginMap);
		return true;
		
	} catch (err) {
		console.error(`[Lostboy] Error executing ${action}:`, err.message);
		await m.reply(`❌ ᴇʀʀᴏʀ: ${err.message}`);
		return false;
	}
}

/**
 * Build enhanced query with context
 */
function buildContextualQuery(m, args) {
	let query = args.join(' ').trim();
	
	// Add quoted message context
	if (m.quoted?.body) {
		query += `\n\n[Replying to: "${m.quoted.body}"]`;
	}
	
	// Add group context
	if (m.isGroup) {
		const meta = m.groupMetadata;
		if (meta) {
			const memberCount = meta.participants?.length || 0;
			const adminCount = meta.participants?.filter(p => p.admin).length || 0;
			
			query += `\n\n[GROUP: "${meta.subject}" | Members: ${memberCount} | Admins: ${adminCount}`;
			query += ` | Sender: ${m.pushName || m.senderNumber}`;
			query += ` | Sender Is: ${m.isOwner ? 'Owner' : m.isAdmin ? 'Admin' : 'Member'}]`;
			
			// Add mentioned users
			if (m.mentionedJid && m.mentionedJid.length > 0) {
				query += `\n[Mentions: ${m.mentionedJid.map(j => j.split('@')[0]).join(', ')}]`;
			}
		}
	} else {
		query += `\n\n[DM | Sender: ${m.pushName || m.senderNumber} | Is Owner: ${m.isOwner}]`;
	}
	
	return query;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 MAIN LOSTBOY AI PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
	name: 'lostboy',
	aliases: ['lb', 'lbai', 'lostboyai'],
	description: 'Lostboy AI — Advanced intelligent bot control via natural language',
	tags: ['ai', 'tool'],
	command: /^\.?(lostboy|lb|lbai|lostboyai)/i,
	
	async execute(sock, m, args, plugins) {
		try {
			// Show help if no args and no quoted message
			if (!args[0] && !m.quoted) {
				return m.reply(
					`╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ v2 〕━━⬣\n` +
					`┃\n` +
					`├─ム ᴜsᴀɢᴇ  : .lostboy <message>\n` +
					`├─ム ᴀʟɪᴀs  : .lb | .lbai\n` +
					`┃\n` +
					`├─ム ɪ ᴄᴀɴ ᴄʜᴀᴛ ᴀɴᴅ ᴄᴏɴᴛʀᴏʟ\n` +
					`├─ム ᴀɴʏ ʙᴏᴛ ᴄᴏᴍᴍᴀɴᴅ ᴠɪᴀ ᴀɪ\n` +
					`┃\n` +
					`├─ム ᴇxᴀᴍᴘʟᴇs:\n` +
					`│  .lb tag 3 random members\n` +
					`│  .lb mute the group\n` +
					`│  .lb download https://youtu.be/xxx\n` +
					`│  .lb screenshot https://google.com\n` +
					`│  .lb generate anime warrior\n` +
					`│  .lb kick him (reply to user)\n` +
					`┃\n` +
					`╰━━━━━━━━━━⬣`
				);
			}
			
			// React with loading indicator
			await m.react('⏳');
			
			// Build contextual query
			const contextualQuery = buildContextualQuery(m, args);
			
			// Call AI API
			const apiUrl = `${BK9_API}?q=${encodeURIComponent(contextualQuery)}&BK9=${encodeURIComponent(SYSTEM_PROMPT)}&model=${encodeURIComponent(MODEL)}`;
			
			const { data } = await axios.get(apiUrl, { timeout: 30000 });
			
			const raw = data?.BK9 || data?.answer || data?.response || data?.result || data?.text || (typeof data === 'string' ? data : null);
			
			if (!raw) {
				await m.react('❌');
				return m.reply('❌ ɴᴏ ʀᴇsᴘᴏɴsᴇ ғʀᴏᴍ ʟᴏsᴛʙᴏʏ ᴀɪ.');
			}
			
			const answer = raw.trim();
			const parsedAction = parseActionFromText(answer);
			
			// If AI returned a command action
			if (parsedAction) {
				const action = parsedAction.action?.toLowerCase?.();
				const params = parsedAction.params || {};
				
				if (!action) {
					await m.react('❌');
					return m.reply('❌ ɪɴᴠᴀʟɪᴅ ᴀᴄᴛɪᴏɴ ғʀᴏᴍ ᴀɪ.');
				}
				
				try {
					// Execute the action
					const executed = await executeAction(
						sock, 
						m, 
						plugins || global._pluginMap || new Map(), 
						action, 
						params,
						plugins
					);
					
					if (executed) {
						await m.react('✅');
						
						// Send confirmation message only if plugin succeeded
						const confirmMsg = ACTION_CONFIRMATIONS[action];
						if (confirmMsg) {
							await m.reply(confirmMsg);
						}
						return;
					}
					
					await m.react('❌');
					return;
					
				} catch (execErr) {
					console.error('[Lostboy] executeAction error:', execErr.message);
					await m.react('❌');
					return m.reply(`❌ ᴇʀʀᴏʀ: ${execErr.message}`);
				}
			}
			
			// If it looks like an incomplete JSON action, show error
			if (answer.startsWith('{') && answer.includes('"action') && !answer.endsWith('}')) {
				await m.react('❌');
				return m.reply('❌ ᴀɪ ʀᴇsᴘᴏɴᴅᴇᴅ ᴡɪᴛʜ ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ. ᴛʀʏ ᴀɢᴀɪɴ.');
			}
			
			// Otherwise it's a text response (chat)
			await m.react('✅');
			await m.reply(`\u200B${answer}\n\n> 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ`);
			
		} catch (err) {
			console.error('[Lostboy] Main error:', err.message);
			await m.react('❌');
			await m.reply('❌ ʟᴏsᴛʙᴏʏ ᴀɪ ғᴀɪʟᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
		}
	}
};
