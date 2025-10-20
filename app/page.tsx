"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import styles from "./page.module.css";

export default function LandingPage() {
  const { isMiniAppReady, setMiniAppReady } = useMiniKit();
  const [isInBaseApp, setIsInBaseApp] = useState(false);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [isMiniAppReady, setMiniAppReady]);

  useEffect(() => {
    // Detect if running in Base app (MiniKit context)
    setIsInBaseApp(!!window.navigator.userAgent.includes('Farcaster') || isMiniAppReady);
  }, [isMiniAppReady]);

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image
          src="/kantina-logo.png"
          alt="Kantina"
          width={200}
          height={200}
          priority
        />
      </div>

      <div className={styles.messageBox}>
        {isInBaseApp ? (
          <h1 className={styles.message}>Coming Soon...</h1>
        ) : (
          <h1 className={styles.message}>Open in Base App</h1>
        )}
      </div>
    </div>
  );
}
