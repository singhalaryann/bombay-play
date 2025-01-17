// InsightCard.js
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/InsightCard.module.css';
import { Lightbulb, ChevronRight } from 'lucide-react';

const InsightCard = ({ description, insight_id }) => {
  const router = useRouter();

  const handleInvestigate = () => {
    router.push(`/insight?id=${insight_id}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.messageWrapper}>
          <span className={styles.bullet}>•</span>
          <p className={styles.description}>{description}</p>
        </div>
        <button className={styles.investigateButton} onClick={handleInvestigate}>
          <Lightbulb size={16} />
          <span>Investigate</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default InsightCard;