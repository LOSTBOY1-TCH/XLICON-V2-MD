/**
 * LostboyHub Integration Module
 * Enables real-time bot debugging and testing via LostboyHub Dashboard
 */

const io = require('socket.io-client');

class LostboyHubIntegration {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.botId = null;
    this.messageQueue = [];
    this.maxQueueSize = 1000;
  }

  /**
   * Initialize connection to LostboyHub
   */
  async init() {
    if (!global.LOSTBOY_ENABLED || !global.LOSTBOY_API_KEY) {
      console.log('⚠️ LostboyHub disabled. Set LOSTBOY_ENABLED=true and LOSTBOY_API_KEY to enable.');
      return false;
    }

    try {
      console.log('🔗 Connecting to LostboyHub...');
      
      this.socket = io(global.LOSTBOY_SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.setupEventListeners();
      await this.waitForConnection(10000);
      return this.connected;
    } catch (err) {
      console.error('❌ Failed to initialize LostboyHub:', err.message);
      return false;
    }
  }

  /**
   * Wait for socket connection with timeout
   */
  waitForConnection(timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (this.connected) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          console.warn('⏱️ LostboyHub connection timeout');
          resolve(false);
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to LostboyHub');
      this.connected = true;
      this.registerBot();
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from LostboyHub');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ LostboyHub socket error:', error);
    });

    this.socket.on('bot:command', (data) => {
      this.handleBotCommand(data);
    });

    this.socket.on('test:message', (data) => {
      global.lostboyTestMessage = data;
    });
  }

  /**
   * Register bot with LostboyHub
   */
  registerBot() {
    this.socket.emit('bot:register', {
      apiKey: global.LOSTBOY_API_KEY,
      botName: 'XLICON WhatsApp Bot',
      type: 'whatsapp',
      platform: 'node',
      version: '1.0.0'
    });

    this.socket.on('bot:registered', (data) => {
      this.botId = data.botId;
      console.log(`✅ Bot registered with LostboyHub: ${this.botId}`);
      this.flushMessageQueue();
    });
  }

  /**
   * Log message to LostboyHub
   */
  logMessage(data) {
    if (!this.connected || !this.socket) {
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push(data);
      }
      return;
    }

    this.socket.emit('bot:log', {
      botId: this.botId,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Log incoming message
   */
  logIncomingMessage(sender, message, type = 'text') {
    this.logMessage({
      event: 'message_received',
      sender,
      message,
      type,
      direction: 'incoming'
    });
  }

  /**
   * Log outgoing message
   */
  logOutgoingMessage(recipient, message, type = 'text') {
    this.logMessage({
      event: 'message_sent',
      recipient,
      message,
      type,
      direction: 'outgoing'
    });
  }

  /**
   * Log command execution
   */
  logCommand(command, sender, args = []) {
    this.logMessage({
      event: 'command_executed',
      command,
      sender,
      args,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log error
   */
  logError(error, context = '') {
    this.logMessage({
      event: 'error',
      error: error.message || String(error),
      stack: error.stack,
      context,
      level: 'error'
    });
  }

  /**
   * Log status change
   */
  logStatus(status, details = {}) {
    this.logMessage({
      event: 'status_changed',
      status,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      this.logMessage(msg);
    }
  }

  /**
   * Handle commands from LostboyHub
   */
  handleBotCommand(data) {
    console.log('📨 Command from LostboyHub:', data);
    // Can be extended to handle remote commands
  }

  /**
   * Disconnect from LostboyHub
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      console.log('🔌 Disconnected from LostboyHub');
    }
  }
}

module.exports = new LostboyHubIntegration();
