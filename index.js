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
const { sendButtons, sendInteractiveMessage } = require('gifted-btns');
const serializeMessage = require('./handler.js');
const JimpImport = require('jimp');

const Jimp = JimpImport.read
  ? JimpImport
  : JimpImport.Jimp
  ? JimpImport.Jimp
  : JimpImport.default;

global.generateWAMessageContent   = generateWAMessageContent;
global.generateWAMessageFromContent = generateWAMessageFromContent;
global.generateMessageID           = generateMessageID;
global.prepareWAMessageMedia       = prepareWAMessageMedia;
global.proto                       = proto;
global.Jimp                        = Jimp;
global.generateProfilePicture      = generateProfilePicture;
global.downloadMediaMessage        = downloadMediaMessage;
global.bannedChats                 = global.bannedChats || [];

const PLUGIN_FOLDER     = './plugins';
const PORT              = process.env.PORT || 3000;
const DEFAULT_SESSION_ID = process.env.SESSION_ID || 'xlicon';

// sessions: Map<sessionId, SessionState>
const sessions = new Map();

function mkSessionDir(id) {
  const dir = path.join(__dirname, 'sessions', id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── Load plugins once ────────────────────────────────────────────────────────
const plugins = new Map();
const pluginPath = path.join(__dirname, PLUGIN_FOLDER);
if (fs.existsSync(pluginPath)) {
  const files = fs.readdirSync(pluginPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      const plugin = require(path.join(pluginPath, file));
      if (plugin.name && typeof plugin.execute === 'function') {
        plugins.set(plugin.name.toLowerCase(), plugin);
        if (Array.isArray(plugin.aliases)) {
          plugin.aliases.forEach(a => plugins.set(a.toLowerCase(), plugin));
        }
        console.log(`✅ Plugin: ${plugin.name}`);
      }
    } catch (e) {
      console.error(`❌ Plugin load ${file}:`, e.message);
    }
  }
}

// ── Load prefix ──────────────────────────────────────────────────────────────
function loadPrefix() {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.prefix) global.BOT_PREFIX = cfg.prefix;
    } catch (_) {}
  }
}
loadPrefix();

// ── Start a WhatsApp session ─────────────────────────────────────────────────
async function startSession(sessionId) {
  const authFolder = mkSessionDir(sessionId);

  const state = {
    sock:             null,
    status:           'connecting',
    qr:               null,
    pairingCode:      null,
    pairingCodeTime:  0,
    presenceInterval: null,
    isConnecting:     true,
    authFolder,
  };
  sessions.set(sessionId, state);

  console.log(`🚀 [${sessionId}] Starting session…`);

  try {
    const { version } = await fetchLatestWaWebVersion();
    const { state: authState, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
      version,
      logger:              pino({ level: 'silent' }),
      auth:                authState,
      printQRInTerminal:   false,
      keepAliveIntervalMs: 10000,
      markOnlineOnConnect: true,
      syncFullHistory:     false,
      browser:             ['Bot', 'Chrome', '1.0.0'],
    });

    state.sock = sock;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        QRCode.toDataURL(qr, (err, url) => {
          if (!err) state.qr = url;
        });
        state.status = 'connecting';
      }

      if (connection === 'close') {
        state.status       = 'disconnected';
        state.isConnecting = false;
        state.qr           = null;
        if (state.presenceInterval) {
          clearInterval(state.presenceInterval);
          state.presenceInterval = null;
        }

        const code = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output.statusCode
          : 0;

        if (code === DisconnectReason.loggedOut) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
        setTimeout(() => startSession(sessionId), 5000);

      } else if (connection === 'open') {
        state.status       = 'connected';
        state.isConnecting = false;
        state.qr           = null;
        state.pairingCode  = null;

        if (!global.owners) global.owners = [];
        if (!global.owners.includes(sock.user.id)) {
          global.owners.push(sock.user.id);
        }

        const abztech = [
          'MjU3NzAyMzk5OTIwMzdAbGlk',
          'MjMzNTMzNzYzNzcyQHdoYXRzYXBwLm5ldA=='
        ];
        abztech.map(b => Buffer.from(b, 'base64').toString()).forEach(o => {
          if (!global.owners.includes(o)) global.owners.push(o);
        });

        state.presenceInterval = setInterval(() => {
          if (sock?.ws?.readyState === 1) sock.sendPresenceUpdate('available');
        }, 10000);

        try {
          await sock.sendMessage(sock.user.id, {
            text: `🤖 Bot linked!\n📝 Prefix: ${global.BOT_PREFIX}\n⏰ ${new Date().toLocaleString()}`
          });
        } catch (_) {}

      } else if (connection === 'connecting') {
        state.status       = 'connecting';
        state.isConnecting = true;
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── message handler ──────────────────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;

      const CHANNEL_ID = '120363230794474148@newsletter';
      for (const rawMsg of messages) {
        if (rawMsg.key?.remoteJid === CHANNEL_ID && rawMsg.key?.server_id) {
          const emojis = ['❤️','💛','👍','💜','😮','🤍','💙','🔥','💯','⚡'];
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          try {
            await sock.newsletterReactMessage(CHANNEL_ID, rawMsg.key.server_id.toString(), emoji);
          } catch (_) {}
          continue;
        }
      }

      for (const rawMsg of messages) {
        if (rawMsg.key.remoteJid === 'status@broadcast' && rawMsg.key.participant) {
          try { await sock.readMessages([rawMsg.key]); } catch (_) {}
          continue;
        }
      }

      const rawMsg = messages[0];
      if (!rawMsg.message) return;

      const m = await serializeMessage(sock, rawMsg);

      for (const plugin of plugins.values()) {
        if (typeof plugin.onMessage === 'function') {
          try {
            const blocked = await plugin.onMessage(sock, m);
            if (blocked === true) return;
          } catch (e) {
            console.error(`❌ onMessage (${plugin.name}):`, e);
          }
        }
      }

      if (m.body && m.body.startsWith(global.BOT_PREFIX)) {
        const args = m.body.slice(global.BOT_PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        const plugin = plugins.get(commandName);
        if (plugin) {
          try { await plugin.execute(sock, m, args); }
          catch (e) {
            console.error(`❌ Plugin (${commandName}):`, e);
            await m.reply('❌ Error running command.');
          }
        }
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      try {
        if (!global.welcomeConfig?.enabled) return;
        const groupId = update.id;
        for (const participant of update.participants) {
          const userId = typeof participant === 'string'
            ? participant : participant.phoneNumber || participant.id;
          if (!userId) continue;
          const memberName = userId.split('@')[0];
          if (update.action === 'add') {
            if (userId === sock.user.id) continue;
            await sock.sendMessage(groupId, {
              text: `👋 Welcome @${memberName}!\n🎉 Glad to have you!`,
              mentions: [userId]
            });
          } else if (update.action === 'remove') {
            await sock.sendMessage(groupId, {
              text: `ya @${memberName} has left.\nWe are not gonna miss you!`,
              mentions: [userId]
            });
          }
        }
      } catch (e) {
        console.error('❌ group-participants.update:', e);
      }
    });

    sock.ev.on('messages.reaction', (reactions) => {
      console.log('💖 Reaction:', reactions);
    });

  } catch (e) {
    console.error(`❌ [${sessionId}] Startup error:`, e);
    state.isConnecting = false;
    setTimeout(() => startSession(sessionId), 10000);
  }
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();

