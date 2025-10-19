import { WalletClient, PublicClient } from 'viem';
import { generateKantinaWallet } from './utils/wallet';
import { createSubname } from './contracts/registry';
import { setSubnameAddress } from './contracts/resolver';

/**
 * Complete flow to create a kantina subname for a user
 * @param walletClient - Wallet client with kantina.base.eth owner key
 * @param publicClient - Public client for waiting for transactions
 * @param username - User's basename (e.g., "agoston")
 * @returns Object containing new wallet and transaction hashes
 */
export async function createKantinaAccount(
  walletClient: WalletClient,
  publicClient: PublicClient,
  username: string
) {
  // Step 1: Generate new wallet for the subname
  const newWallet = generateKantinaWallet();
  console.log(`Generated new wallet: ${newWallet.address}`);

  // Step 2: Create subname via setSubnodeRecord
  console.log(`Creating subname: ${username}.kantina.base.eth`);
  const subnameHash = await createSubname(walletClient, username, newWallet.address);
  await publicClient.waitForTransactionReceipt({ hash: subnameHash });
  console.log(`Subname created: ${subnameHash}`);

  // Step 3: Set address resolution via setAddr
  console.log(`Setting address for ${username}.kantina.base.eth`);
  const resolverHash = await setSubnameAddress(walletClient, username, newWallet.address);
  await publicClient.waitForTransactionReceipt({ hash: resolverHash });
  console.log(`Address set: ${resolverHash}`);

  return {
    wallet: newWallet,
    transactions: {
      subname: subnameHash,
      resolver: resolverHash,
    },
    subname: `${username}.kantina.base.eth`,
  };
}
