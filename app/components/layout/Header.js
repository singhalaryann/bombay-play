"use client";
import React from "react";
import styles from "../../../styles/Header.module.css";
import Image from "next/image";
import { LogOut, User, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";


const Header = () => {
  const { userId, logout } = useAuth();
  const router = useRouter();

  // COMMENTED: Logout functionality
  // const handleLogout = () => {
  // logout();
  // router.push("/ideationchat");
  // };

  // ADDED: AI Chat functionality - uncommented and working
  const handleAIChat = () => {
    router.push("/ideationchat");
  };

  // const handleKnowledgebase = () => {
  // // Add this new handler
  // router.push("/knowledgebase");
  // };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
      <div className={styles.logo} onClick={() => router.push("/dashboard")} style={{ cursor: "pointer" }}>
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
        {/* ADDED: AI Chat button - now active and visible */}
        <button
          onClick={handleAIChat}
          className={styles.aiChatButton}
        >
          <MessageCircle size={20} className={styles.chatIcon} />
          <span>AI Chat</span>
        </button>

        {/* REMOVED: Knowledgebase button - kept commented */}
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
        </button> */}

        {/* User block with hardcoded ID */}
        <div className={styles.userBlock}>
          <Image
            src="/user_icon.svg"
            alt="User"
            width={24}
            height={24}
            className={styles.userIcon}
          />
          <span className={styles.userId}>a724a284-dd80-4ff2-8d0a-b36bff0fa426</span>
          {/* COMMENTED: Logout button */}
          {/* {userId && (
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={20} />
            </button>
          )} */}
        </div>
      </div>
    </header>
  );
};

export default Header;