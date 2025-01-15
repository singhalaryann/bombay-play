'use client';
import React from 'react';
import { useRouter } from 'next/navigation';  // Added this import
import styles from '../../../styles/InsightCard.module.css';
import { Lightbulb, ChevronRight } from 'lucide-react';

const InsightCard = ({ description, insight_id }) => {
  const router = useRouter();

  const handleInvestigate = () => {
    console.log('Investigating insight:', insight_id);
    router.push(`/insight`);
    // When API ready: router.push(`/insight?id=${insight_id}`);
  };

  // Log when new insight data is received
  React.useEffect(() => {
    console.log('Insight Card data:', { description, insight_id });
  }, [description, insight_id]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Lightbulb className={styles.icon} size={20} />
        <span className={styles.title}>Insights</span>
      </div>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.message}>
            <span className={styles.bullet}>•</span>
            <p>{description}</p>
          </div>
          <button
            className={styles.investigateButton}
            onClick={handleInvestigate}
          >
            <span>Investigate</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;