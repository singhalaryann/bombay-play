// app/ideas/page.js
'use client';
import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import TabFilter from '../components/dashboard/TabFilter';
import IdeaCard from '../components/ideas/IdeaCard';
import styles from '../../styles/Ideas.module.css';

export default function IdeasPage() {
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [selectedTime, setSelectedTime] = useState('30D');

  useEffect(() => {
    const fetchIdeas = async () => {
      console.log('Fetching ideas data');
      
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/idea/${userId}/${insightId}`);
        // const data = await response.json();
        
        setDescription("Revenue has decreased by 5% in the last 24 hours.");
        setIdeas([
          {
            id: 1,
            description: "Raid participation could increase by 20% and session length by 15% in 2 weeks",
            idea: "introduce limited-time raid events"
          },
          {
            id: 2,
            description: "If I launch a community build competition, creative mode playtime will increase by 30% and returning users by 10% in 30 days."
          },
          {
            id: 3,
            description: "If I offer starter packs for new users, retention will improve by 15% and Bundle 1 conversions by 10% in 14 days.."
          }
        ]);
        
        console.log('Ideas data fetched successfully');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ideas:', error);
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [selectedTime]);

  const handleTimeChange = (newTime) => {
    console.log('Time filter changed:', newTime);
    setSelectedTime(newTime);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.filterSection}>
            <TabFilter
              selected={selectedTime}
              onChange={handleTimeChange}
            />
          </div>

          <h2 className={styles.title}>Problem statement</h2>
          <div className={styles.problemStatement}>
            {description}
          </div>

          <div className={styles.hypothesisSection}>
            <h2 className={styles.title}>
              Hypothesis
              <span className={styles.questionMark}>?</span>
            </h2>
            
            <div className={styles.ideasContainer}>
              {ideas.map((idea, index) => (
                <IdeaCard 
                  key={idea.id}
                  number={index + 1}
                  {...idea}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}