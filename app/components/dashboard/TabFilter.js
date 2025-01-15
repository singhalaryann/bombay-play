// components/dashboard/TabFilter.js
'use client';
import React from 'react';
import styles from '../../../styles/TabFilter.module.css';

const TabFilter = ({ selected, onChange }) => {
  const filters = ["Today", "Yesterday", "7D", "30D", "3M", "6M", "12M"];

  const handleTimeChange = (filter) => {
    console.log('Selected time filter:', filter);
    onChange(filter);
  };

  return (
    <div className={styles.filterContainer}>
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => handleTimeChange(filter)}
          className={`${styles.filterButton} ${
            filter === selected ? styles.active : ""
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default TabFilter;