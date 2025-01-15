'use client';
import React from 'react';
import styles from '../../../styles/IdeaCard.module.css';
import { LightbulbIcon, ArrowRight } from 'lucide-react';

const IdeaCard = ({ number, description, idea }) => {
  const handleViewIdea = () => {
    console.log(`🔍 View idea ${number} clicked`);
    // TODO: Add navigation when needed
  };

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.ideaHeader}>
          <div className={styles.ideaLabel}>
            <LightbulbIcon size={16} className={styles.bulbIcon} />
            <span>Idea {number}</span>
          </div>
        </div>
        
        <p className={styles.description}>{description}</p>
        {idea && <p className={styles.subIdea}>idea: {idea}</p>}
        
        <button 
          className={styles.viewButton}
          onClick={handleViewIdea}
        >
          View Idea
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default IdeaCard;