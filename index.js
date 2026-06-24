require('./config');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  generateWAMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  prepareWAMessageMedia,
  fetchLatestWaWebVersion,
  proto,
  generateProfilePicture
} = require('@whiskeysockets/baileys');
const pino     = require('pino');
const fs       = require('fs');
const path     = require('path');
const QRCode   = require('qrcode');
const { Boom } = require('@hapi/boom');
const express  = require('express');
const crypto   = require('crypto');
const serializeMessage = require('./handler.js');
const JimpImport = require('jimp');

const Jimp = JimpImport.read ? JimpImport
  : JimpImport.Jimp ? JimpImport.Jimp
  : JimpImport.default;

global.generateWAMessageContent     = generateWAMessageContent;
global.generateWAMessageFromContent  = generateWAMessageFromContent;
global.generateMessageID             = generateMessageID;
global.prepareWAMessageMedia         = prepareWAMessageMedia;
global.proto                         = proto;
global.Jimp                          = Jimp;
global.generateProfilePicture        = generateProfilePicture;
global.downloadMediaMessage          = downloadMediaMessage;
global.bannedChats                   = global.bannedChats || [];
global.antiDeleteStore               = global.antiDeleteStore || {};
global.autoStatusView                = global.autoStatusView || false;
global.autoStatusLike                = global.autoStatusLike || false;

const PLUGIN_FOLDER = './plugins';
const PORT          = process.env.PORT || 3000;
const SESSIONS_DIR  = path.join(__dirname, 'sessions');
const COOKIE_NAME   = 'xlicon_sid';
const COOKIE_MAX    = 7 * 24 * 60 * 60; // 7 days in seconds

// ── Session store ─────────────────────────────────────────────────────────────
const sessions = new Map();

function mkSessionDir(id) {
  const dir = path.join(SESSIONS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function genId() {
  return crypto.randomBytes(8).toString('hex');
}

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}

// ── Load plugins ──────────────────────────────────────────────────────────────
// commandMap  → prefix commands  (plugin.execute)
// hookPlugins → passive hooks    (plugin.onMessage)
// Both are independent — a plugin can have one or both
const commandMap  = new Map();
const hookPlugins = [];

{
  const pluginPath = path.join(__dirname, PLUGIN_FOLDER);
  if (fs.existsSync(pluginPath)) {
    for (const file of fs.readdirSync(pluginPath).filter(f => f.endsWith('.js'))) {
      try {
        const plugin = require(path.join(pluginPath, file));
        if (!plugin?.name) continue;

        // register execute commands
        if (typeof plugin.execute === 'function') {
          commandMap.set(plugin.name.toLowerCase(), plugin);
          if (Array.isArray(plugin.aliases))
            plugin.aliases.forEach(a => commandMap.set(a.toLowerCase(), plugin));
        }

        // register onMessage hooks separately
        if (typeof plugin.onMessage === 'function')
          hookPlugins.push(plugin);

        console.log(`✅ Plugin: ${plugin.name}`);
      } catch (e) {
        console.error(`❌ Plugin [${file}]: ${e.message}`);
      }
    }
  }
  console.log(`📦 ${commandMap.size} commands | ${hookPlugins.length} hooks`);
}

// ── Prefix ────────────────────────────────────────────────────────────────────
{
  const cfgPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (cfg.prefix) global.BOT_PREFIX = cfg.prefix;
    } catch (_) {}
  }
}

// ── Welcome / goodbye helper (used by group-participants.update) ───────────────
function getGroupSettings(groupId) {
  const settingsPath = path.join(__dirname, 'data', 'groupSettings.json');
  try {
    if (!fs.existsSync(settingsPath)) return { welcome: false, goodbye: false };
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return data[groupId] || { welcome: false, goodbye: false };
  } catch {
    return { welcome: false, goodbye: false };
  }
}

