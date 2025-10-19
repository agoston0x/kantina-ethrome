import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Agent } from '@xmtp/agent-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let agent = null;
const conversations = new Map(); // Store conversations by address

// Initialize XMTP agent
async function initXmtp() {
  try {
    console.log('Initializing XMTP agent...');

    agent = await Agent.createFromEnv({
      env: process.env.XMTP_ENV || 'production',
    });

    console.log(`XMTP agent initialized for: ${agent.address}`);

    // Listen for incoming messages
    agent.on('text', async (ctx) => {
      console.log(`Message from ${ctx.message.senderAddress}: ${ctx.message.content}`);
    });

    agent.on('start', () => {
      console.log(`Waiting for messages...`);
      console.log(`Address: ${agent.address}`);
    });

    return agent;
  } catch (error) {
    console.error('Error initializing XMTP:', error);
    throw error;
  }
}

// Get or create DM conversation
async function getConversation(peerAddress) {
  if (conversations.has(peerAddress)) {
    return conversations.get(peerAddress);
  }

  const dm = await agent.createDmWithAddress(peerAddress);
  conversations.set(peerAddress, dm);
  return dm;
}

// API Routes

// Send message
app.post('/api/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing to or message' });
    }

    if (!agent) {
      return res.status(500).json({ error: 'XMTP not initialized' });
    }

    console.log(`Sending message to ${to}: ${message}`);

    console.log('Getting conversation...');
    const conversation = await getConversation(to);
    console.log('Conversation created, sending message...');

    const messageId = await conversation.send(message);
    console.log(`Message sent successfully! ID: ${messageId}`);

    res.json({ success: true, to, message, messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages from a conversation
app.get('/api/messages/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!agent) {
      return res.status(500).json({ error: 'XMTP not initialized' });
    }

    console.log(`Fetching messages for ${address}...`);
    const conversation = await getConversation(address);
    const messages = await conversation.messages();
    console.log(`Found ${messages.length} messages`);

    // Filter to only text messages (exclude group updates and other system messages)
    const formattedMessages = messages
      .filter(msg => typeof msg.content === 'string')
      .map(msg => ({
        id: msg.id,
        senderAddress: msg.senderAddress,
        content: msg.content,
        sent: msg.sent,
      }));

    console.log('Formatted messages:', JSON.stringify(formattedMessages, null, 2));

    res.json({
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    xmtpInitialized: !!agent,
    address: agent?.address || null,
  });
});

const PORT = process.env.PORT || 3001;

// Start server
async function start() {
  try {
    await initXmtp();
    await agent.start();

    app.listen(PORT, () => {
      console.log(`XMTP backend running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
