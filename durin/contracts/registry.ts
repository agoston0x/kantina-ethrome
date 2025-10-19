import { Address, namehash, labelhash } from 'viem';
import { base } from 'viem/chains';
import { WalletClient } from 'viem';

const REGISTRY_ADDRESS = '0xb94704422c2a1e396835a571837aa5ae53285a95' as Address;
const RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as Address;

const REGISTRY_ABI = [
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'label', type: 'bytes32' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
    ],
    name: 'setSubnodeRecord',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'owner', type: 'address' },
    ],
    name: 'setOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * Create a subname by calling setSubnodeRecord on the Registry
 * @param walletClient - Wallet client with kantina.base.eth owner key
 * @param username - User's basename (e.g., "agoston")
 * @param newOwner - Address that will own the subname
 */
export async function createSubname(
  walletClient: WalletClient,
  username: string,
  newOwner: Address,
  nonce?: number
) {
  const parentName = 'kantina.base.eth';
  const parentNode = namehash(parentName);
  const subnameLabel = labelhash(username);

  const hash = await walletClient.writeContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'setSubnodeRecord',
    args: [parentNode, subnameLabel, newOwner, RESOLVER_ADDRESS, BigInt(0)],
    chain: base,
    nonce,
  });

  return hash;
}

/**
 * Transfer ownership of a subname
 * @param walletClient - Current owner's wallet client
 * @param username - User's basename (e.g., "agoston")
 * @param newOwner - New owner address
 */
export async function setOwner(
  walletClient: WalletClient,
  username: string,
  newOwner: Address,
  nonce?: number
) {
  const fullName = `${username}.kantina.base.eth`;
  const node = namehash(fullName);

  const hash = await walletClient.writeContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'setOwner',
    args: [node, newOwner],
    chain: base,
    nonce,
  });

  return hash;
}
