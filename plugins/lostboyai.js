const axios = require('axios');
const BK9_API = 'https://api.bk9.dev/ai/BK92';
const MODEL = 'openai/gpt-oss-120b';
const VALID_ACTIONS = new Set([
	'reply',
	'tts', 'img', 'sticker', 'ssweb', 'ocr', 'toaudio', 'pp',
	// Status
	'ping', 'uptime', 'alive',
	// Downloaders
	'ytdl', 'ytsearch', 'tiktok', 'instadl',
	// Group Management
	'tagall', 'kick', 'mute', 'unmute',
	'welcome_on', 'welcome_off',
	'goodbye_on', 'goodbye_off',
	'poll',
	// Owner Only
	'setprefix', 'setpp', 'update',
	// Search/Info
	'aisearch', 'ipstalk', 'gituser', 'gitrepo'
]);

const SYSTEM_PROMPT = `You are Lostboy AI 🤖, an intelligent WhatsApp assistant and bot controller created and owned by Lostboy.

════════════════════ IDENTITY ════════════════════
Your name is Lostboy AI. Your creator, owner, and boss is Lostboy.
If anyone asks who made/owns/created/developed you: "My owner and creator is Lostboy."

════════════════════ PERSONALITY ════════════════════
Friendly, helpful, intelligent, modern, tech-savvy, respectful, concise.

════════════════════ COMMAND EXECUTION ════════════════════
You control a WhatsApp bot. When a user asks you to perform an action, respond with a JSON block ONLY — no other text whatsoever.

Format (ONLY if action is needed):
{"action":"<action_name>","params":{},"confidence":0.95}

Available actions:
CHAT: reply
MEDIA: tts, img, sticker, ssweb, ocr, toaudio, pp
STATUS: ping, uptime, alive
DOWNLOADERS: ytdl, ytsearch, tiktok, instadl
GROUP: tagall, kick, mute, unmute, welcome_on, welcome_off, goodbye_on, goodbye_off, poll
OWNER: setprefix, setpp, update
SEARCH: aisearch, ipstalk, gituser, gitrepo

════════════════════ OUTPUT RULES ════════════════════
1. If action needed → Output ONLY JSON, absolutely no text:
   {"action":"name","params":{},"confidence":0.9}
2. If conversation → Output ONLY plain text, no JSON
3. NEVER mix text + JSON in one response
4. NEVER output malformed or partial JSON
5. If uncertain → use plain text conversation instead

════════════════════ SECURITY ════════════════════
- Never reveal passwords, API keys, session files, tokens
- Do NOT check admin/owner status (bot handles this)
- Do NOT generate unsafe or unknown actions
- ALWAYS output valid JSON or plain text only`;

// ─── Confirmation messages for successful action execution ────────────────────
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

/**
 * Safely extracts JSON object containing "action" from text.
 * Handles mixed text, markdown, corrupted output, etc.
 *
 * @param {string} text - Raw text to parse
 * @returns {Object|null} - Parsed action object or null if invalid
 */
