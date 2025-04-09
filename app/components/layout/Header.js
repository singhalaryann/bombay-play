"use client";
import React from "react";
import styles from "../../../styles/Header.module.css";
import Image from "next/image";
import { LogOut, User} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const Header = () => {
  const { userId } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/");
  };

  const handleAIChat = () => {
    router.push("/ideationchat");
  };
  // const handleKnowledgebase = () => {
  //   // Add this new handler
  //   router.push("/knowledgebase");
  // };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <Image
            src="/logo-XG.svg"
            alt="XG Gaming"
            width={120}
            height={36}
            className={styles.logoImage}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* + AI Chat button */}
        <button onClick={handleAIChat} className={styles.aiChatButton}>
  <Image 
    src="/ai_chat.svg"
    alt="AI Chat"
    width={20}
    height={20}
    className={styles.aiIcon}
  />
  <span>AI Chat</span>
</button>
        {/* <button
  onClick={handleKnowledgebase}
  className={styles.knowledgebaseButton}
>
  <Image 
    src="/kb_icon.svg"
    alt="Knowledgebase"
    width={20}
    height={20}
    className={styles.kbIcon}
  />
  <span>Knowledgebase</span>
</button>{" "} */}
        {/* User block with logout button */}
        <div className={styles.userBlock}>
  {/* Using Image component for user_icon.svg */}
  <Image 
    src="/user_icon.svg"
    alt="User"
    width={24}
    height={24}
    className={styles.userIcon}
  />
  <span className={styles.userId}>{userId || "Guest"}</span>
  <button onClick={handleLogout} className={styles.logoutButton}>
    <LogOut size={20} />
  </button>
</div>
      </div>
    </header>
  );
};

export default Header;