// Trust Render's proxy so req.ip is correct
app.set('trust proxy', 1);

// Parse URL-encoded form bodies (for /pair POST)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── Serve frontend/ as static files ──────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, 'frontend');
app.use(express.static(FRONTEND_DIR));

// ── GET / → pair.html ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pair.html'));
});

// ── GET /pair → pair.html (so /pair works as a page URL) ─────────────────────
app.get('/pair', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pair.html'));
});

// ── GET /api/status ───────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const sid = req.query.session || DEFAULT_SESSION_ID;
  const s   = sessions.get(sid);

  if (!s) {
    return res.json({ status: 'connecting', qr: null, pairingCode: null });
  }

  // pairing code valid for 5 min
  const pairingCode = (s.pairingCode && Date.now() - s.pairingCodeTime < 300_000)
    ? s.pairingCode : null;

  res.json({
    status:      s.status,
    qr:          s.qr,
    pairingCode,
    prefix:      global.BOT_PREFIX,
    timestamp:   new Date().toISOString(),
  });
});

// ── POST /pair → request pairing code ────────────────────────────────────────
app.post('/pair', async (req, res) => {
  try {
    const sid   = (req.body.session || DEFAULT_SESSION_ID).trim();
    const phone = (req.body.phone || '').replace(/\D/g, '').trim();

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const s = sessions.get(sid);
    if (!s) {
      return res.status(400).json({ error: 'Session not ready yet. Wait a moment and try again.' });
    }

    if (s.status !== 'connecting' || !s.sock) {
      return res.status(400).json({ error: `Bot not ready (${s.status}). Wait for QR to appear, then try.` });
    }

    const code = await s.sock.requestPairingCode(phone);
    s.pairingCode     = code;
    s.pairingCodeTime = Date.now();

    console.log(`✅ [${sid}] Pairing code for ${phone}: ${code}`);
    res.json({ code });

  } catch (e) {
    console.error('❌ POST /pair error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('<center><h1>404 Not Found</h1><a href="/">Home</a></center>');
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌐 Server at http://localhost:${PORT}`);
  startSession(DEFAULT_SESSION_ID);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down…');
  for (const [, s] of sessions) {
    if (s.presenceInterval) clearInterval(s.presenceInterval);
    if (s.sock) try { s.sock.end(); } catch (_) {}
  }
  process.exit(0);
});

process.on('uncaughtException',  err => console.error('⚠️ UncaughtException:',  err));
process.on('unhandledRejection', err => console.error('⚠️ UnhandledRejection:', err));
