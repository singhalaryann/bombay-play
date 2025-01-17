'use client';
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from '../../../styles/MetricsDisplay.module.css';

const MetricsDisplay = ({ metrics }) => {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  console.log('Rendering metrics:', metrics);

  return (
    <div className={styles.glassEffect}>
      <div className={styles.metricsGrid}>
        {metrics.map((metric, index) => {
          const isPositive = parseFloat(metric.delta) > 0;
          const formattedDelta = `${isPositive ? '+' : ''}${metric.delta}%`;
          
          return (
            <div key={index} className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.header}>
                  <h2 className={styles.title}>{metric.name}</h2>
                  <div className={isPositive ? styles.trendIconUp : styles.trendIconDown}>
                    {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                </div>
                <div className={styles.mainContent}>
                  <div className={styles.valueWrapper}>
                    <span className={styles.value}>{metric.value}</span>
                    <span className={styles.unit}>{metric.unit}</span>
                    <span className={`${styles.delta} ${isPositive ? styles.positive : styles.negative}`}>
                      ({formattedDelta})
                    </span>
                  </div>
                </div>
                {metric.description && (
                  <div className={styles.descriptionContainer}>
                    <p className={styles.description}>{metric.description}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsDisplay;