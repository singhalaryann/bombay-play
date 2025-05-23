"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../../styles/Sidebar.module.css";
import { useAuth } from "../../context/AuthContext";
import { X, MoreVertical, Pencil, Trash2 } from "lucide-react";

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

  const [menuOpen, setMenuOpen] = useState(null); // Which thread's menu is open
  const [renamingId, setRenamingId] = useState(null); // Which thread is being renamed
  const [renameValue, setRenameValue] = useState(""); // Rename input value

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
            <div className={styles.threadList}>
              {chatThreads.length === 0 && (
                <div className={styles.emptyThreads}>No chats yet</div>
              )}
              {[...chatThreads].reverse().map(tid => (
                <div
                  key={tid}
                  className={`${styles.threadItem} ${selectedThreadId === tid ? styles.selectedThread : ""}`}
                  onClick={() => handleSelectThread(tid)}
                  onMouseLeave={() => setMenuOpen(null)}
                >
                  {renamingId === tid ? (
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      autoFocus
                      onChange={e => setRenameValue(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onBlur={() => {
                        // Save rename
                        if (renameValue.trim() && typeof window !== 'undefined') {
                          const stored = JSON.parse(localStorage.getItem('chatThreads') || '[]');
                          const updated = stored.map(id => id === tid ? renameValue.trim() : id);
                          localStorage.setItem('chatThreads', JSON.stringify(updated));
                          localStorage.setItem(`chatHistory_${renameValue.trim()}`, localStorage.getItem(`chatHistory_${tid}`));
                          localStorage.removeItem(`chatHistory_${tid}`);
                          if (localStorage.getItem('threadId') === tid) {
                            localStorage.setItem('threadId', renameValue.trim());
                          }
                          setRenamingId(null);
                          setMenuOpen(null);
                          window.location.reload();
                        } else {
                          setRenamingId(null);
                          setMenuOpen(null);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') e.target.blur();
                        if (e.key === 'Escape') { setRenamingId(null); setMenuOpen(null); }
                      }}
                    />
                  ) : (
                    <span className={styles.threadText}>{tid}</span>
                  )}
                  {/* 3-dot menu, only visible on hover */}
                  <div
                    className={styles.moreMenuWrapper}
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === tid ? null : tid); }}
                  >
                    <MoreVertical className={styles.moreMenuIcon} />
                    {menuOpen === tid && (
                      <div className={styles.threadMenu} onClick={e => e.stopPropagation()}>
                        <button
                          className={styles.menuItemBtn}
                          onClick={() => {
                            setRenamingId(tid);
                            setRenameValue(tid);
                            setMenuOpen(null);
                          }}
                        >
                          <Pencil size={15} className={styles.menuIcon} /> Rename
                        </button>
                        <button
                          className={styles.menuItemBtn + ' ' + styles.deleteMenuBtn}
                          onClick={() => {
                            if (window.confirm("Delete this conversation?")) {
                              if (typeof window !== 'undefined') {
                                const stored = JSON.parse(localStorage.getItem('chatThreads') || '[]');
                                const updated = stored.filter(id => id !== tid);
                                localStorage.setItem('chatThreads', JSON.stringify(updated));
                                if (localStorage.getItem('threadId') === tid) {
                                  localStorage.removeItem('threadId');
                                }
                                localStorage.removeItem(`chatHistory_${tid}`);
                                setMenuOpen(null);
                                window.location.reload();
                              }
                            }
                          }}
                        >
                          <Trash2 size={15} className={styles.menuIcon + ' ' + styles.binIcon} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
