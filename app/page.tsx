"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import styles from "./page.module.css";

export default function LandingPage() {
  const { isMiniAppReady, setMiniAppReady } = useMiniKit();
  const [isInBaseApp, setIsInBaseApp] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [initialFadeComplete, setInitialFadeComplete] = useState(false);
  const [showHello, setShowHello] = useState(true);
  const [pulse, setPulse] = useState(false);

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
    // Initial delay: wait 1 second before showing the box
    const initialTimeout = setTimeout(() => {
      setShowBox(true);
      // Mark initial fade as complete after fade animation finishes
      setTimeout(() => setInitialFadeComplete(true), 600);
    }, 1000);

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    // After box appears, alternate text every 2 seconds with pulse
    if (showBox) {
      const interval = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 1200); // Pulse duration
        setShowHello(prev => !prev);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [showBox]);

  const getMessage = () => {
    if (isInBaseApp) {
      return "coming soon...";
    }
    return "open in base app";
  };

  const getBoxClasses = () => {
    const classes = [styles.helloButton];
    if (!initialFadeComplete) {
      classes.push(styles.fadeIn);
    } else {
      classes.push(styles.visible);
    }
    if (pulse) {
      classes.push(styles.pulse);
    }
    return classes.join(' ');
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

        {showBox && (
          <div className={getBoxClasses()}>
            {showHello ? "hello" : getMessage()}
          </div>
        )}
      </div>
    </div>
  );
}