// ── Start a WhatsApp session ──────────────────────────────────────────────────
// `state.starting` flag prevents duplicate sockets being spawned for the same session.
async function startSession(sessionId) {
  const existing = sessions.get(sessionId);

  // Guard: skip if a start is already running or socket is live and connected
  if (existing?.starting) {
    console.log(`⏭  [${sessionId}] Already starting — skipped`);
    return;
  }
  if (existing?.sock && existing.status === 'connected') {
    console.log(`⏭  [${sessionId}] Already connected — skipped`);
    return;
  }

  const authFolder = mkSessionDir(sessionId);

  const state = {
    id:              sessionId,
    sock:            null,
    status:          'connecting',
    qr:              null,
    pairingCode:     null,
    pairingCodeTime: 0,
    presenceInterval: null,
    paired:          false,
    lockedIP:        existing?.lockedIP || null,
    starting:        true,
    authFolder,
  };
  sessions.set(sessionId, state);

  console.log(`🚀 [${sessionId}] Starting session…`);

  try {
    const { version }                     = await fetchLatestWaWebVersion();
    const { state: authState, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
      version,
      logger:              pino({ level: 'silent' }),
      auth:                authState,
      printQRInTerminal:   false,
      keepAliveIntervalMs: 10000,
      markOnlineOnConnect: true,
      syncFullHistory:     false,
      browser:             ['XLICON', 'Chrome', '1.0.0'],
    });

    state.sock     = sock;
    state.starting = false;

    // ── Connection events ─────────────────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        QRCode.toDataURL(qr, (err, url) => { if (!err) state.qr = url; });
        state.status = 'connecting';
      }

      if (connection === 'close') {
        state.status   = 'disconnected';
        state.qr       = null;
        state.starting = false;

        if (state.presenceInterval) {
          clearInterval(state.presenceInterval);
          state.presenceInterval = null;
        }

        const statusCode = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output.statusCode : 0;

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (!shouldReconnect) {
          try { fs.rmSync(authFolder, { recursive: true, force: true }); } catch (_) {}
          state.paired   = false;
          state.lockedIP = null;
          console.log(`🔓 [${sessionId}] Logged out — creds wiped`);
        } else {
          console.log(`🔄 [${sessionId}] Reconnecting in 5s (code ${statusCode})…`);
          state.sock = null; // clear so guard lets next start through
          setTimeout(() => startSession(sessionId), 5000);
        }

      } else if (connection === 'open') {
        state.status   = 'connected';
        state.qr       = null;
        state.paired   = true;
        state.starting = false;

        // keep online
        state.presenceInterval = setInterval(() => {
          if (sock?.ws?.readyState === 1) sock.sendPresenceUpdate('available');
        }, 10000);

        const userJid = sock.user.id;
        console.log(`✅ [${sessionId}] Connected as ${userJid}`);

        // send connected notification to self
        try {
          await sock.sendMessage(userJid, {
            text: [
              `╔══════════════════╗`,
              `║   🤖 XLICON BOT  ║`,
              `╚══════════════════╝`,
              ``,
              `✅ *Bot Successfully Connected!*`,
              ``,
              `📝 Prefix : ${global.BOT_PREFIX}`,
              `📦 Plugins: ${commandMap.size} commands loaded`,
              `🔗 Session: ${sessionId}`,
              `⏰ Time   : ${new Date().toLocaleString()}`,
              ``,
              `_Send ${global.BOT_PREFIX}menu to see all commands_`,
            ].join('\n')
          });
        } catch (_) {}

      } else if (connection === 'connecting') {
        state.status = 'connecting';
      }
    });

    // ── Credentials updated ───────────────────────────────────────────────
    sock.ev.on('creds.update', saveCreds);

    // ── Messages ──────────────────────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;

      const CHANNEL_ID = '120363230794474148@newsletter';

      for (const rawMsg of messages) {
        const jid = rawMsg.key?.remoteJid || '';

        // ── newsletter auto-react ────────────────────────────────────────
        if (jid === CHANNEL_ID && rawMsg.key?.server_id) {
          const emojis = ['❤️','💛','👍','💜','😮','🤍','💙','🔥','💯','⚡'];
          try {
            await sock.newsletterReactMessage(
              CHANNEL_ID,
              rawMsg.key.server_id.toString(),
              emojis[Math.floor(Math.random() * emojis.length)]
            );
          } catch (_) {}
          continue;
        }

        // ── status broadcast: auto-view + auto-like ──────────────────────
        if (jid === 'status@broadcast') {
          try { await sock.readMessages([rawMsg.key]); } catch (_) {}

          if (global.autoStatusLike && rawMsg.key.participant) {
            try {
              await sock.sendMessage('status@broadcast', {
                react: { key: rawMsg.key, text: '❤️' }
              });
            } catch (_) {}
          }
          continue;
        }

        // skip own messages and empty messages
        if (rawMsg.key?.fromMe) continue;
        if (!rawMsg.message)    continue;

        // ── antidelete: store messages before processing ──────────────────
        if (global.antiDeleteStore) {
          const chatId = jid;
          if (!global.antiDeleteStore[chatId]) global.antiDeleteStore[chatId] = {};
          if (!global.antiDeleteStore[chatId].enabled) {
            // store anyway for when it gets enabled
          }
          // Store message in cache keyed by message ID
          const msgId = rawMsg.key.id;
          if (!global.msgCache) global.msgCache = new Map();
          global.msgCache.set(msgId, { msg: rawMsg, time: Date.now(), jid: chatId });
          // prune cache older than 30 min
          if (global.msgCache.size > 500) {
            const cutoff = Date.now() - 30 * 60 * 1000;
            for (const [k, v] of global.msgCache) {
              if (v.time < cutoff) global.msgCache.delete(k);
            }
          }
        }

        let m;
        try {
          m = await serializeMessage(sock, rawMsg);
        } catch (e) {
          console.error(`❌ [${sessionId}] serialize:`, e.message);
          continue;
        }

        // ── run onMessage hooks (autoreact, niggareply, arise, etc.) ──────
        let blocked = false;
        for (const plugin of hookPlugins) {
          try {
            if (await plugin.onMessage(sock, m) === true) { blocked = true; break; }
          } catch (e) {
            console.error(`❌ hook [${plugin.name}]:`, e.message);
          }
        }
        if (blocked) continue;

        // ── prefix command dispatch ───────────────────────────────────────
        const body = m.body || '';
        if (!body.startsWith(global.BOT_PREFIX)) continue;

        const parts       = body.slice(global.BOT_PREFIX.length).trim().split(/\s+/);
        const commandName = parts[0]?.toLowerCase();
        if (!commandName) continue;

        const plugin = commandMap.get(commandName);
        if (!plugin) continue;

        console.log(`▶ [${sessionId}][${m.isGroup ? 'GRP' : 'DM'}] ${m.senderNumber} → .${commandName}`);
        try {
          await plugin.execute(sock, m, parts.slice(1));
        } catch (e) {
          console.error(`❌ cmd [${commandName}]:`, e.message);
          try { await m.reply(`❌ Error: ${e.message}`); } catch (_) {}
        }
      }
    });

    // ── Message delete: antidelete ────────────────────────────────────────
    sock.ev.on('messages.delete', async (item) => {
      try {
        const keys = item.keys || [];
        for (const key of keys) {
          const msgId = key.id;
          const jid   = key.remoteJid;

          if (!global.antiDeleteStore?.[jid]?.enabled) continue;
          const cached = global.msgCache?.get(msgId);
          if (!cached) continue;

          const sendTo = global.antiDeleteStore[jid].notifyJid || jid;
          const originalMsg = cached.msg;

          // forward the deleted message
          const msgType = Object.keys(originalMsg.message || {})[0];
          try {
            await sock.sendMessage(sendTo, {
              text: `🗑️ *Deleted Message Detected*\n👤 From: @${key.participant?.split('@')[0] || 'unknown'}`,
              mentions: key.participant ? [key.participant] : []
            });
            if (originalMsg.message) {
              await sock.copyNForward(sendTo, originalMsg, true);
            }
          } catch (_) {}
        }
      } catch (e) {
        console.error('❌ antidelete handler:', e.message);
      }
    });

    // ── Group participants: welcome / goodbye ─────────────────────────────
    sock.ev.on('group-participants.update', async (update) => {
      try {
        const { id: groupId, participants, action } = update;
        const settings = getGroupSettings(groupId);

        for (const participant of participants) {
          const userId = typeof participant === 'string'
            ? participant
            : participant.id || participant.phoneNumber;
          if (!userId) continue;
          if (userId === sock.user.id) continue; // skip self

          const name   = userId.split('@')[0];
          let groupMeta;
          try { groupMeta = await sock.groupMetadata(groupId); } catch (_) {}
          const groupName  = groupMeta?.subject || 'the group';
          const memberCount = groupMeta?.participants?.length || 0;

          if (action === 'add' && settings.welcome) {
            await sock.sendMessage(groupId, {
              text: [
                `╔══════════════════╗`,
                `║   👋 WELCOME!    ║`,
                `╚══════════════════╝`,
                ``,
                `Hey @${name}! Welcome to *${groupName}* 🎉`,
                `You are member #${memberCount}`,
                ``,
                `_Enjoy your stay!_ 🌟`,
              ].join('\n'),
              mentions: [userId]
            });
          } else if (action === 'remove' && settings.goodbye) {
            await sock.sendMessage(groupId, {
              text: [
                `╔══════════════════╗`,
                `║   👋 GOODBYE!    ║`,
                `╚══════════════════╝`,
                ``,
                `@${name} has left *${groupName}*.`,
                `We'll miss you! 💔`,
              ].join('\n'),
              mentions: [userId]
            });
          }
        }
      } catch (e) {
        console.error('❌ group-participants.update:', e.message);
      }
    });

  } catch (e) {
    console.error(`❌ [${sessionId}] Startup error:`, e.message);
    state.starting = false;
    state.sock     = null;
    setTimeout(() => startSession(sessionId), 10000);
  }
}

