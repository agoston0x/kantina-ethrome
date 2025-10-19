"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import styles from "./page.module.css";

export default function Home() {
  const { setMiniAppReady, isMiniAppReady, context } = useMiniKit();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    subname: string;
    address: string;
    privateKey: string;
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
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
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

        <button
          className={styles.ctaButton}
          onClick={handleCreateAccount}
          disabled={loading}
        >
          {loading ? "creating..." : "create account"}
        </button>

        {error && <p className={styles.error}>{error}</p>}

        {result && (
          <div className={styles.result}>
            <p className={styles.subname}>{result.subname}</p>
            <p className={styles.address}>{result.address}</p>
            <div className={styles.privateKeyBox}>
              <p className={styles.privateKeyLabel}>Private Key (save this!):</p>
              <p className={styles.privateKey}>{result.privateKey}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
