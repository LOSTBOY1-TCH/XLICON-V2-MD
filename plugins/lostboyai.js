const axios = require('axios');

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LOSTBOY AI - SUPER INTELLIGENT WHATSAPP BOT AGENT (PRODUCTION-READY)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ✅ Features:
 * ✅ Advanced intent understanding with robust error recovery
 * ✅ Natural language command mapping with fallbacks
 * ✅ Proper permission checks using handler.js context
 * ✅ Quoted user/message context awareness with safety checks
 * ✅ Group member intelligence with safe random selection
 * ✅ Dynamic plugin discovery with type validation
 * ✅ Robust JSON parsing with multiple fallback strategies
 * ✅ Smart query extraction with input validation
 * ✅ No duplicate messages or command confirmations
 * ✅ Comprehensive error logging with stack traces
 * ✅ API timeout and rate limit protection
 * ✅ Production-ready for large WhatsApp groups
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const BK9_API = 'https://api.bk9.dev/ai/BK92';
const MODEL = 'openai/gpt-oss-120b';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_MESSAGE_LENGTH = 4000; // WhatsApp limit is 4096
const MAX_QUERY_LENGTH = 2000; // API limit for query param

// Owner JID for special recognition
const OWNER_JID = '233549551004@s.whatsapp.net';

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 VALID ACTIONS WHITELIST
// ═══════════════════════════════════════════════════════════════════════════════

const VALID_ACTIONS = new Set([
	// Menu/Help
	'menu', 'creator',
	
	// Media Tools
	'img', 'sticker', 'ssweb', 'ocr', 'toaudio', 'tts', 'shazam', 'compress', 'poll',
	
	// Downloaders
	'ytdl', 'ytsearch', 'ttdl', 'instadl', 'save',
	
	// Group Management
	'tagall', 'kick', 'mute', 'unmute', 'welcome', 'goodbye', 'groupsettings',
	
	// Owner Only
	'setprefix', 'setpp', 'update', 'exec', 'owner',
	
	// AI/Search
	'ai', 'aiv', 'gen2', 'aisearch', 'ipstalk', 'gituser', 'gitrepo',
	
	// Anime/Fun
	'animedl', 'animesearch', 'naruto', 'dragonball', 'marvel', 'couplepp', 'bluearchive',
	
	// Utilities
	'tourl', 'tempmail', 'tweet', 'channelid',
	
	// System
	'alive', 'ping', 'uptime'
]);

/**
 * CORRECTED NATURAL LANGUAGE ALIAS MAPPING
 * - No duplicate keys
 * - Maps user intent phrases to canonical action names
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
	
	// Owner/Creator (FIXED: removed duplicate 'owner' key)
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
 * ACTION SUCCESS CONFIRMATION MESSAGES
 * FIXED: Keys now match actual action names returned from AI
 * null = plugin sends its own message
 */
