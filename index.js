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

global.generateWAMessageContent    = generateWAMessageContent;
global.generateWAMessageFromContent = generateWAMessageFromContent;
global.generateMessageID            = generateMessageID;
global.prepareWAMessageMedia        = prepareWAMessageMedia;
global.proto                        = proto;
global.Jimp                         = Jimp;
global.generateProfilePicture       = generateProfilePicture;
global.downloadMediaMessage         = downloadMediaMessage;
global.bannedChats                  = global.bannedChats || [];

const PLUGIN_FOLDER = './plugins';
const PORT          = process.env.PORT || 3000;

// ── sessions: Map<sessionId, SessionState> ────────────────────────────────────
// Each session is fully isolated: own WA socket, own IP lock, own auth folder.
const sessions = new Map();

function mkSessionDir(id) {
  const dir = path.join(__dirname, 'sessions', id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function genSessionId() {
  return crypto.randomBytes(8).toString('hex'); // e.g. "a3f9c12b44e6f018"
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}

// ── Load plugins once (shared across all sessions) ────────────────────────────
const commandMap       = new Map();
const onMessagePlugins = [];

const pluginPath = path.join(__dirname, PLUGIN_FOLDER);
if (fs.existsSync(pluginPath)) {
  for (const file of fs.readdirSync(pluginPath).filter(f => f.endsWith('.js'))) {
    try {
      const plugin = require(path.join(pluginPath, file));
      if (!plugin?.name) continue;
      if (typeof plugin.execute === 'function') {
        commandMap.set(plugin.name.toLowerCase(), plugin);
        if (Array.isArray(plugin.aliases))
          plugin.aliases.forEach(a => commandMap.set(a.toLowerCase(), plugin));
      }
      if (typeof plugin.onMessage === 'function')
        onMessagePlugins.push(plugin);
      console.log(`✅ Plugin: ${plugin.name}`);
    } catch (e) {
      console.error(`❌ Plugin [${file}]: ${e.message}`);
    }
  }
}

// ── Load prefix ───────────────────────────────────────────────────────────────
function loadPrefix() {
  const cfgPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (cfg.prefix) global.BOT_PREFIX = cfg.prefix;
    } catch (_) {}
  }
}
loadPrefix();

// ── Start a WhatsApp session ──────────────────────────────────────────────────
async function startSession(sessionId) {
  const authFolder = mkSessionDir(sessionId);

  // Create or reset state for this session
  const state = sessions.get(sessionId) || {};
  Object.assign(state, {
    id:              sessionId,
    sock:            null,
    status:          'connecting',
    qr:              null,
    pairingCode:     null,
    pairingCodeTime: 0,
    presenceInterval: null,
    paired:          false,   // true once WA connection.open fires
    lockedIP:        state.lockedIP || null, // preserve lock across reconnects
    authFolder,
  });
  sessions.set(sessionId, state);

  console.log(`🚀 [${sessionId}] Starting session…`);

  try {
    const { version }                    = await fetchLatestWaWebVersion();
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

    state.sock = sock;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        QRCode.toDataURL(qr, (err, url) => { if (!err) state.qr = url; });
        state.status = 'connecting';
      }

      if (connection === 'close') {
        state.status = 'disconnected';
        state.qr     = null;
        if (state.presenceInterval) {
          clearInterval(state.presenceInterval);
          state.presenceInterval = null;
        }

        const code = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output.statusCode : 0;

        if (code === DisconnectReason.loggedOut) {
          fs.rmSync(authFolder, { recursive: true, force: true });
          state.paired    = false;
          state.lockedIP  = null;
          console.log(`🔓 [${sessionId}] Logged out — IP lock cleared`);
        }
        setTimeout(() => startSession(sessionId), 5000);

      } else if (connection === 'open') {
        state.status      = 'connected';
        state.qr          = null;
        state.pairingCode = null;
        state.paired      = true;

        state.presenceInterval = setInterval(() => {
          if (sock?.ws?.readyState === 1) sock.sendPresenceUpdate('available');
        }, 10000);

        try {
          await sock.sendMessage(sock.user.id, {
            text: `🤖 XLICON connected!\n📝 Prefix: ${global.BOT_PREFIX}\n🔑 Session: ${sessionId}\n⏰ ${new Date().toLocaleString()}`
          });
        } catch (_) {}

      } else if (connection === 'connecting') {
        state.status = 'connecting';
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── Message handler ───────────────────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;

      const CHANNEL_ID = '120363230794474148@newsletter';

      for (const rawMsg of messages) {
        const jid = rawMsg.key?.remoteJid || '';

        if (jid === CHANNEL_ID && rawMsg.key?.server_id) {
          const emojis = ['❤️','💛','👍','💜','😮','🤍','💙','🔥','💯','⚡'];
          try {
            await sock.newsletterReactMessage(
              CHANNEL_ID, rawMsg.key.server_id.toString(),
              emojis[Math.floor(Math.random() * emojis.length)]
            );
          } catch (_) {}
          continue;
        }

        if (jid === 'status@broadcast') {
          if (rawMsg.key.participant)
            try { await sock.readMessages([rawMsg.key]); } catch (_) {}
          continue;
        }

        if (rawMsg.key?.fromMe) continue;
        if (!rawMsg.message)   continue;

        let m;
        try { m = await serializeMessage(sock, rawMsg); }
        catch (e) { console.error(`❌ [${sessionId}] serialize:`, e.message); continue; }

        let blocked = false;
        for (const plugin of onMessagePlugins) {
          try {
            if (await plugin.onMessage(sock, m) === true) { blocked = true; break; }
          } catch (e) { console.error(`❌ onMessage [${plugin.name}]:`, e.message); }
        }
        if (blocked) continue;

        const body = m.body || '';
        if (body.startsWith(global.BOT_PREFIX)) {
          const parts       = body.slice(global.BOT_PREFIX.length).trim().split(/\s+/);
          const commandName = parts[0]?.toLowerCase();
          const args        = parts.slice(1);
          if (!commandName) continue;

          const plugin = commandMap.get(commandName);
          if (plugin) {
            console.log(`▶ [${sessionId}][${m.isGroup ? 'GROUP' : 'DM'}] ${m.senderNumber} → .${commandName}`);
            try { await plugin.execute(sock, m, args); }
            catch (e) {
              console.error(`❌ Command [${commandName}]:`, e.message);
              try { await m.reply(`❌ Error: ${e.message}`); } catch (_) {}
            }
          }
        }
      }
    });

  } catch (e) {
    console.error(`❌ [${sessionId}] Startup error:`, e.message);
    setTimeout(() => startSession(sessionId), 10000);
  }
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const FRONTEND_DIR = path.join(__dirname, 'frontend');
app.use(express.static(FRONTEND_DIR));

