import { NextResponse } from 'next/server';
import { createPublicClient, http, namehash, Address } from 'viem';
import { base } from 'viem/chains';

const REGISTRY_ADDRESS = '0xb94704422c2a1e396835a571837aa5ae53285a95' as Address;

const REGISTRY_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Missing username' },
        { status: 400 }
      );
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const subname = `${username}.kantina.base.eth`;
    const node = namehash(subname);

    // Check the registry contract for the owner
    const owner = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'owner',
      args: [node],
    });

    // If owner is not the zero address, the subname exists
    const exists = owner !== '0x0000000000000000000000000000000000000000';

    return NextResponse.json({
      exists,
      subname,
      owner: exists ? owner : undefined,
    });
  } catch (error) {
    console.error('Error checking subname:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check subname' },
      { status: 500 }
    );
  }
}
