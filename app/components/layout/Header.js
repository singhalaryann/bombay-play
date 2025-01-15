// components/layout/Header.js
'use client'
import React from 'react';
import styles from '../../../styles/Header.module.css';
import Image from 'next/image';
import { Search, User } from 'lucide-react';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Image src="/logo-XG.svg" alt="XG Gaming"t width={40} height={40} />
      </div>
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={20} />
        <input type="text" placeholder="Search" className={styles.searchInput} />
      </div>
      <div className={styles.userProfile}>
        <span className={styles.userEmail}>userid625@gmail.com</span>
        <div className={styles.userIcon}>
          <User size={20} />
        </div>
      </div>
    </header>
  );
};

export default Header;