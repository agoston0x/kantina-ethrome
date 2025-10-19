"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  const { setMiniAppReady, isMiniAppReady, context } = useMiniKit();
  const { address: connectedAddress } = useAccount();

  const [loading, setLoading] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  // Check if user has an account by querying the API
  useEffect(() => {
    const checkAccount = async () => {
      if (!context?.user?.username) {
        setCheckingAccount(false);
        return;
      }

      try {
        const response = await fetch('/api/check-subname', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: context.user.username }),
        });

        const data = await response.json();
        setHasAccount(data.exists);
      } catch (err) {
        console.error('Error checking account:', err);
        setHasAccount(false);
      } finally {
        setCheckingAccount(false);
      }
    };

    checkAccount();
  }, [context?.user?.username]);

  const handleCreateAccount = async () => {
    if (!context?.user?.username) {
      setError("Username not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register-smart-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: context.user.username,
          userWalletAddress: connectedAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setHasAccount(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking
  if (checkingAccount) {
    return (
      <div className={styles.container}>
        <div className={styles.landingContent}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Landing page for new users
  if (!hasAccount) {
    return (
      <div className={styles.container}>
        <div className={styles.landingContent}>
          <Image
            src="/kantina-logo.png"
            alt="Kantina"
            width={200}
            height={200}
            className={styles.logo}
            priority
          />

          <button
            className={styles.helloButton}
            onClick={handleCreateAccount}
            disabled={loading}
          >
            {loading ? "creating..." : `hello @${context?.user?.username || "USERNAME"}`}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  // Home page for returning users
  return (
    <div className={styles.container}>
      <div className={styles.homeHeader}>
        <Image
          src="/kantina-logo.png"
          alt="Kantina"
          width={60}
          height={60}
          className={styles.logoSmall}
        />
        <button
          className={styles.getRewzButton}
          onClick={() => setShowHostModal(true)}
        >
          host
        </button>
      </div>

      <div className={styles.homeContent}>
        <button
          className={styles.actionButton}
          onClick={() => setShowViewModal(true)}
        >
          ETH Rome
        </button>

        <button
          className={styles.actionButton}
          onClick={() => setShowHostModal(true)}
        >
          ...
        </button>
      </div>

      {/* Host Kantina Modal */}
      {showHostModal && (
        <div className={styles.modal} onClick={() => setShowHostModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCenter}>
              <Image
                src="/kantina-logo.png"
                alt="Kantina"
                width={60}
                height={60}
              />
            </div>
            <div className={styles.comingSoonBox}>
              <p>Coming soon</p>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.emailInput}
              />
              <button className={styles.sendButton}>Send</button>
            </div>
            <button
              className={styles.backButton}
              onClick={() => setShowHostModal(false)}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* View Kantina Modal - ETH Rome */}
      {showViewModal && (
        <div className={styles.modal} onClick={() => setShowViewModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCenter}>
              <Image
                src="/kantina-logo.png"
                alt="Kantina"
                width={60}
                height={60}
              />
            </div>
            <div className={styles.featuresBox}>
              <h3 className={styles.featuresTitle}>ETH Rome</h3>
              <a href="/chat" className={styles.feature}>Chat</a>
              <div className={styles.feature}>Polls</div>
              <div className={styles.feature}>Prediction Markets</div>
              <div className={styles.feature}>Photos</div>
            </div>
            <button
              className={styles.backButton}
              onClick={() => setShowViewModal(false)}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
