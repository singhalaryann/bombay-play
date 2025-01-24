// IdeationChat.js
"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/IdeationChat.module.css";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { Send, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from 'next/image';

const InsightBlock = ({ text, onClick }) => (
  <div className={styles.insightBlock} onClick={() => onClick(text)}>
    <div className={styles.insightContent}>
      <Image src="/star.png" width={20} height={20} alt="star" className={styles.insightIcon} />
      <span>{text}</span>
    </div>
  </div>
);

export default function IdeationChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const router = useRouter();

  const insights = [
    "MAU declined by 4%, possibly due to a lack of sustained engagement or post-event drop-off.",
    "Average session duration fell by 3%, indicating users may be disengaging sooner.",
    "Retention dropped by 2%, suggesting new users are not finding enough value to stay.",
    "Social mentions decreased by 8%, likely due to reduced buzz after the recent event ended."
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInsightClick = (text) => {
    setInput(text);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setMessages((prev) => [...prev, { content: input, sender: "human" }]);
    setIsLoading(true);

    try {
      console.log("Sending to generate-direct API:", input);
      const response = await fetch("https://generate-direct-flnr5jia5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("API response data:", data);
        if (data.chat_id) {
          console.log("Redirecting to /analysis?chat=", data.chat_id);
          router.push(`/analysis?chat=${data.chat_id}`);
        }
      } else {
        console.error("Network response not OK:", response.status);
      }
    } catch (err) {
      console.error("Error in handleSend:", err);
    } finally {
      setInput("");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <h1 className={styles.title}>AI Chat</h1>
          <div className={styles.chatContainer}>
            <div className={styles.glassWrapper}>
              <div className={styles.messagesArea}>
                {messages.length === 0 && (
                  <div className={styles.insightGrid}>
                    {insights.map((insight, idx) => (
                      <InsightBlock
                        key={idx}
                        text={insight}
                        onClick={handleInsightClick}
                      />
                    ))}
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${styles.message} ${
                      msg.sender === "human" ? styles.userMessage : styles.aiMessage
                    }`}
                  >
                    <div className={styles.messageContent}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className={styles.loadingMessage}>
                    <Loader className={styles.loadingIcon} size={20} />
                    <span>AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.inputWrapper}>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What's on your mind? Share your thoughts..."
                    className={styles.input}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    className={styles.sendButton}
                    disabled={!input.trim() || isLoading}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}