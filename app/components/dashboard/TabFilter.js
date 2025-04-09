// components/dashboard/TabFilter.js
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import styles from '../../../styles/TabFilter.module.css';

const TabFilter = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const filters = ["Today", "Yesterday", "7D", "30D", "3M", "6M", "12M"];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleTimeChange = (filter) => {
    console.log('Selected time filter:', filter);
    onChange(filter);
    setIsOpen(false);
  };
  
  return (
    <div className={styles.filterWrapper} ref={dropdownRef}>
      <div className={styles.dropdown}>
        <button 
          className={styles.dropdownToggle} 
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <Calendar size={16} className={styles.calendarIcon} />
          {selected}
          <ChevronDown size={16} />
        </button>
        
        {isOpen && (
          <div className={styles.dropdownMenu}>
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => handleTimeChange(filter)}
                className={`${styles.dropdownItem} ${
                  filter === selected ? styles.active : ""
                }`}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabFilter;