"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/IdeationChat.module.css";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { Send, Loader } from "lucide-react";

// 1) IMPORT ReactMarkdown for markdown rendering
import ReactMarkdown from "react-markdown";

export default function IdeationChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const router = useRouter();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send typed message to the API
  const handleSend = async () => {
    // If blank or AI is busy, do nothing
    if (!input.trim() || isLoading) return;

    // Add user's message to local chat
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
        // If we get chat_id, go to analysis
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
      // Clear input, end 'thinking' state
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

                {/* AI thinking indicator */}
                {isLoading && (
                  <div className={styles.loadingMessage}>
                    <Loader className={styles.loadingIcon} size={20} />
                    <span>AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Captain prompt if no messages */}
              {/* {messages.length === 0 && (
                <h2 className={styles.captainPrompt}>What idea is on your mind, captain?</h2>
              )} */}

              {/* Input area, disabled while AI is thinking */}
              <div className={styles.inputWrapper}>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What's on your mind? Share your thoughts..."
                    className={styles.input}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}  // prevent typing if AI is thinking
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
