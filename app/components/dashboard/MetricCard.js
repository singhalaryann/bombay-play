// components/dashboard/MetricCard.js
'use client';
import React from 'react';
import styles from '../../../styles/MetricCard.module.css';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ name, value, delta, trend, description }) => {
  // Log when new metric data is received
  React.useEffect(() => {
    console.log('Metric Card data:', { name, value, delta, trend, description });
  }, [name, value, delta, trend, description]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{name}</span>
        {trend === "up" ? (
          <TrendingUp className={styles.trendIconUp} size={20} />
        ) : (
          <TrendingDown className={styles.trendIconDown} size={20} />
        )}
      </div>
      <div className={styles.valueContainer}>
        <span className={styles.value}>{value}</span>
        <span className={`${styles.delta} ${trend === "up" ? styles.positive : styles.negative}`}>
          {delta}
        </span>
      </div>
      <p className={styles.description}>{description}</p>
    </div>
  );
};

export default MetricCard;