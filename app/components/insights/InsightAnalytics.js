// app/components/insights/InsightAnalytics.js
'use client';
import React from 'react';
import styles from '../../../styles/InsightAnalytics.module.css';

const InsightAnalytics = ({ graphData }) => {
  console.log('📊 InsightAnalytics: Rendering with data:', graphData);

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.section}>
        <h3>Split by revenue stream</h3>
        <div className={styles.graphPlaceholder}>
          {/* TODO: Will be replaced with actual graph component */}
          <p>Revenue Stream Graph will be here</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Split by user base</h3>
        <div className={styles.graphPlaceholder}>
          {/* TODO: Will be replaced with actual graph component */}
          <p>User Base Graph will be here</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Age</h3>
        <div className={styles.graphPlaceholder}>
          {/* TODO: Will be replaced with actual graph component */}
          <p>Age Graph will be here</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Geography</h3>
        <div className={styles.graphPlaceholder}>
          {/* TODO: Will be replaced with actual graph component */}
          <p>Geography Graph will be here</p>
        </div>
      </div>
    </div>
  );
};

export default InsightAnalytics;