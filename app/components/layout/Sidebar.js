// components/layout/Sidebar.js
'use client';
import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { BarChart3 } from 'lucide-react'; // Importing analytics icon
import styles from '../../../styles/Sidebar.module.css';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Checking active page to highlight active menu item
  const isDashboardActive = pathname === '/dashboard';
  const isAnalyticsActive = pathname === '/analytics';

  // Updated handleNavigation function with a safeguard check
  const handleNavigation = (path) => {
    if (typeof path !== 'string') {
      console.error('Invalid path:', path);
      return;
    }
    console.log(`Navigating to ${path}`);
    router.push(path);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.glassEffect}>
        {/* Dashboard Menu Item */}
        <div className={styles.menuItem}>
          <div
            className={`${styles.menuLink} ${isDashboardActive ? styles.active : ''}`}
            onClick={() => handleNavigation('/dashboard')} 
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigation('/dashboard')} 
          >
            <div className={styles.menuIcon}>
              <Image
                src="/dashboard.svg"
                alt="Dashboard"
                width={20}
                height={20}
                className={styles.icon}
              />
            </div>
            <span className={styles.menuText}>Dashboard</span>
          </div>
        </div>
        
        {/* User Analytics Menu Item */}
        <div className={styles.menuItem}>
          <div
            className={`${styles.menuLink} ${isAnalyticsActive ? styles.active : ''}`}
            onClick={() => handleNavigation('/analytics')} 
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigation('/analytics')} 
          >
            <div className={styles.menuIcon}>
              <BarChart3 size={20} className={styles.icon} />
            </div>
            <span className={styles.menuText}>User Analytics</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
