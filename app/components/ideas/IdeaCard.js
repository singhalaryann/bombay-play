// components/ideas/IdeaCard.js
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/IdeaCard.module.css';
import { LightbulbIcon, ArrowRight } from 'lucide-react';

const IdeaCard = ({ number, description, ideaId, insightId }) => {
  const router = useRouter();

  const handleViewIdea = () => {
    console.log('View idea clicked:', { ideaId, insightId });
    router.push(`/idea/${ideaId}?insight=${insightId}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.glassEffect}>
        <div className={styles.header}>
          <div className={styles.ideaLabel}>
            <LightbulbIcon size={16} className={styles.bulbIcon} />
            <span>Idea {number}</span>
          </div>
        </div>
        
        <div className={styles.content}>
          <p className={styles.description}>{description}</p>
          
          <button
            className={styles.viewButton}
            onClick={handleViewIdea}
          >
            <span>View Idea</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdeaCard;