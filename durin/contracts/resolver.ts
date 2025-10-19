import { Address, namehash } from 'viem';
import { base } from 'viem/chains';
import { WalletClient } from 'viem';

const RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as Address;

const RESOLVER_ABI = [
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'a', type: 'address' },
    ],
    name: 'setAddr',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * Set the address resolution for a subname
 * @param walletClient - Wallet client with kantina.base.eth owner key
 * @param username - User's basename (e.g., "agoston")
 * @param address - Address to resolve to
 */
export async function setSubnameAddress(
  walletClient: WalletClient,
  username: string,
  address: Address,
  nonce?: number
) {
  const fullName = `${username}.kantina.base.eth`;
  const node = namehash(fullName);

  const hash = await walletClient.writeContract({
    address: RESOLVER_ADDRESS,
    abi: RESOLVER_ABI,
    functionName: 'setAddr',
    args: [node, address],
    chain: base,
    nonce,
  });

  return hash;
}