// ── Restore sessions from disk on boot ───────────────────────────────────────
function restoreSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) return;
  const dirs = fs.readdirSync(SESSIONS_DIR)
    .filter(d => /^[0-9a-f]{16}$/.test(d))
    .filter(d => fs.existsSync(path.join(SESSIONS_DIR, d, 'creds.json')));
  if (!dirs.length) return;
  console.log(`♻️  Restoring ${dirs.length} session(s) from disk…`);
  for (const sid of dirs) startSession(sid);
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const FRONTEND_DIR = path.join(__dirname, 'frontend');
app.use(express.static(FRONTEND_DIR));

// ── Cookie parser ─────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  req.cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    try { req.cookies[k] = decodeURIComponent(v); } catch (_) { req.cookies[k] = v; }
  }
  next();
});

// ── Session middleware ────────────────────────────────────────────────────────
function ensureSession(req, res, next) {
  const raw = req.cookies[COOKIE_NAME] || '';
  const sid = /^[0-9a-f]{16}$/.test(raw) ? raw : null;

  if (sid && sessions.has(sid)) {
    req.sessionId = sid;
    return next();
  }

  const newId = genId();
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${newId}; Max-Age=${COOKIE_MAX}; HttpOnly; SameSite=Lax; Path=/`
  );
  req.sessionId = newId;
  startSession(newId);
  console.log(`🆕 New session ${newId} for IP ${getIP(req)}`);
  next();
}

// ── IP lock ───────────────────────────────────────────────────────────────────
// Blocks the IP that paired from re-pairing while connected.
// New IPs can always pair (multi-user support).
function ipLockCheck(req, res, next) {
  const state = sessions.get(req.sessionId);
  if (!state?.paired) return next();

  const ip = getIP(req);
  if (!state.lockedIP || ip !== state.lockedIP) return next();

  return res.status(200).send(alreadyConnectedPage());
}

function alreadyConnectedPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>XLICON — Already Connected</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;background:#07101f;color:#dde7f5;font-family:'Segoe UI',system-ui,sans-serif;
       display:flex;align-items:center;justify-content:center;padding:24px;
       background-image:radial-gradient(ellipse 80% 40% at 50% -10%,rgba(37,211,102,.06) 0%,transparent 70%)}
  .card{width:min(420px,100%);background:#0d1a2d;border:1px solid #1a2e47;border-radius:24px;
        padding:40px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:20px}
  .icon{width:72px;height:72px;border-radius:50%;background:rgba(37,211,102,.1);
        border:1px solid rgba(37,211,102,.3);display:flex;align-items:center;justify-content:center}
  .icon svg{width:34px;height:34px;stroke:#25d366;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  h1{font-size:1.5rem;font-weight:700}h1 em{font-style:normal;color:#25d366}
  p{color:#5a738f;font-size:.88rem;line-height:1.7;max-width:300px}
  .badge{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;background:#111f33;
         border:1px solid #1a2e47;border-radius:40px;font-size:.75rem;font-weight:600;color:#25d366}
  .dot{width:7px;height:7px;border-radius:50%;background:#25d366;animation:p 1.4s infinite alternate}
  .note{font-size:.76rem;color:#3d5570}
  @keyframes p{from{opacity:.4}to{opacity:1}}
</style>
</head>
<body><div class="card">
  <div class="icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
  <h1><em>XLICON</em> Connected</h1>
  <p>Your bot is already linked and running. Unlink from WhatsApp first to re-pair.</p>
  <div class="badge"><div class="dot"></div>Bot is online</div>
  <div class="note">WhatsApp → Linked Devices → remove this device, then reload.</div>
</div></body></html>`;
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/',     ensureSession, ipLockCheck, (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'pair.html')));
app.get('/pair', ensureSession, ipLockCheck, (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'pair.html')));

