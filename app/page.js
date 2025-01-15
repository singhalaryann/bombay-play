// app/page.js
'use client';
import React, { useState, useEffect } from 'react';
import styles from '../styles/page.module.css';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import TabFilter from './components/dashboard/TabFilter';
import MetricCard from './components/dashboard/MetricCard';
import InsightCard from './components/dashboard/InsightCard';

export default function Home() {
  // State management
  const [selectedTime, setSelectedTime] = useState('30D');
  const [metrics, setMetrics] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for development (remove when API is ready)
  const mockData = {
    metrics: [
      {
        name: "Total Time spent",
        value: "$51374",
        delta: "+34.6%",
        trend: "up",
        description: "Total Revenue over the last 30 days is positive"
      },
      {
        name: "ARPU (Old)",
        value: "$35051",
        delta: "+9.1%",
        trend: "up",
        description: "Old Average Revenue Per User increased by 9.1%"
      },
      {
        name: "ARPU (New)",
        value: "$16323",
        delta: "-10.1%",
        trend: "down",
        description: "Revenue from Delhi NCR is decreasing"
      }
    ],
    insights: {
      description: "Revenue has decreased by 5% in the last 24 hours. Review user segments and experiment performance.",
      insight_id: "ins_123"
    }
  };

  // Fetch dashboard data function
  const fetchDashboardData = async (time) => {
    try {
      console.log('Fetching dashboard data for time:', time);
      setLoading(true);

      // TODO: Replace with actual API call
      /* 
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'userid625@gmail.com',
          time: time
        })
      });
      const data = await response.json();
      */

      // Using mock data (remove when API is ready)
      setTimeout(() => {
        console.log('Data received:', mockData);
        setMetrics(mockData.metrics);
        setInsight(mockData.insights);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Handle time filter change
  const handleTimeChange = (newTime) => {
    console.log('Time filter changed to:', newTime);
    setSelectedTime(newTime);
    fetchDashboardData(newTime);
  };

  // Initial data fetch
  useEffect(() => {
    console.log('Initial data fetch with time:', selectedTime);
    fetchDashboardData(selectedTime);
  }, []);

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
          
          <div className={styles.metricsGrid}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : (
              metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))
            )}
          </div>

          {insight && (
            <div className={styles.insightSection}>
              <InsightCard {...insight} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}