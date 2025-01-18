// components/ideas/IdeaCard.js
'use client';
import React, { useState } from 'react'; // <-- NEW import for useState
import { useRouter } from 'next/navigation';
import styles from '../../../styles/IdeaCard.module.css';
import { Lightbulb, ArrowRight } from 'lucide-react';

const IdeaCard = ({ number, description, ideaId, insightId }) => {
  const router = useRouter();

  // NEW loading state
  const [isLoading, setIsLoading] = useState(false); 

  const handleViewIdea = async () => {
    console.log("handleViewIdea called for idea:", ideaId);
    try {
      setIsLoading(true); // set loading before fetch

      // Call the chat initialization API
      const response = await fetch('https://generate-chat-endpoint-flnr5jia5q-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea_id: ideaId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat');
      }

      const data = await response.json();
      const chatId = data.chat_id;
      console.log("Chat initialized, chatId:", chatId);

      // Route to analysis page with all required parameters
      router.push(`/analysis?idea=${ideaId}&insight=${insightId}&chat=${chatId}`);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setIsLoading(false); // <-- NEW line: stop loading on error
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.glassEffect}>
        <div className={styles.content}>
          <div className={styles.ideaLabel}>
            <Lightbulb size={16} className={styles.bulbIcon} />
            <span>Idea {number}</span>
          </div>
          <p className={styles.description}>{description}</p>

          {/* NEW: conditionally render button based on isLoading */}
          {isLoading ? (
            <button className={styles.viewButton} disabled>Loading...</button> // <-- NEW line
          ) : (
            <button className={styles.viewButton} onClick={handleViewIdea}>
              <div className={styles.viewButtonContent}>
                <Lightbulb size={16} />
                <span>View Idea</span>
                <ArrowRight size={16} />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaCard;
