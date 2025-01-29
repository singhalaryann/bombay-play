'use client';
import React from 'react';
import styles from '../../../styles/VariantGroup.module.css';

const VariantGroup = () => {
  // Will be replaced with API data later
  const mockData = {
    control: {
      link: 'https://hmvvjh,jh2323jhb34rhjhb/4br5',
      features: [
        '3x Homes',
        '3 Concurrent Auctions',
        '6 row Backpack',
        '/craft',
        '/recipe',
        '/disposal',
        '/near',
        '/hat',
        '/feed'
      ]
    },
    variantA: {
      link: 'https://hmvvjh,jh2323jhb34rhjhb/4br5',
      features: [
        '5x Homes',
        '5 Concurrent Auctions',
        '6 row Backpack',
        '/craft',
        '/recipe',
        '/disposal',
        '/near',
        '/hat',
        '/feed',
        '/enderchest'
      ]
    }
  };

  return (
    <div className={styles.variantSection}>
      {/* Control Group */}
      <div className={styles.variantGroup}>
        <h3 className={styles.variantTitle}>Control Group</h3>
        <div className={styles.variantContent}>
          <div className={styles.linkGroup}>
            <label className={styles.label}>Link</label>
            <input
              type="text"
              className={styles.input}
              value={mockData.control.link}
              readOnly
            />
          </div>
          <div className={styles.glassBox}>
  <div className={styles.featureList}>
    {mockData.control.features.map((feature, index) => (
      <div key={index} className={styles.featureItem}>
        • {feature}
      </div>
    ))}
  </div>
</div>
        </div>
      </div>

      {/* Variant A */}
      <div className={styles.variantGroup}>
        <h3 className={styles.variantTitle}>Variant A</h3>
        <div className={styles.variantContent}>
          <div className={styles.linkGroup}>
            <label className={styles.label}>Link Details</label>
            <input
              type="text"
              className={styles.input}
              value={mockData.variantA.link}
              readOnly
            />
          </div>
          <div className={styles.glassBox}>
  <div className={styles.featureList}>
    {mockData.control.features.map((feature, index) => (
      <div key={index} className={styles.featureItem}>
        • {feature}
      </div>
    ))}
  </div>
</div>
        </div>
      </div>
    </div>
  );
};

export default VariantGroup;