app.get('/new-session', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/`);
  res.redirect('/');
});

app.get('/api/status', ensureSession, (req, res) => {
  const state = sessions.get(req.sessionId);
  if (!state) return res.json({ status: 'connecting', qr: null, pairingCode: null });

  const pairingCode = (state.pairingCode && Date.now() - state.pairingCodeTime < 300_000)
    ? state.pairingCode : null;

  res.json({
    status:    state.status,
    qr:        state.qr,
    pairingCode,
    prefix:    global.BOT_PREFIX,
    sessionId: req.sessionId,
  });
});

app.post('/pair', ensureSession, ipLockCheck, async (req, res) => {
  try {
    const phone = (req.body.phone || '').replace(/\D/g, '').trim();
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const state = sessions.get(req.sessionId);
    if (!state)      return res.status(400).json({ error: 'Session not ready. Reload and try again.' });
    if (!state.sock) return res.status(400).json({ error: 'Socket not ready yet. Wait a moment.' });
    if (state.status !== 'connecting')
      return res.status(400).json({ error: `Cannot pair — bot is ${state.status}.` });

    const code = await state.sock.requestPairingCode(phone);
    state.pairingCode     = code;
    state.pairingCodeTime = Date.now();

    const ip = getIP(req);
    if (!state.lockedIP) {
      state.lockedIP = ip;
      console.log(`🔒 [${req.sessionId}] IP locked to ${ip}`);
    }

    console.log(`✅ [${req.sessionId}] Pairing code → ${phone}: ${code}`);
    res.json({ code });

  } catch (e) {
    console.error('❌ POST /pair:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.use((_req, res) => res.status(404).send('<center><h2>404</h2><a href="/">Home</a></center>'));

// ── Boot ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌐 XLICON → http://localhost:${PORT}`);
  restoreSessions();
});

process.on('SIGINT', () => {
  for (const [, s] of sessions) {
    if (s.presenceInterval) clearInterval(s.presenceInterval);
    try { s.sock?.end(); } catch (_) {}
  }
  process.exit(0);
});

process.on('uncaughtException',  e => console.error('⚠️ Uncaught:', e.message));
process.on('unhandledRejection', e => console.error('⚠️ Rejection:', e));
