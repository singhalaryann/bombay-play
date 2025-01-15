// app/insight/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import TabFilter from '../components/dashboard/TabFilter';
import InsightAnalytics from '../components/insights/InsightAnalytics';
import styles from '../../styles/Insight.module.css';

export default function InsightPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [graphData, setGraphData] = useState(null);
  const [selectedTime, setSelectedTime] = useState('30D');

  useEffect(() => {
    const fetchInsightData = async () => {
      console.log('Fetching insight data');
      
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/insight/${userId}/${insightId}`);
        // const data = await response.json();
        
        setDescription("Revenue has decreased by 5% in the last 24 hours. Review user segments and experiment performance.");
        setGraphData({
          revenueStream: [],
          userBase: [],
          age: [],
          geography: []
        });
        
        console.log('Insight data fetched successfully');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching insight data:', error);
        setLoading(false);
      }
    };

    fetchInsightData();
  }, [selectedTime]);

  const handleTimeChange = (newTime) => {
    console.log('Time filter changed:', newTime);
    setSelectedTime(newTime);
  };

  const handleAnalyseClick = () => {
    console.log('Navigating to ideas page');
    router.push('/ideas');
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

          <div className={styles.descriptionBox}>
            {description}
          </div>

          <div className={styles.actionSection}>
            <button 
              className={styles.analyseButton}
              onClick={handleAnalyseClick}
            >
              Analyse Board
            </button>
          </div>

          <InsightAnalytics graphData={graphData} />
        </main>
      </div>
    </div>
  );
}