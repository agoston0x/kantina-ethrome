import { Client } from '@xmtp/browser-sdk';
import type { Signer } from '@xmtp/browser-sdk';
import { WalletClient } from 'viem';

// Store signing function globally to avoid closure cloning issues
let globalSignFunction: ((message: string) => Promise<Uint8Array>) | null = null;

/**
 * Create XMTP client for a wallet
 * @param walletClient - Viem wallet client
 * @param address - Wallet address
 * @returns XMTP Client instance
 */
export async function createXmtpClient(walletClient: WalletClient, address: string) {
  // Create a signing function and store it globally
  globalSignFunction = async (message: string): Promise<Uint8Array> => {
    const signature = await walletClient.signMessage({ message });
    const hexString = signature.startsWith('0x') ? signature.slice(2) : signature;
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return bytes;
  };

  // Create a lightweight signer that references the global function
  const xmtpSigner: Signer = {
    type: 'SCW',
    getIdentifier: () => ({
      identifier: address,
      identifierKind: 'Ethereum' as const,
    }),
    signMessage: async (message: string): Promise<Uint8Array> => {
      if (!globalSignFunction) {
        throw new Error('Signing function not initialized');
      }
      return globalSignFunction(message);
    },
    getBlockNumber: async (): Promise<bigint> => BigInt(Date.now()),
    getChainId: async (): Promise<bigint> => BigInt(8453),
  };

  // Create XMTP client
  const xmtpClient = await Client.create(xmtpSigner, {
    env: 'dev',
  });

  return xmtpClient;
}

/**
 * Start a conversation with an address
 * @param client - XMTP Client
 * @param peerAddress - Address to start conversation with
 */
export async function startConversation(client: Client, peerAddress: string) {
  const conversation = await client.conversations.newConversation(peerAddress);
  return conversation;
}

/**
 * Send a message to a conversation
 * @param conversation - XMTP Conversation
 * @param message - Message text to send
 */
export async function sendMessage(conversation: any, message: string) {
  await conversation.send(message);
}

/**
 * Listen for new messages in a conversation
 * @param conversation - XMTP Conversation
 * @param callback - Callback function for new messages
 */
export async function listenForMessages(
  conversation: any,
  callback: (message: any) => void
) {
  for await (const message of await conversation.streamMessages()) {
    callback(message);
  }
}
