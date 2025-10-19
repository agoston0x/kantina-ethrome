"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import styles from "./page.module.css";

export default function Home() {
  const { setMiniAppReady, isMiniAppReady, context } = useMiniKit();
  const { address: connectedAddress } = useAccount();

  const [loading, setLoading] = useState(false);
  const [loadingSmart, setLoadingSmart] = useState(false);
  const [result, setResult] = useState<{
    subname: string;
    address: string;
    privateKey?: string;
    ownerAddress?: string;
    isSmartWallet?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  const handleCreateAccount = async () => {
    if (!context?.user?.username) {
      setError("Username not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register-subname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: context.user.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setResult({
        subname: data.subname,
        address: data.address,
        privateKey: data.privateKey,
        isSmartWallet: false,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSmartWallet = async () => {
    if (!context?.user?.username) {
      setError("Username not found");
      return;
    }

    // Get user's connected wallet address from wagmi
    if (!connectedAddress) {
      setError("Wallet not connected");
      return;
    }

    setLoadingSmart(true);
    setError(null);

    try {
      const response = await fetch('/api/register-smart-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testname', // Using testname for testing
          userWalletAddress: connectedAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create smart wallet');
      }

      setResult({
        subname: data.subname,
        address: data.smartWalletAddress,
        ownerAddress: data.ownerAddress,
        isSmartWallet: true,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create smart wallet");
    } finally {
      setLoadingSmart(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to kantina</h1>

        {context?.user && (
          <div className={styles.debug}>
            <p>Debug: {JSON.stringify(context.user)}</p>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button
            className={styles.ctaButton}
            onClick={handleCreateAccount}
            disabled={loading || loadingSmart}
          >
            {loading ? "creating..." : "create account (EOA)"}
          </button>

          <button
            className={styles.ctaButtonSmart}
            onClick={handleCreateSmartWallet}
            disabled={loading || loadingSmart}
          >
            {loadingSmart ? "creating..." : "create smart wallet (test)"}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {result && (
          <div className={styles.result}>
            <p className={styles.subname}>{result.subname}</p>
            <p className={styles.address}>{result.address}</p>

            {result.isSmartWallet ? (
              <div className={styles.smartWalletInfo}>
                <p className={styles.smartWalletLabel}>✨ Smart Wallet</p>
                <p className={styles.ownerAddress}>Controlled by: {result.ownerAddress}</p>
                <p className={styles.note}>No private key - sign with your Base wallet!</p>
              </div>
            ) : (
              <div className={styles.privateKeyBox}>
                <p className={styles.privateKeyLabel}>Private Key (save this!):</p>
                <p className={styles.privateKey}>{result.privateKey}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
