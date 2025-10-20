"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import styles from "./page.module.css";

export default function LandingPage() {
  const { isMiniAppReady, setMiniAppReady } = useMiniKit();
  const [isInBaseApp, setIsInBaseApp] = useState(false);
  const [showHello, setShowHello] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [isMiniAppReady, setMiniAppReady]);

  useEffect(() => {
    // Detect if running in Base app (MiniKit context)
    setIsInBaseApp(!!window.navigator.userAgent.includes('Farcaster') || isMiniAppReady);
  }, [isMiniAppReady]);

  useEffect(() => {
    // Initial sequence: show "hello" for 2 seconds, then switch to message
    const initialTimeout = setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => {
        setShowHello(false);
        setFadeIn(true);
      }, 500); // Wait for fade out to complete
    }, 2000);

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    // After initial "hello", alternate messages every 3 seconds
    if (!showHello) {
      const interval = setInterval(() => {
        setFadeIn(false);
        setTimeout(() => {
          setFadeIn(true);
        }, 500); // Wait for fade out to complete
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [showHello]);

  const getMessage = () => {
    if (isInBaseApp) {
      return "coming soon...";
    }
    return "open in base app";
  };

  return (
    <div className={styles.container}>
      <div className={styles.landingContent}>
        <div className={styles.logo}>
          <Image
            src="/kantina-logo.png"
            alt="Kantina"
            width={200}
            height={200}
            priority
          />
        </div>

        <div className={`${styles.helloButton} ${fadeIn ? styles.fadeIn : styles.fadeOut}`}>
          {showHello ? "hello" : getMessage()}
        </div>
      </div>
    </div>
  );
}
