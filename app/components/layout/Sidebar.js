"use client";
import React from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../../styles/Sidebar.module.css";

const Sidebar = () => {
 const router = useRouter();
 const pathname = usePathname();

 // Checking active page to highlight active menu item
 const isDashboardActive = pathname === "/dashboard";
 const isAnalyticsActive = pathname === "/analytics";

 const handleNavigation = (path) => {
   if (typeof path !== "string") {
     console.error("Invalid path:", path);
     return;
   }
   router.push(path);
 };

 return (
   <aside className={styles.sidebar}>
     <div className={styles.glassEffect}>
       {/* Dashboard Menu Item */}
       <div className={styles.menuItem}>
         <div
           className={`${styles.menuLink} ${isDashboardActive ? styles.active : ""}`}
           onClick={() => handleNavigation("/dashboard")}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => e.key === "Enter" && handleNavigation("/dashboard")}
         >
           <div className={styles.menuIcon}>
             {/* Removed extra div wrapper, simplified Image component */}
             <Image
               src="/dashboard_icon.svg"
               alt="Dashboard"
               width={30}
               height={30}
               className={`${styles.icon} ${isDashboardActive ? styles.activeIcon : ""}`}
               priority
             />
           </div>
           <span className={styles.menuText}>Dashboard</span>
         </div>
       </div>

       {/* User Analytics Menu Item - Updated to use SVG instead of BarChart3 */}
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
   </aside>
 );
};

export default Sidebar;