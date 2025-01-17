// components/layout/Sidebar.js
'use client';
import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import styles from '../../../styles/Sidebar.module.css';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardActive = pathname === '/dashboard';

  const handleNavigation = () => {
    console.log('Navigating to dashboard');
    router.push('/dashboard');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.glassEffect}>
        <div className={styles.menuItem}>
          <div
            className={`${styles.menuLink} ${isDashboardActive ? styles.active : ''}`}
            onClick={handleNavigation}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigation()}
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
      </div>
    </aside>
  );
};

export default Sidebar;