// ── Session middleware: assign each visitor a persistent session ID via cookie ─
const COOKIE_NAME  = 'xlicon_sid';
const COOKIE_MAXAGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function ensureSession(req, res, next) {
  let sid = req.cookies?.[COOKIE_NAME];

  // validate: must be 16 hex chars and exist in sessions map
  if (!sid || !/^[0-9a-f]{16}$/.test(sid) || !sessions.has(sid)) {
    sid = genSessionId();
    res.cookie(COOKIE_NAME, sid, {
      maxAge:   COOKIE_MAXAGE,
      httpOnly: true,
      sameSite: 'lax',
    });
    // boot the new session immediately
    startSession(sid);
    console.log(`🆕 New session ${sid} for IP ${getClientIP(req)}`);
  }

  req.sessionId = sid;
  next();
}

// parse cookies manually (no cookie-parser dep needed)
app.use((req, res, next) => {
  req.cookies = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    if (k) req.cookies[k.trim()] = decodeURIComponent(v.join('='));
  });
  next();
});

// ── IP lock check per session ─────────────────────────────────────────────────
function ipLockCheck(req, res, next) {
  const sid   = req.sessionId;
  const state = sessions.get(sid);
  if (!state || !state.paired) return next(); // not connected yet — open

  const ip = getClientIP(req);

  // New IP (not the one who paired) — let them pair and take over
  if (!state.lockedIP || ip !== state.lockedIP) return next();

  // Same IP that paired — block re-pairing, show info page
  return res.status(200).send(blockedPage());
}

function blockedPage() {
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
  <div class="badge"><div class="dot"></div> Bot is online</div>
  <div class="note">WhatsApp → Linked Devices → remove this device, then reload.</div>
</div></body></html>`;
}

// ── Pages ─────────────────────────────────────────────────────────────────────
app.get('/',     ensureSession, ipLockCheck, (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'pair.html')));
app.get('/pair', ensureSession, ipLockCheck, (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'pair.html')));

// ── API: status ───────────────────────────────────────────────────────────────
app.get('/api/status', ensureSession, (req, res) => {
  const state = sessions.get(req.sessionId);
  if (!state) return res.json({ status: 'connecting', qr: null, pairingCode: null });

  const pairingCode = (state.pairingCode && Date.now() - state.pairingCodeTime < 300_000)
    ? state.pairingCode : null;

  res.json({
    status:     state.status,
    qr:         state.qr,
    pairingCode,
    prefix:     global.BOT_PREFIX,
    sessionId:  req.sessionId,
  });
});

// ── API: request pairing code ─────────────────────────────────────────────────
app.post('/pair', ensureSession, ipLockCheck, async (req, res) => {
  try {
    const sid   = req.sessionId;
    const phone = (req.body.phone || '').replace(/\D/g, '').trim();

    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const state = sessions.get(sid);
    if (!state)       return res.status(400).json({ error: 'Session not ready. Reload and try again.' });
    if (!state.sock)  return res.status(400).json({ error: 'Socket not ready.' });
    if (state.status !== 'connecting')
      return res.status(400).json({ error: `Bot is ${state.status}. Pairing only works while connecting.` });

    const code = await state.sock.requestPairingCode(phone);
    state.pairingCode     = code;
    state.pairingCodeTime = Date.now();

    // lock this session to the requester's IP
    const ip = getClientIP(req);
    if (!state.lockedIP) state.lockedIP = ip;

    console.log(`✅ [${sid}] Pairing code for ${phone}: ${code} (IP: ${ip})`);
    res.json({ code });

  } catch (e) {
    console.error('❌ POST /pair:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).send('<center><h2>404</h2><a href="/">Home</a></center>'));

// ── Boot ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌐 XLICON server → http://localhost:${PORT}`);
  // No default session at boot — sessions are created on-demand per visitor
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
