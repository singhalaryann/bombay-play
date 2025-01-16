// components/layout/Header.js
'use client'
import React from 'react';
import styles from '../../../styles/Header.module.css';
import Image from 'next/image';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const Header = () => {
  const { userId } = useAuth();
  const router = useRouter();

  const handleBack = () => {
    localStorage.removeItem('userId');
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
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
        <button onClick={handleBack} className={styles.logoutButton}>
          <LogOut size={20} />
        </button>
        
        <div className={styles.userBlock}>
          <User size={20} className={styles.userIcon} />
          <span className={styles.userId}>{userId || 'Guest'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;