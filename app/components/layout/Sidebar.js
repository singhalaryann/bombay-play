"use client";
import React, { useState } from "react"; 
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../../styles/Sidebar.module.css";
// Import authentication and login modal components
import { useAuth } from "../../context/AuthContext";
import LoginModal from "../../components/LoginModal";

const Sidebar = () => {
  // Initialize routing and authentication hooks
  const router = useRouter();
  const pathname = usePathname();
  const { userId } = useAuth();

  // State management for login modal and redirection
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

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

    // Check user authentication status
    if (!userId) {
      // If not logged in, show login modal and store intended path
      setRedirectPath(path);
      setShowLoginModal(true);
    } else {
      // If logged in, proceed with navigation
      router.push(path);
    }
  };

  // Modified login success handler to prevent immediate redirection
  const handleLoginSuccess = () => {
    // Reset redirect path to keep user on current page
    setRedirectPath(null);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.glassEffect}>
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
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          redirectPath={redirectPath}
        />
      )}
    </aside>
  );
};

export default Sidebar;