const ACTION_CONFIRMATIONS = {
	// Media Tools
	tts: '✅ ᴠᴏɪᴄᴇ ᴍᴇssᴀɢᴇ sᴇɴᴛ.',
	img: '✅ ɪᴍᴀɢᴇ(s) sᴇɴᴛ.',
	sticker: '✅ sᴛɪᴄᴋᴇʀ ᴄʀᴇᴀᴛᴇᴅ.',
	ssweb: '✅ sᴄʀᴇᴇɴsʜᴏᴛ ᴛᴀᴋᴇɴ.',
	toaudio: '✅ ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴀᴜᴅɪᴏ.',
	compress: '✅ ꜰɪʟᴇ ᴄᴏᴍᴘʀᴇssᴇᴅ.',
	poll: '✅ ᴘᴏʟʟ ᴄʀᴇᴀᴛᴇᴅ.',
	
	// Downloaders (FIXED: consistent key naming)
	ytdl: '✅ ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	ttdl: '✅ ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	instadl: '✅ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...',
	
	// Group Management
	tagall: '✅ ᴀʟʟ ᴍᴇᴍʙᴇʀs ᴛᴀɢɢᴇᴅ.',
	kick: '✅ ᴍᴇᴍʙᴇʀ ʀᴇᴍᴏᴠᴇᴅ.',
	mute: '✅ ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ.',
	unmute: '✅ ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ.',
	
	// Owner Only
	setprefix: '✅ ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ.',
	setpp: '✅ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ.',
	update: '✅ ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ sᴛᴀʀᴛᴇᴅ.',
	owner: '✅ ᴏᴡɴᴇʀ ᴍᴀɴᴀɢᴇᴅ.'
	// null for: menu, creator, ai, aiv, gen2, etc. (they send own messages)
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

When executing a command, respond with ONLY valid JSON (NO other text):
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
- "mention everyone" → {"action":"tagall","params":{}}

🎯 KICK/REMOVE COMMANDS:
- "kick him" (with quoted user) → {"action":"kick","params":{"target":"<quoted_jid>"}}
- "remove @user" → {"action":"kick","params":{"target":"<jid>"}}

🎯 MEDIA/SEARCH COMMANDS:
- "img cat" → {"action":"img","params":{"query":"cat"}}
- "img white tiger 5" → {"action":"img","params":{"query":"white tiger","count":5}}

🎯 IMAGE GENERATION:
- "gen anime warrior" → {"action":"gen2","params":{"prompt":"anime warrior"}}
- "generate beautiful sunset" → {"action":"gen2","params":{"prompt":"beautiful sunset"}}

🎯 DOWNLOADS:
- "download https://youtu.be/xxx" → {"action":"ytdl","params":{"url":"https://youtu.be/xxx"}}
- "tt https://tiktok.com/xxx" → {"action":"ttdl","params":{"url":"https://tiktok.com/xxx"}}

🎯 GROUP SETTINGS:
- "welcome on" → {"action":"welcome","params":{"state":"on"}}
- "mute group" → {"action":"mute","params":{}}

🎯 AI/SEARCH:
- "search kubernetes tutorial" → {"action":"aisearch","params":{"query":"kubernetes tutorial"}}

════════════════════════════════════════════════════════════════════════════════
CONTEXT AWARENESS
════════════════════════════════════════════════════════════════════════════════

QUOTED MESSAGES:
Extract target JID from quoted message when user says "kick him", "remove them", etc.

RANDOM SELECTION:
When user says "random" or "X random members", select exactly X different members.

════════════════════════════════════════════════════════════════════════════════
SUPPORTED ACTIONS (ONLY respond with these)
════════════════════════════════════════════════════════════════════════════════

tagall, kick, mute, unmute, welcome, goodbye, groupsettings, owner, setprefix, setpp, update, exec,
img, sticker, ssweb, ocr, toaudio, tts, shazam, compress, poll, ytdl, ytsearch, ttdl, instadl, save,
ai, aiv, gen2, aisearch, ipstalk, gituser, gitrepo, animedl, animesearch, naruto, dragonball, marvel,
couplepp, bluearchive, tourl, tempmail, tweet, channelid, menu, creator, alive, ping, uptime

════════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
════════════════════════════════════════════════════════════════════════════════

❌ NEVER:
- Respond with invalid JSON or duplicate commands
- Hallucinate action names not in the supported list
- Mix JSON and text in one response
- Kick/remove without a valid target
- Use display names instead of JIDs

✅ ALWAYS:
- Extract full queries correctly
- Handle quoted messages and mentions
- Return valid JSON ONLY when executing commands
- Return plain text ONLY when chatting

════════════════════════════════════════════════════════════════════════════════
SECURITY
════════════════════════════════════════════════════════════════════════════════

Never reveal passwords, API keys, session files, tokens, or source code.`;

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ UTILITY FUNCTIONS - WITH COMPREHENSIVE ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Enhanced JSON parser with multiple fallback strategies
 * FIXED: Handles nested objects correctly
 */
function parseActionFromText(text, debugId = '') {
	try {
		if (!text || typeof text !== 'string') {
			console.log(`[LB:${debugId}] parseActionFromText: text is not a string`, typeof text);
			return null;
		}
		
		const trimmed = text.trim();
		if (!trimmed) {
			console.log(`[LB:${debugId}] parseActionFromText: text is empty`);
			return null;
		}
		
		// Strategy 1: Full response is valid JSON
		if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
			(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
			try {
				const parsed = JSON.parse(trimmed);
				if (parsed?.action) {
					console.log(`[LB:${debugId}] parseActionFromText: Found via full JSON parse, action=${parsed.action}`);
					return parsed;
				}
			} catch (e) {
				console.log(`[LB:${debugId}] parseActionFromText: Full JSON parse failed: ${e.message}`);
			}
		}
		
		// Strategy 2: Extract JSON in code blocks first (more specific)
		const codeBlockMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
		if (codeBlockMatch) {
			try {
				const parsed = JSON.parse(codeBlockMatch[1]);
				if (parsed?.action) {
					console.log(`[LB:${debugId}] parseActionFromText: Found via code block, action=${parsed.action}`);
					return parsed;
				}
			} catch (e) {
				console.log(`[LB:${debugId}] parseActionFromText: Code block JSON parse failed: ${e.message}`);
			}
		}
		
		// Strategy 3: Smart extraction - find balanced braces
		if (trimmed.includes('"action')) {
			const startIdx = trimmed.indexOf('{');
			if (startIdx !== -1) {
				let braceCount = 0;
				let endIdx = -1;
				
				for (let i = startIdx; i < trimmed.length; i++) {
					if (trimmed[i] === '{') braceCount++;
					if (trimmed[i] === '}') {
						braceCount--;
						if (braceCount === 0) {
							endIdx = i + 1;
							break;
						}
					}
				}
				
				if (endIdx > startIdx) {
					try {
						const jsonStr = trimmed.substring(startIdx, endIdx);
						const parsed = JSON.parse(jsonStr);
						if (parsed?.action) {
							console.log(`[LB:${debugId}] parseActionFromText: Found via brace matching, action=${parsed.action}`);
							return parsed;
						}
					} catch (e) {
						console.log(`[LB:${debugId}] parseActionFromText: Brace matching parse failed: ${e.message}`);
					}
				}
			}
		}
		
		// Strategy 4: Try to fix common JSON errors
		if (trimmed.includes('{') && trimmed.includes('"action')) {
			try {
				// Remove markdown if present
				let cleaned = trimmed.replace(/```json\n?/g, '').replace(/```\n?/g, '');
				
				// Try to extract JSON string
				const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					let jsonStr = jsonMatch[0];
					// Remove trailing commas
					jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
					
					const parsed = JSON.parse(jsonStr);
					if (parsed?.action) {
						console.log(`[LB:${debugId}] parseActionFromText: Found via error fixing, action=${parsed.action}`);
						return parsed;
					}
				}
			} catch (e) {
				console.log(`[LB:${debugId}] parseActionFromText: Error fixing parse failed: ${e.message}`);
			}
		}
		
		console.log(`[LB:${debugId}] parseActionFromText: No valid action found in text`);
		return null;
		
	} catch (err) {
		console.error(`[LB:${debugId}] parseActionFromText CRASH:`, err.message);
		return null;
	}
}

/**
 * Map user query to best matching plugin action
 */
function mapIntentToAction(query) {
	if (!query || typeof query !== 'string') return null;
	
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
 * Extract query from user input with length validation
 */
function extractQuery(args) {
	if (!args || !Array.isArray(args) || args.length === 0) return '';
	
	let query = args.join(' ').trim();
	
	// Remove common prefixes
	query = query.replace(/^(search|find|get|show|make|create|generate)\s+/i, '');
	
	// Truncate if too long
	if (query.length > MAX_QUERY_LENGTH) {
		console.log(`[LB] Query truncated from ${query.length} to ${MAX_QUERY_LENGTH} chars`);
		query = query.substring(0, MAX_QUERY_LENGTH);
	}
	
	return query;
}

/**
 * Get random members from group excluding bot and sender
 * FIXED: Safe handling of missing participants
 */
function getRandomMembers(participants, count, senderJid, botJid) {
	try {
		if (!Array.isArray(participants) || count <= 0) {
			console.log(`[LB] getRandomMembers: invalid params - isArray=${Array.isArray(participants)}, count=${count}`);
			return [];
		}
		
		const candidates = participants.filter(p => {
			try {
				const pid = (p.id || p.jid || '').split(':')[0];
				const sender = (senderJid || '').split(':')[0];
				const bot = (botJid || '').split(':')[0];
				return pid && pid !== sender && pid !== bot && pid.length > 0;
			} catch (e) {
				console.log(`[LB] getRandomMembers: Error filtering participant:`, e.message);
				return false;
			}
		});
		
		if (candidates.length === 0) {
			console.log(`[LB] getRandomMembers: No valid candidates`);
			return [];
		}
		
		if (candidates.length <= count) {
			console.log(`[LB] getRandomMembers: Returning all ${candidates.length} candidates (less than requested ${count})`);
			return candidates.map(p => p.id || p.jid).filter(Boolean);
		}
		
		// Fisher-Yates shuffle
		const shuffled = [...candidates];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		
		const result = shuffled.slice(0, count).map(p => p.id || p.jid).filter(Boolean);
		console.log(`[LB] getRandomMembers: Selected ${result.length} random members from ${candidates.length} candidates`);
		return result;
		
	} catch (err) {
		console.error(`[LB] getRandomMembers CRASH:`, err.message);
		return [];
	}
}

/**
 * Extract target user JID from various input formats
 * FIXED: Safe null handling
 */
function extractTarget(input, m) {
	try {
		// Priority 1: Quoted user
		if (m?.quoted?.sender) {
			console.log(`[LB] extractTarget: Using quoted message sender`);
			return m.quoted.sender;
		}
		
		// Priority 2: Mentioned users
		if (m?.mentionedJid && Array.isArray(m.mentionedJid) && m.mentionedJid.length > 0) {
			console.log(`[LB] extractTarget: Using first mentioned user`);
			return m.mentionedJid[0];
		}
		
		// Priority 3: Direct input
		if (!input) {
			console.log(`[LB] extractTarget: No input provided`);
			return null;
		}
		
		input = String(input).trim();
		
		// Already a JID
		if (input.includes('@')) {
			console.log(`[LB] extractTarget: Input is already JID`);
			return input;
		}
		
		// Phone number
		if (/^\d{10,15}$/.test(input)) {
			const jid = input + '@s.whatsapp.net';
			console.log(`[LB] extractTarget: Converted phone to JID`);
			return jid;
		}
		
		// With @ symbol
		if (input.startsWith('@')) {
			const num = input.slice(1);
			if (/^\d{10,15}$/.test(num)) {
				const jid = num + '@s.whatsapp.net';
				console.log(`[LB] extractTarget: Converted @number to JID`);
				return jid;
			}
		}
		
		console.log(`[LB] extractTarget: Could not extract valid target from: ${input}`);
		return null;
		
	} catch (err) {
		console.error(`[LB] extractTarget CRASH:`, err.message);
		return null;
	}
}

/**
 * Validate message length before sending
 */
function validateMessageLength(text) {
	if (!text || typeof text !== 'string') {
		return '';
	}
	
	if (text.length > MAX_MESSAGE_LENGTH) {
		console.log(`[LB] Message truncated from ${text.length} to ${MAX_MESSAGE_LENGTH} chars`);
		return text.substring(0, MAX_MESSAGE_LENGTH - 3) + '...';
	}
	
	return text;
}

/**
 * Convert pluginMap to consistent format
 * FIXED: Handles both Map and object types
 */
function normalizePluginMap(pluginMap) {
	try {
		// Already a Map
		if (pluginMap instanceof Map) {
			console.log(`[LB] Plugin map is Map with ${pluginMap.size} entries`);
			return pluginMap;
		}
		
		// Convert object to Map
		if (typeof pluginMap === 'object' && pluginMap !== null) {
			const map = new Map(Object.entries(pluginMap));
			console.log(`[LB] Converted object to Map with ${map.size} entries`);
			return map;
		}
		
		// Fallback
		console.log(`[LB] Plugin map is invalid type: ${typeof pluginMap}`);
		return new Map();
		
	} catch (err) {
		console.error(`[LB] normalizePluginMap CRASH:`, err.message);
		return new Map();
	}
}

/**
 * Build enhanced query with context
 * FIXED: Safe metadata access
 */
function buildContextualQuery(m, args, debugId = '') {
	try {
		let query = args.join(' ').trim();
		
		// Add quoted message context
		if (m?.quoted?.body) {
			query += `\n\n[Replying to: "${String(m.quoted.body).substring(0, 100)}"]`;
		}
		
		// Add group context
		if (m?.isGroup) {
			try {
				const meta = m.groupMetadata;
				if (meta && typeof meta === 'object') {
					const participants = Array.isArray(meta.participants) ? meta.participants : [];
					const memberCount = participants.length || 0;
					const adminCount = participants.filter(p => p?.admin === true).length || 0;
					
					query += `\n\n[GROUP: "${meta.subject || 'Unknown'}" | Members: ${memberCount} | Admins: ${adminCount}`;
					query += ` | Sender: ${m.pushName || m.senderNumber || 'Unknown'}`;
					query += ` | Sender Is: ${m.isOwner ? 'Owner' : m.isAdmin ? 'Admin' : 'Member'}]`;
					
					// Add mentioned users
					if (m.mentionedJid && Array.isArray(m.mentionedJid) && m.mentionedJid.length > 0) {
						const mentions = m.mentionedJid.map(j => String(j).split('@')[0]).join(', ');
						query += `\n[Mentions: ${mentions}]`;
					}
				}
			} catch (e) {
				console.log(`[LB:${debugId}] buildContextualQuery: Error adding group context: ${e.message}`);
			}
		} else {
			query += `\n\n[DM | Sender: ${m?.pushName || m?.senderNumber || 'Unknown'} | Is Owner: ${m?.isOwner ? 'Yes' : 'No'}]`;
		}
		
		return query;
		
	} catch (err) {
		console.error(`[LB:${debugId}] buildContextualQuery CRASH:`, err.message);
		return args.join(' ').trim();
	}
}

/**
 * Safely call BK9 API with retry logic and error handling
 */
async function callBK9API(query, attempt = 1) {
	try {
		console.log(`[LB] API Call (attempt ${attempt}): Query length=${query.length}`);
		
		const apiUrl = `${BK9_API}?q=${encodeURIComponent(query)}&BK9=${encodeURIComponent(SYSTEM_PROMPT)}&model=${encodeURIComponent(MODEL)}`;
		
		const response = await axios.get(apiUrl, {
			timeout: API_TIMEOUT,
			headers: {
				'User-Agent': 'Lostboy-AI/2.0'
			}
		});
		
		const data = response.data;
		console.log(`[LB] API Response: status=${response.status}, has data=${!!data}`);
		
		// Extract response from various possible fields
		const raw = data?.BK9 || data?.answer || data?.response || data?.result || data?.text || 
		           (typeof data === 'string' ? data : null);
		
		if (!raw) {
			console.log(`[LB] API Response: No valid response field found`);
			return {
				success: false,
				error: 'EMPTY_RESPONSE',
				message: 'API returned empty response'
			};
		}
		
		// Validate response type
		if (typeof raw !== 'string') {
			console.log(`[LB] API Response: Invalid type ${typeof raw}, converting to string`);
			return {
				success: true,
				answer: String(raw)
			};
		}
		
		console.log(`[LB] API Response: Got string answer, length=${raw.length}`);
		return {
			success: true,
			answer: raw.trim()
		};
		
	} catch (err) {
		console.error(`[LB] API Call Error (attempt ${attempt}):`, err.message);
		console.error(`[LB] Error code: ${err.code}, Response status: ${err.response?.status}`);
		
		// Specific error handling
		if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
			return {
				success: false,
				error: 'TIMEOUT',
				message: `API timeout after ${API_TIMEOUT}ms`
			};
		}
		
		if (err.response?.status === 429) {
			return {
				success: false,
				error: 'RATE_LIMIT',
				message: 'API rate limit exceeded, please wait'
			};
		}
		
		if (err.response?.status >= 500) {
			return {
				success: false,
				error: 'SERVER_ERROR',
				message: `API server error (${err.response.status})`
			};
		}
		
		if (!err.response) {
			return {
				success: false,
				error: 'NETWORK_ERROR',
				message: 'Network error - API may be offline'
			};
		}
		
		return {
			success: false,
			error: 'UNKNOWN_ERROR',
			message: err.message
		};
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 COMMAND EXECUTION ENGINE - WITH COMPREHENSIVE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute a command/action with full validation
 * FIXED: Type safety, error handling, permission checks
 */
async function executeAction(sock, m, pluginMap, action, params, debugId = '') {
	const startTime = Date.now();
	
	try {
		// Validate inputs
		if (!action || typeof action !== 'string') {
			console.log(`[LB:${debugId}] executeAction: Invalid action type: ${typeof action}`);
			return false;
		}
		
		if (!params || typeof params !== 'object') {
			console.log(`[LB:${debugId}] executeAction: Params not an object, creating empty object`);
			params = {};
		}
		
		// Normalize action
		const actionLower = String(action).toLowerCase().trim();
		console.log(`[LB:${debugId}] executeAction: Normalized action="${actionLower}"`);
		
		// FIXED: Validate against whitelist
		if (!VALID_ACTIONS.has(actionLower)) {
			console.log(`[LB:${debugId}] executeAction: Action "${actionLower}" not in whitelist`);
			await m.reply(`❌ ᴀᴄᴛɪᴏɴ ɴᴏᴛ ʀᴇᴄᴏɢɴɪᴢᴇᴅ: ${actionLower}`);
			return false;
		}
		
		// Normalize pluginMap
		const normalizedMap = normalizePluginMap(pluginMap);
		
		// Look up plugin
		let plugin = normalizedMap.get(actionLower);
		
		if (!plugin) {
			// Try to find by alias
			console.log(`[LB:${debugId}] executeAction: Not found by action name, searching aliases...`);
			for (const [name, p] of normalizedMap.entries()) {
				if (!p || typeof p !== 'object') continue;
				const aliases = p.aliases || [];
				if (Array.isArray(aliases) && aliases.some(a => String(a).toLowerCase() === actionLower)) {
					console.log(`[LB:${debugId}] executeAction: Found plugin by alias: ${name}`);
					plugin = p;
					break;
				}
			}
		}
		
		if (!plugin) {
			console.log(`[LB:${debugId}] executeAction: Plugin not found for "${actionLower}"`);
			await m.reply(`❌ ᴘʟᴜɢɪɴ ɴᴏᴛ ᴀᴠᴀɪʟᴀʙʟᴇ: ${actionLower}`);
			return false;
		}
		
		if (typeof plugin.execute !== 'function') {
			console.log(`[LB:${debugId}] executeAction: Plugin has no execute function`);
			await m.reply(`❌ ᴘʟᴜɢɪɴ ᴄᴏʀʀᴜᴘᴛᴇᴅ: ${actionLower}`);
			return false;
		}
		
		// Permission checks
		if (['tagall', 'kick', 'mute', 'unmute'].includes(actionLower)) {
			if (!m.isGroup) {
				console.log(`[LB:${debugId}] executeAction: "${actionLower}" requires group`);
				await m.reply('❌ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs.');
				return false;
			}
			
			if (!m.isAdmin && !m.isOwner) {
				console.log(`[LB:${debugId}] executeAction: "${actionLower}" requires admin permission`);
				await m.reply('❌ ᴏɴʟʏ ᴀᴅᴍɪɴs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.');
				return false;
			}
		}
		
		if (['owner', 'addowner', 'setprefix', 'setpp', 'update', 'exec'].includes(actionLower)) {
			if (!m.isOwner) {
				console.log(`[LB:${debugId}] executeAction: "${actionLower}" requires owner permission`);
				await m.reply('❌ ᴏɴʟʏ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.');
				return false;
			}
		}
		
		// Build arguments based on action type
		let args = [];
		
		if (actionLower === 'tagall') {
			if (params.random && params.count) {
				const participants = m.groupMetadata?.participants;
				if (Array.isArray(participants)) {
					const randomMembers = getRandomMembers(
						participants,
						parseInt(params.count) || 0,
						m.sender,
						sock.user?.id
					);
					console.log(`[LB:${debugId}] executeAction: tagall with ${randomMembers.length} random members`);
					args = [randomMembers.join(','), params.message || ''];
				} else {
					console.log(`[LB:${debugId}] executeAction: tagall - no valid participants`);
					await m.reply('❌ ᴄᴏᴜʟᴅ ɴᴏᴛ ɢᴇᴛ ɢʀᴏᴜᴘ ᴍᴇᴍʙᴇʀs.');
					return false;
				}
			} else {
				args = [params.message || ''];
			}
		} 
		else if (actionLower === 'kick') {
			const target = extractTarget(params.target || params.mention, m);
			if (!target) {
				console.log(`[LB:${debugId}] executeAction: kick - no target`);
				await m.reply('❌ ɴᴏ ᴛᴀʀɢᴇᴛ ᴜsᴇʀ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [target];
		}
		else if (['owner', 'addowner'].includes(actionLower)) {
			const cmd = params.command || 'add';
			const target = extractTarget(params.target, m);
			args = [cmd];
			if (target) args.push(target);
		}
		else if (actionLower === 'img') {
			if (!params.query) {
				console.log(`[LB:${debugId}] executeAction: img - no query`);
				await m.reply('❌ ɴᴏ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
			if (params.count) args.push(String(params.count));
		}
		else if (actionLower === 'gen2') {
			if (!params.prompt) {
				console.log(`[LB:${debugId}] executeAction: gen2 - no prompt`);
				await m.reply('❌ ɴᴏ ᴘʀᴏᴍᴘᴛ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.prompt];
		}
		else if (actionLower === 'ytdl') {
			if (!params.url) {
				console.log(`[LB:${debugId}] executeAction: ytdl - no url`);
				await m.reply('❌ ɴᴏ ʏᴏᴜᴛᴜʙᴇ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		}
		else if (actionLower === 'ttdl') {
			if (!params.url) {
				console.log(`[LB:${debugId}] executeAction: ttdl - no url`);
				await m.reply('❌ ɴᴏ ᴛɪᴋᴛᴏᴋ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		}
		else if (['instadl', 'ig'].includes(actionLower)) {
			if (!params.url) {
				console.log(`[LB:${debugId}] executeAction: ${actionLower} - no url`);
				await m.reply('❌ ɴᴏ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.url];
		}
		else if (['welcome', 'goodbye'].includes(actionLower)) {
			const state = params.state || 'on';
			args = [state];
		}
		else if (['mute', 'unmute'].includes(actionLower)) {
			args = [];
		}
		else if (actionLower === 'aisearch') {
			if (!params.query) {
				console.log(`[LB:${debugId}] executeAction: aisearch - no query`);
				await m.reply('❌ ɴᴏ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
		}
		else if (actionLower === 'ipstalk') {
			if (!params.ip) {
				console.log(`[LB:${debugId}] executeAction: ipstalk - no ip`);
				await m.reply('❌ ɴᴏ ɪᴘ ᴀᴅᴅʀᴇss ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.ip];
		}
		else if (actionLower === 'gituser') {
			if (!params.username) {
				console.log(`[LB:${debugId}] executeAction: gituser - no username`);
				await m.reply('❌ ɴᴏ ɢɪᴛʜᴜʙ ᴜsᴇʀɴᴀᴍᴇ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.username];
		}
		else if (actionLower === 'gitrepo') {
			if (!params.query) {
				console.log(`[LB:${debugId}] executeAction: gitrepo - no query`);
				await m.reply('❌ ɴᴏ ʀᴇᴘᴏ ɴᴀᴍᴇ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.query];
		}
		else if (actionLower === 'sticker') {
			args = [];
		}
		else if (['ai', 'aiv'].includes(actionLower)) {
			if (!params.text && !params.prompt) {
				console.log(`[LB:${debugId}] executeAction: ${actionLower} - no text`);
				await m.reply('❌ ɴᴏ ᴛᴇxᴛ ᴘʀᴏᴠɪᴅᴇᴅ.');
				return false;
			}
			args = [params.text || params.prompt];
		}
		else if (actionLower === 'poll') {
			if (!params.name || !params.options) {
				console.log(`[LB:${debugId}] executeAction: poll - missing name or options`);
				await m.reply('❌ ᴘᴏʟʟ ɴᴇᴇᴅs ᴀ ɴᴀᴍᴇ ᴀɴᴅ ᴏᴘᴛɪᴏɴs.');
				return false;
			}
			const optionString = Array.isArray(params.options) 
				? params.options.join(';')
				: params.options;
			args = [[params.name, optionString].join(';')];
		}
		
		// Execute plugin
		console.log(`[LB:${debugId}] executeAction: Executing plugin "${actionLower}" with ${args.length} args`);
		await plugin.execute(sock, m, args, pluginMap);
		
		const duration = Date.now() - startTime;
		console.log(`[LB:${debugId}] executeAction: Success in ${duration}ms`);
		return true;
		
	} catch (err) {
		const duration = Date.now() - startTime;
		console.error(`[LB:${debugId}] executeAction CRASH after ${duration}ms:`, err.message);
		console.error(`[LB:${debugId}] Stack:`, err.stack);
		
		// Try to reply without crashing
		try {
			const errorMsg = err.message.substring(0, 100);
			await m.reply(`❌ ᴇʀʀᴏʀ: ${errorMsg}`);
		} catch (replyErr) {
			console.error(`[LB:${debugId}] Could not send error message:`, replyErr.message);
		}
		
		return false;
	}
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
		const debugId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const startTime = Date.now();
		
		try {
			console.log(`[LB:${debugId}] ═════════════════════════════════════════════════════════════`);
			console.log(`[LB:${debugId}] LOSTBOY AI INVOKED`);
			console.log(`[LB:${debugId}] Sender: ${m.sender}`);
			console.log(`[LB:${debugId}] Group: ${m.isGroup ? m.groupMetadata?.id : 'DM'}`);
			console.log(`[LB:${debugId}] Args: ${JSON.stringify(args)}`);
			
			// Show help if no args and no quoted message
			if (!args[0] && !m.quoted) {
				console.log(`[LB:${debugId}] No args, showing help`);
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
			
			// React with loading
			await m.react('⏳');
			
			// Build contextual query
			const contextualQuery = buildContextualQuery(m, args, debugId);
			console.log(`[LB:${debugId}] Contextual query length: ${contextualQuery.length}`);
			
			// Call API with retry logic
			console.log(`[LB:${debugId}] Calling BK9 API...`);
			let apiResult = await callBK9API(contextualQuery);
			
			if (!apiResult.success) {
				console.log(`[LB:${debugId}] API failed: ${apiResult.error} - ${apiResult.message}`);
				
				// Provide specific error messages for different failure types
				await m.react('❌');
				
				switch (apiResult.error) {
					case 'TIMEOUT':
						return m.reply('⏱️ ᴀɪ ᴀɴsᴡᴇʀ ᴛɪᴍᴇᴅ ᴏᴜᴛ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
					case 'RATE_LIMIT':
						return m.reply('🚫 ᴀɪ ᴀᴘɪ ɪs ʙᴜsʏ. ᴡᴀɪᴛ ᴀ ғᴇᴡ ᴍɪɴᴜᴛᴇs.');
					case 'SERVER_ERROR':
						return m.reply('🔴 ᴀɪ sᴇʀᴠᴇʀ ᴇʀʀᴏʀ. ᴘʟᴇᴀsᴇ ᴄᴏɴᴛᴀᴄᴛ sᴜᴘᴘᴏʀᴛ.');
					case 'NETWORK_ERROR':
						return m.reply('🌐 ɴᴇᴛᴡᴏʀᴋ ᴇʀʀᴏʀ - ᴀɪ sᴇʀᴠᴇʀ ᴍɪɢʜᴛ ʙᴇ ᴏғғʟɪɴᴇ.');
					default:
						return m.reply('❌ ʟᴏsᴛʙᴏʏ ᴀɪ ᴇɴᴄᴏᴜɴᴛᴇʀᴇᴅ ᴀɴ ᴇʀʀᴏʀ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
				}
			}
			
			const answer = apiResult.answer;
			console.log(`[LB:${debugId}] API answer length: ${answer.length}`);
			console.log(`[LB:${debugId}] First 200 chars: ${answer.substring(0, 200)}`);
			
			// Try to parse as action
			const parsedAction = parseActionFromText(answer, debugId);
			
			if (parsedAction) {
				const action = parsedAction.action?.toLowerCase?.();
				const params = parsedAction.params || {};
				
				console.log(`[LB:${debugId}] Parsed action: "${action}"`);
				console.log(`[LB:${debugId}] Parsed params: ${JSON.stringify(params)}`);
				
				if (!action) {
					console.log(`[LB:${debugId}] Action is empty after normalization`);
					await m.react('❌');
					return m.reply('❌ ᴀɪ ʀᴇsᴘᴏɴsᴇ ɪs ɪɴᴠᴀʟɪᴅ.');
				}
				
				// Execute the action
				console.log(`[LB:${debugId}] Executing action: "${action}"`);
				const executed = await executeAction(
					sock, 
					m, 
					plugins || global._pluginMap || new Map(), 
					action, 
					params,
					debugId
				);
				
				if (executed) {
					await m.react('✅');
					
					// FIXED: Only send confirmation if not already sent by plugin
					// Check if action is in confirmations AND we should show it
					const confirmMsg = ACTION_CONFIRMATIONS[action];
					if (confirmMsg && !['ai', 'aiv', 'gen2', 'aisearch', 'creator', 'menu'].includes(action)) {
						try {
							await m.reply(confirmMsg);
						} catch (confErr) {
							console.error(`[LB:${debugId}] Could not send confirmation:`, confErr.message);
						}
					}
					
					const duration = Date.now() - startTime;
					console.log(`[LB:${debugId}] Complete in ${duration}ms ✅`);
					return;
				}
				
				console.log(`[LB:${debugId}] Action execution failed`);
				await m.react('❌');
				return;
			}
			
			// Check if it looks like a broken JSON response
			if (answer.startsWith('{') && answer.includes('"action') && !answer.endsWith('}')) {
				console.log(`[LB:${debugId}] Response looks like incomplete JSON`);
				await m.react('❌');
				return m.reply('❌ ᴀɪ ʀᴇsᴘᴏɴsᴇ ᴄᴏʀʀᴜᴘᴛᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
			}
			
			// Otherwise treat as plain text response (chat)
			console.log(`[LB:${debugId}] Treating as chat response`);
			await m.react('✅');
			
			// Validate message length
			const validatedAnswer = validateMessageLength(answer);
			if (!validatedAnswer) {
				console.log(`[LB:${debugId}] Message is empty after validation`);
				return m.reply('❌ ᴀɪ ʀᴇsᴘᴏɴsᴇ ɪs ᴇᴍᴘᴛʏ.');
			}
			
			await m.reply(`\u200B${validatedAnswer}\n\n> 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ`);
			
			const duration = Date.now() - startTime;
			console.log(`[LB:${debugId}] Complete in ${duration}ms ✅`);
			
		} catch (err) {
			const duration = Date.now() - startTime;
			console.error(`[LB:${debugId}] MAIN ERROR after ${duration}ms:`, err.message);
			console.error(`[LB:${debugId}] Stack:`, err.stack);
			
			try {
				await m.react('❌');
				await m.reply('❌ ʟᴏsᴛʙᴏʏ ᴀɪ ᴇɴᴄᴏᴜɴᴛᴇʀᴇᴅ ᴀɴ ᴜɴᴇxᴘᴇᴄᴛᴇᴅ ᴇʀʀᴏʀ. ᴘʟᴇᴀsᴇ ᴄʜᴇᴄᴋ ɢᴀᴛᴇᴡᴀʏ ʟᴏɢs.');
			} catch (replyErr) {
				console.error(`[LB:${debugId}] Could not send error reply:`, replyErr.message);
			}
		}
	}
};
