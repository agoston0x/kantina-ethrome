import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { getPredictedSmartWalletAddress } from '@/durin/contracts/smartwallet';
import { createSubname } from '@/durin/contracts/registry';
import { setSubnameAddress } from '@/durin/contracts/resolver';
import { setOwner } from '@/durin/contracts/registry';

export async function POST(req: NextRequest) {
  try {
    const { username, userWalletAddress } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Invalid username' },
        { status: 400 }
      );
    }

    if (!userWalletAddress || typeof userWalletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
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

    // Step 1: Get predicted smart wallet address
    console.log(`Getting predicted smart wallet address for ${userWalletAddress}`);
    const smartWalletAddress = await getPredictedSmartWalletAddress(
      publicClient,
      userWalletAddress as `0x${string}`
    );
    console.log(`Predicted smart wallet: ${smartWalletAddress}`);

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

    // Step 3: Set address resolution to smart wallet
    console.log(`Setting address for ${username}.kantina.base.eth to ${smartWalletAddress}`);
    const resolverHash = await setSubnameAddress(
      walletClient,
      username,
      smartWalletAddress,
      nonce++
    );
    const resolverReceipt = await publicClient.waitForTransactionReceipt({ hash: resolverHash });
    console.log(`Address set: ${resolverHash} (block: ${resolverReceipt.blockNumber})`);

    // Step 4: Transfer ownership to the smart wallet
    console.log(`Transferring ownership to ${smartWalletAddress}`);
    const transferHash = await setOwner(
      walletClient,
      username,
      smartWalletAddress,
      nonce++
    );
    const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log(`Ownership transferred: ${transferHash} (block: ${transferReceipt.blockNumber})`);

    // Return smart wallet info to user
    return NextResponse.json({
      success: true,
      subname: `${username}.kantina.base.eth`,
      smartWalletAddress,
      ownerAddress: userWalletAddress,
      transactions: {
        subname: subnameHash,
        resolver: resolverHash,
        transfer: transferHash,
      },
      note: 'Smart wallet will be deployed on first transaction. User signs with their Base wallet.',
    });
  } catch (error) {
    console.error('Error registering smart wallet subname:', error);
    return NextResponse.json(
      {
        error: 'Failed to register smart wallet subname',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
