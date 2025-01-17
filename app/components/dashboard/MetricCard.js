// MetricCard.js
import React from 'react';
import styles from '../../../styles/MetricCard.module.css';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ name, value, delta, description }) => {
  // Determine if trend is up based on delta value
  const isPositive = parseFloat(delta) > 0;
  
  // Format the delta value with sign
  const formattedDelta = `${isPositive ? '+' : ''}${delta}%`;

  // Function to format value (handles both number and currency)
  const formatValue = (val) => {
    if (typeof val === 'string' && val.startsWith('$')) {
      // If it's already a currency string, return as is
      return val;
    }
    // For numbers, convert to string without additional formatting
    return `$${val}`
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardInner}>
        {/* Header section */}
        <div className={styles.header}>
          <span className={styles.title}>{name}</span>
          <div className={isPositive ? styles.trendIconUp : styles.trendIconDown}>
            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        </div>

        {/* Value and delta section */}
        <div className={styles.mainContent}>
  <span className={styles.value}>{formatValue(value)}</span>
  <span className={`${styles.delta} ${isPositive ? styles.positive : styles.negative}`}>
    ({formattedDelta})
  </span>
</div>
<div className={styles.descriptionContainer}>
  <p className={styles.description}>{description}</p>
</div>
      </div>
    </div>
  );
};

export default MetricCard;