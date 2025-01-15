// components/layout/Sidebar.js
'use client';
import React from 'react';
import styles from '../../../styles/Sidebar.module.css';
import { LayoutGrid } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
        <div className={styles.glassEffect}>  
      <div className={styles.menuItem}>
        <div className={styles.menuLink}>
          <div className={styles.menuIcon}>
            <LayoutGrid size={20} className={styles.icon} />
          </div>
          <span className={styles.menuText}>Dashboard</span>
        </div>
      </div>
      </div>
    </aside>
  );
};

export default Sidebar;