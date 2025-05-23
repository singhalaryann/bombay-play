"use client";
import React from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../../styles/Sidebar.module.css";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({
  chatThreads = [],
  selectedThreadId = null,
  handleSelectThread = () => {},
  handleNewChat = () => {},
}) => {
  // Initialize routing and authentication hooks
  const router = useRouter();
  const pathname = usePathname();
  const { userId } = useAuth();

  // Determine active page for menu item highlighting
  const isDashboardActive = pathname === "/dashboard";
  const isAnalyticsActive = pathname === "/analytics";

  // Handle navigation with authentication check
  const handleNavigation = (path) => {
    // Validate path input
    if (typeof path !== "string") {
      console.error("Invalid path:", path);
      return;
    }
    
    // Direct navigation without auth check
    router.push(path);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.glassEffect}>
        {/* Show only chat section on ideationchat page, otherwise show menu items */}
        {pathname === "/ideationchat" ? (
          // Only show chat section
          <div className={styles.chatSection}>
            <div className={styles.chatLabel}>Chats</div>
            <button className={styles.chatButton} onClick={handleNewChat}>
              + New Chat
            </button>
            <select
              className={styles.chatSelect}
              value={selectedThreadId || ''}
              onChange={e => handleSelectThread(e.target.value)}
            >
              <option value='' disabled>Select a chat</option>
              {[...chatThreads].reverse().map(tid => (
                <option key={tid} value={tid}>
                  {tid}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            {/* Liveops/Dashboard Menu Item */}
            <div className={styles.menuItem}>
              <div
                className={`${styles.menuLink} ${isDashboardActive ? styles.active : ""}`}
                onClick={() => handleNavigation("/dashboard")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleNavigation("/dashboard")}
              >
                <div className={styles.menuIcon}>
                  <Image
                    src="/dashboard_icon.svg"
                    alt="Dashboard"
                    width={30}
                    height={30}
                    className={`${styles.icon} ${isDashboardActive ? styles.activeIcon : ""}`}
                    priority
                  />
                </div>
                <span className={styles.menuText}>Liveops</span>
              </div>
            </div>
            
            {/* User Analytics Menu Item */}
            <div className={styles.menuItem}>
              <div
                className={`${styles.menuLink} ${isAnalyticsActive ? styles.active : ""}`}
                onClick={() => handleNavigation("/analytics")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleNavigation("/analytics")}
              >
                <div className={styles.menuIcon}>
                  <Image
                    src="/user-analytics.svg"
                    alt="User Analytics"
                    width={30}
                    height={30}
                    className={`${styles.icon} ${isAnalyticsActive ? styles.activeIcon : ""}`}
                    priority
                  />
                </div>
                <span className={styles.menuText}>User Analytics</span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
