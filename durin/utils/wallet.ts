import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

/**
 * Generate a new wallet for the user's kantina subname
 */
export function generateKantinaWallet() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  return {
    address: account.address,
    privateKey,
  };
}
