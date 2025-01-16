// components/dashboard/MetricCard.js
'use client';
import React from 'react';
import styles from '../../../styles/MetricCard.module.css';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ name, value, delta, trend, description }) => {
  // Determine if trend is up based on delta value
  const isPositive = parseFloat(delta) > 0;
  
  // Format the delta value to always show + or - sign
  const formattedDelta = `${isPositive ? '+' : ''}${delta}`;
  
  // Format large numbers with commas
  const formatValue = (val) => {
    if (typeof val === 'string' && val.startsWith('$')) {
      return `$${parseInt(val.substring(1)).toLocaleString('en-US')}`;
    }
    return val;
  };

  return (
    <div className={styles.card}>
      <div className={styles.glassEffect}>
        <div className={styles.header}>
          <span className={styles.title}>{name}</span>
          {isPositive ? (
            <div className={styles.trendIconUp}>
              <TrendingUp size={20} />
            </div>
          ) : (
            <div className={styles.trendIconDown}>
              <TrendingDown size={20} />
            </div>
          )}
        </div>
        
        <div className={styles.valueContainer}>
          <span className={styles.value}>{formatValue(value)}</span>
          <span className={`${styles.delta} ${isPositive ? styles.positive : styles.negative}`}>
            ({formattedDelta}%)
          </span>
        </div>
        
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
};

export default MetricCard;