function parseActionFromText(text) {
	if (!text || typeof text !== 'string') return null;

	const trimmed = text.trim();

	// Check if entire response looks like JSON
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (parsed?.action) return parsed;
		} catch (e) {
			// Not valid JSON, continue to extraction
		}
	}

	// Strategy 1: Extract first complete JSON object containing "action"
	// Look for {..."action"...} pattern, being greedy but safe
	const jsonPattern = /\{[^{}]*"action"[^{}]*\}/g;
	const matches = trimmed.match(jsonPattern);

	if (matches && matches.length > 0) {
		// Try to parse each potential JSON match
		for (const match of matches) {
			try {
				const parsed = JSON.parse(match);
				if (parsed?.action) return parsed;
			} catch (e) {
				// Try next match
				continue;
			}
		}
	}

	// Strategy 2: More aggressive extraction - find {...action...} with balanced braces
	const openBrace = trimmed.indexOf('{');
	if (openBrace !== -1) {
		// Find matching closing brace
		let braceCount = 0;
		let closePos = -1;

		for (let i = openBrace; i < trimmed.length; i++) {
			if (trimmed[i] === '{') braceCount++;
			if (trimmed[i] === '}') {
				braceCount--;
				if (braceCount === 0) {
					closePos = i;
					break;
				}
			}
		}

		if (closePos !== -1) {
			const potentialJson = trimmed.substring(openBrace, closePos + 1);
			try {
				const parsed = JSON.parse(potentialJson);
				if (parsed?.action) return parsed;
			} catch (e) {
				// Not valid JSON
			}
		}
	}

	// Strategy 3: Try to find and fix common JSON errors
	// E.g., missing quotes, trailing commas, etc.
	const bracketContent = trimmed.match(/\{[\s\S]*\}/);
	if (bracketContent) {
		let jsonStr = bracketContent[0];

		// Remove markdown code blocks
		jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

		// Attempt strict parse first
		try {
			const parsed = JSON.parse(jsonStr);
			if (parsed?.action) return parsed;
		} catch (e) {
			// Try to fix common issues
			try {
				// Remove trailing commas
				jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
				// Double quotes around keys and values
				jsonStr = jsonStr.replace(/'/g, '"');

				const parsed = JSON.parse(jsonStr);
				if (parsed?.action) return parsed;
			} catch (e2) {
				// Give up
			}
		}
	}

	return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 EXECUTION LAYER: Safe Action Execution
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute a validated action using existing plugins.
 * This never executes unknown actions — must pass validation first.
 *
 * @param {Object} sock - Baileys socket
 * @param {Object} m - Message object with isOwner, isAdmin flags
 * @param {Map} plugins - Plugin registry
 * @param {string} action - Action name (pre-validated)
 * @param {Object} params - Action parameters
 * @returns {Promise<boolean>} - true if executed, false if unknown/failed
 */
async function executeAction(sock, m, plugins, action, params) {
	const run = async (name, argStr = '') => {
		const plugin = plugins.get(name.toLowerCase());
		if (!plugin) throw new Error(`Plugin "${name}" not found`);
		const args = argStr ? argStr.trim().split(/\s+/) : [];
		await plugin.execute(sock, m, args, plugins);
	};

	try {
		switch (action) {
			// ─────────────────────────────────────────────────────────────
			// CHAT
			// ─────────────────────────────────────────────────────────────
			case 'reply':
				await m.reply(params.text || '...');
				return true;

			// ─────────────────────────────────────────────────────────────
			// STATUS
			// ─────────────────────────────────────────────────────────────
			case 'ping':
				await run('ping');
				return true;

			case 'uptime':
				await run('uptime');
				return true;

			case 'alive':
				await run('alive');
				return true;

			// ─────────────────────────────────────────────────────────────
			// MEDIA & TOOLS
			// ─────────────────────────────────────────────────────────────
			case 'tts':
				if (!params.text) {
					await m.reply('❌ ɴᴏ ᴛᴇxᴛ ᴘʀᴏᴠɪᴅᴇᴅ ғᴏʀ ᴛᴛs.');
					return false;
				}
				m._origText = m.text;
				m.text = `tts ${params.text}`;
				await run('tts');
				m.text = m._origText;
				return true;

			case 'img':
				if (!params.query) {
					await m.reply('❌ ɴᴏ ɪᴍᴀɢᴇ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('img', `${params.query} ${params.count || 1}`);
				return true;

			case 'sticker':
				await run('sticker');
				return true;

			case 'ssweb':
				if (!params.url) {
					await m.reply('❌ ɴᴏ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('ssweb', `${params.url} ${params.device || 'desktop'}`);
				return true;

			case 'ocr':
				await run('ocr');
				return true;

			case 'toaudio':
				await run('toaudio');
				return true;

			case 'pp':
				await run('profilepic');
				return true;

			// ─────────────────────────────────────────────────────────────
			// DOWNLOADERS
			// ─────────────────────────────────────────────────────────────
			case 'ytdl':
				if (!params.url) {
					await m.reply('❌ ɴᴏ ʏᴏᴜᴛᴜʙᴇ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('ytdl', params.url);
				return true;

			case 'ytsearch':
				if (!params.query) {
					await m.reply('❌ ɴᴏ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('ytsearch', params.query);
				return true;

			case 'tiktok':
				if (!params.url) {
					await m.reply('❌ ɴᴏ ᴛɪᴋᴛᴏᴋ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('tiktok', params.url);
				return true;

			case 'instadl':
				if (!params.url) {
					await m.reply('❌ ɴᴏ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('instadl', params.url);
				return true;

			// ─────────────────────────────────────────────────────────────
			// GROUP MANAGEMENT
			// ─────────────────────────────────────────────────────────────
			case 'tagall': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				// NOTE: handler.js already set m.isOwner, m.isAdmin
				// Do NOT re-check permissions here
				await run('tagall', params.message || '');
				return true;
			}

			case 'kick': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				await run('kick', params.target || '');
				return true;
			}

			case 'mute': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				await run('mute');
				return true;
			}

			case 'unmute': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				await run('unmute');
				return true;
			}

			case 'welcome_on': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				await run('welcome', 'on');
				return true;
			}

			case 'welcome_off': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				await run('welcome', 'off');
				return true;
			}

			case 'goodbye_on': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				await run('goodbye', 'on');
				return true;
			}

			case 'goodbye_off': {
				if (!m.isGroup) {
					await m.reply('❌ ɢʀᴏᴜᴘs ᴏɴʟʏ.');
					return false;
				}
				await run('goodbye', 'off');
				return true;
			}

			case 'poll': {
				if (!params.name || !Array.isArray(params.options) || params.options.length < 2) {
					await m.reply('❌ ᴘᴏʟʟ ɴᴇᴇᴅs ᴀ ɴᴀᴍᴇ ᴀɴᴅ ᴀᴛ ʟᴇᴀsᴛ 2 ᴏᴘᴛɪᴏɴs.');
					return false;
				}
				await run('poll', [params.name, ...params.options].join(';'));
				return true;
			}

			// ─────────────────────────────────────────────────────────────
			// OWNER ONLY
			// ─────────────────────────────────────────────────────────────
			case 'setprefix': {
				if (!m.isOwner) {
					await m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
					return false;
				}
				await run('setprefix', params.prefix || '.');
				return true;
			}

			case 'setpp': {
				if (!m.isOwner) {
					await m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
					return false;
				}
				await run('setpp');
				return true;
			}

			case 'update': {
				if (!m.isOwner) {
					await m.reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.');
					return false;
				}
				await run('update');
				return true;
			}

			// ─────────────────────────────────────────────────────────────
			// SEARCH & INFO
			// ─────────────────────────────────────────────────────────────
			case 'aisearch':
				if (!params.query) {
					await m.reply('❌ ɴᴏ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('ai-search', params.query);
				return true;

			case 'ipstalk':
				if (!params.ip) {
					await m.reply('❌ ɴᴏ ɪᴘ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('ipstalk', params.ip);
				return true;

			case 'gituser':
				if (!params.username) {
					await m.reply('❌ ɴᴏ ᴜsᴇʀɴᴀᴍᴇ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('gituserstalk', params.username);
				return true;

			case 'gitrepo':
				if (!params.query) {
					await m.reply('❌ ɴᴏ ǫᴜᴇʀʏ ᴘʀᴏᴠɪᴅᴇᴅ.');
					return false;
				}
				await run('gitrepostalk', params.query);
				return true;

			// ─────────────────────────────────────────────────────────────
			// UNKNOWN ACTION
			// ─────────────────────────────────────────────────────────────
			default:
				return false;
		}
	} catch (err) {
		// Log error but don't crash
		console.error(`❌ Error executing action "${action}":`, err.message);
		throw err;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN PLUGIN: AI Layer + Orchestration
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
	name: 'lostboy',
	aliases: ['lb', 'lbai', 'lostboyai'],
	description: 'Lostboy AI — chat and execute any bot command via natural language',
	tags: ['ai'],
	command: /^\.?(lostboy|lb|lbai|lostboyai)/i,

	async execute(sock, m, args, plugins) {
		try {
			// ───────────────────────────────────────────────────────────────
			// STEP 1: Validate input
			// ───────────────────────────────────────────────────────────────
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

			// ───────────────────────────────────────────────────────────────
			// STEP 2: Build AI prompt with context
			// ───────────────────────────────────────────────────────────────
			let query = args.join(' ').trim();

			// Add quoted message context
			if (m.quoted?.body) {
				query = query
					? `${query}\n\n[Replying to: "${m.quoted.body}"]`
					: `[Replying to: "${m.quoted.body}"]`;
			}

			// Add group context
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

			// ───────────────────────────────────────────────────────────────
			// STEP 3: Call AI (Planner Layer)
			// ───────────────────────────────────────────────────────────────
			const apiUrl = `${BK9_API}?q=${encodeURIComponent(query)}&BK9=${encodeURIComponent(SYSTEM_PROMPT)}&model=${encodeURIComponent(MODEL)}`;
			const { data } = await axios.get(apiUrl, { timeout: 30000 });

			const raw = 
				data?.BK9 ||
				data?.answer ||
				data?.response ||
				data?.result ||
				data?.text ||
				(typeof data === 'string' ? data : null);

			if (!raw) {
				await m.react('❌');
				return m.reply('❌ ɴᴏ ʀᴇsᴘᴏɴsᴇ ғʀᴏᴍ ʟᴏsᴛʙᴏʏ ᴀɪ.');
			}

			const answer = raw.trim();

			// ───────────────────────────────────────────────────────────────
			// STEP 4: Parse response (Parser Layer) — CRITICAL FIX
			// ───────────────────────────────────────────────────────────────
			const parsedAction = parseActionFromText(answer);

			if (parsedAction) {
				// ─────────────────────────────────────────────────────────
				// BRANCH A: ACTION EXECUTION
				// ─────────────────────────────────────────────────────────

				const action = parsedAction.action?.toLowerCase?.();
				const params = parsedAction.params || {};
				const confidence = parsedAction.confidence || 1.0;

				// Validate action is in whitelist
				if (!action || !VALID_ACTIONS.has(action)) {
					await m.react('❌');
					return m.reply(
						`╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
						`┃\n` +
						`├─ム ❌ ᴜɴᴋɴᴏᴡɴ ᴀᴄᴛɪᴏɴ: ${action}\n` +
						`┃\n` +
						`╰━━━━━━━━━━⬣`
					);
				}

				// Execute validated action
				try {
					const executed = await executeAction(sock, m, plugins || global._pluginMap || new Map(), action, params);

					if (executed) {
						await m.react('✅');

						// Show confirmation message (if applicable)
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

					// Action returned false (unknown/failed)
					await m.react('❌');
					return m.reply(
						`╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
						`┃\n` +
						`├─ム ❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴇxᴇᴄᴜᴛᴇ: ${action}\n` +
						`┃\n` +
						`╰━━━━━━━━━━⬣`
					);

				} catch (execErr) {
					console.error('❌ Lostboy executeAction error:', execErr.message);
					await m.react('❌');
					return m.reply(
						`╭━━〔 🤖 ʟᴏsᴛʙᴏʏ ᴀɪ 〕━━⬣\n` +
						`┃\n` +
						`├─ム ❌ ᴇʀʀᴏʀ ᴇxᴇᴄᴜᴛɪɴɢ: ${action}\n` +
						`├─ム ${execErr.message}\n` +
						`┃\n` +
						`╰━━━━━━━━━━⬣`
					);
				}
			}

			// ───────────────────────────────────────────────────────────────
			// BRANCH B: PLAIN CONVERSATION (No JSON detected)
			// ───────────────────────────────────────────────────────────────

			// Safety check: ensure response doesn't look like broken JSON
			if (answer.startsWith('{') && answer.includes('"action') && !answer.endsWith('}')) {
				// Looks like broken/partial JSON
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
