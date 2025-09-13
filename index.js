require('dotenv').config();
const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const P = require('pino');
const path = require('path');

const { loadPlugins } = require('./lib/pluginLoader');
const { routeMessage } = require('./lib/commandRouter');

async function start() {
  const { version } = await fetchLatestBaileysVersion();
  const authPath = path.resolve('./auth_info.json');
  const { state, saveState } = useSingleFileAuthState(authPath);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true, // shows QR in terminal for scanning
    logger: P({ level: 'info' }),
  });

  const { commands } = loadPlugins();

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m?.messages?.[0];
      if (!msg || msg.key?.fromMe) return;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const chatId = msg.key.remoteJid;

      await routeMessage({ sock, chatId, text, commands, msg });
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== 401);
      if (shouldReconnect) start();
      else console.log('Connection closed, not reconnecting.');
    } else if (connection === 'open') {
      console.log('Connected');
    }
  });

  process.on('SIGINT', () => {
    saveState();
    process.exit(0);
  });
}

start().catch(err => console.error('Failed to start bot:', err));
