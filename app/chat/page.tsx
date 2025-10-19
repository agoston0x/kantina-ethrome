"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import styles from "./chat.module.css";
import Image from "next/image";

const BACKEND_URL = "/api/xmtp";

export default function Chat() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit();
  const { address: connectedAddress } = useAccount();

  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [backendAddress, setBackendAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Poll for new messages every 3 seconds when backend is ready
  useEffect(() => {
    if (!backendReady || !connectedAddress) return;

    const interval = setInterval(async () => {
      await loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [backendReady, connectedAddress]);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();

      if (data.xmtpInitialized) {
        setBackendReady(true);
        setBackendAddress(data.address);
        await loadMessages(); // Load initial messages
      }
    } catch (err) {
      console.error("Backend not ready:", err);
      setError("XMTP backend not available");
    }
  };

  const loadMessages = async () => {
    if (!connectedAddress) return;

    try {
      const response = await fetch(`${BACKEND_URL}/messages/${connectedAddress}`);
      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !connectedAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: connectedAddress,
          message: messageInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setMessageInput("");
      // Reload messages immediately to show the sent message
      await loadMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Image
          src="/kantina-logo.png"
          alt="Kantina"
          width={60}
          height={60}
        />
      </div>

      {!backendReady ? (
        <div className={styles.connectingBox}>
          <p>Connecting to XMTP...</p>
          <button
            className={styles.retryButton}
            onClick={checkBackendHealth}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className={styles.chatBox}>
          <div className={styles.chatHeader}>
            <span>ETH Rome Chat</span>
          </div>

          <div className={styles.messages}>
            {messages.length === 0 ? (
              <p className={styles.emptyState}>No messages yet...</p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={msg.senderAddress?.toLowerCase() === backendAddress?.toLowerCase()
                    ? styles.messageReceived
                    : styles.messageSent}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className={styles.inputArea}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className={styles.input}
            />
            <button
              onClick={handleSendMessage}
              className={styles.sendButton}
              disabled={!messageInput.trim() || loading}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>

          <a href="/" className={styles.backButton}>
            ← Back
          </a>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
