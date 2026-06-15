require('dotenv').config();
global.sessionid = process.env.SESSION_ID || '';
global.BOT_PREFIX = '.';
global.owners = ['214302325760156@lid', ''];
global.dev = ['233533763772@s.whatsapp.net','25770239992037@lid'];
global.menuImage = 'https://i.ibb.co/BVmdwyv8/IMG-20260417-WA0030.jpg';
global.ownerName = 'abztech🇬🇭';
global.LOSTBOY_ENABLED = process.env.LOSTBOY_ENABLED === 'true' || false;
global.LOSTBOY_API_URL = process.env.LOSTBOY_API_URL || 'http://localhost:3000';
global.LOSTBOY_SOCKET_URL = process.env.LOSTBOY_SOCKET_URL || 'ws://localhost:3001';
global.LOSTBOY_API_KEY = process.env.LOSTBOY_API_KEY || 'lbh_8yMze60WLHRFGbPNpzSL8mXq';

