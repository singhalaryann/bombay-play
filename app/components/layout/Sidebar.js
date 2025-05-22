"use client";
import React from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../../styles/Sidebar.module.css";
// REMOVED: Authentication and login modal imports - not needed anymore

const Sidebar = () => {
  // Initialize routing hooks
  const router = useRouter();
  const pathname = usePathname();
  // REMOVED: Authentication hook - not needed

  // REMOVED: All login modal state management

  // Determine active page for menu item highlighting
  const isDashboardActive = pathname === "/dashboard";
  const isAnalyticsActive = pathname === "/analytics";

  // SIMPLIFIED: Handle navigation without any authentication checks
  const handleNavigation = (path) => {
    // Validate path input
    if (typeof path !== "string") {
      console.error("Invalid path:", path);
      return;
    }
    // Direct navigation without any auth checks
    router.push(path);
  };

  // REMOVED: Login success handler - not needed

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
      {/* REMOVED: All login modal code - completely cleaned up */}
    </aside>
  );
};

export default Sidebar;