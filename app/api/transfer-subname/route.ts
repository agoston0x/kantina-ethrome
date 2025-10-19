import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { setOwner } from '@/durin/contracts/registry';

export async function POST(request: Request) {
  try {
    const { username, newOwner } = await request.json();

    if (!username || !newOwner) {
      return NextResponse.json(
        { error: 'Missing username or newOwner' },
        { status: 400 }
      );
    }

    // Get kantina owner's private key
    const privateKey = process.env.KANTINA_OWNER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('KANTINA_OWNER_PRIVATE_KEY not set');
    }

    const ownerAccount = privateKeyToAccount(privateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account: ownerAccount,
      chain: base,
      transport: http(),
    });

    console.log(`Transferring ${username}.kantina.base.eth to ${newOwner}...`);

    const txHash = await setOwner(walletClient, username, newOwner as `0x${string}`);

    console.log(`Transfer successful! Tx hash: ${txHash}`);

    return NextResponse.json({
      success: true,
      txHash,
      subname: `${username}.kantina.base.eth`,
      newOwner,
    });
  } catch (error) {
    console.error('Error transferring subname:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transfer subname' },
      { status: 500 }
    );
  }
}
