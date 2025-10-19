import { Address, encodeAbiParameters } from 'viem';
import { base } from 'viem/chains';
import { PublicClient } from 'viem';

const FACTORY_ADDRESS = '0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a' as Address;

const FACTORY_ABI = [
  {
    inputs: [
      { name: 'owners', type: 'bytes[]' },
      { name: 'nonce', type: 'uint256' },
    ],
    name: 'getAddress',
    outputs: [{ name: 'predicted', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Get the predicted address for a Coinbase Smart Wallet
 * @param publicClient - Public client
 * @param ownerAddress - Address of the owner (user's Base wallet)
 * @param nonce - Nonce for deterministic address (default 0)
 * @returns Predicted smart wallet address
 */
export async function getPredictedSmartWalletAddress(
  publicClient: PublicClient,
  ownerAddress: Address,
  nonce: bigint = BigInt(0)
): Promise<Address> {
  // Encode owner address as bytes (ABI-encoded address)
  const encodedOwner = encodeAbiParameters(
    [{ type: 'address' }],
    [ownerAddress]
  );

  const owners = [encodedOwner];

  const predictedAddress = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getAddress',
    args: [owners, nonce],
  });

  return predictedAddress as Address;
}
