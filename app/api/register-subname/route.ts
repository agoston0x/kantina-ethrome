import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { generateKantinaWallet } from '@/durin/utils/wallet';
import { createSubname } from '@/durin/contracts/registry';
import { setSubnameAddress } from '@/durin/contracts/resolver';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Invalid username' },
        { status: 400 }
      );
    }

    // Get kantina.base.eth owner's private key from env
    const ownerPrivateKey = process.env.KANTINA_OWNER_PRIVATE_KEY;
    if (!ownerPrivateKey) {
      console.error('KANTINA_OWNER_PRIVATE_KEY not found in environment');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create wallet client with kantina.base.eth owner's key
    const ownerAccount = privateKeyToAccount(ownerPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account: ownerAccount,
      chain: base,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Step 1: Generate new wallet for user
    const newWallet = generateKantinaWallet();
    console.log(`Generated new wallet for ${username}: ${newWallet.address}`);

    // Get starting nonce
    let nonce = await publicClient.getTransactionCount({
      address: ownerAccount.address,
    });

    // Step 2: Create subname with kantina owner as temporary owner
    console.log(`Creating subname: ${username}.kantina.base.eth`);
    const subnameHash = await createSubname(
      walletClient,
      username,
      ownerAccount.address, // Temporarily set kantina owner as owner
      nonce++
    );
    const subnameReceipt = await publicClient.waitForTransactionReceipt({ hash: subnameHash });
    console.log(`Subname created: ${subnameHash} (block: ${subnameReceipt.blockNumber})`);

    // Step 3: Set address resolution via setAddr (while we're still owner)
    console.log(`Setting address for ${username}.kantina.base.eth`);
    const resolverHash = await setSubnameAddress(
      walletClient,
      username,
      newWallet.address,
      nonce++
    );
    const resolverReceipt = await publicClient.waitForTransactionReceipt({ hash: resolverHash });
    console.log(`Address set: ${resolverHash} (block: ${resolverReceipt.blockNumber})`);

    // Step 4: Transfer ownership to the new wallet
    console.log(`Transferring ownership to ${newWallet.address}`);
    const { setOwner } = await import('@/durin/contracts/registry');
    const transferHash = await setOwner(
      walletClient,
      username,
      newWallet.address,
      nonce++
    );
    const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log(`Ownership transferred: ${transferHash} (block: ${transferReceipt.blockNumber})`);

    // Return new wallet info to user
    return NextResponse.json({
      success: true,
      subname: `${username}.kantina.base.eth`,
      address: newWallet.address,
      privateKey: newWallet.privateKey, // User needs this to access their wallet
      transactions: {
        subname: subnameHash,
        resolver: resolverHash,
        transfer: transferHash,
      },
    });
  } catch (error) {
    console.error('Error registering subname:', error);
    return NextResponse.json(
      {
        error: 'Failed to register subname',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
