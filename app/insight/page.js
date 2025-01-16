// app/insight/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import InsightAnalytics from '../components/insights/InsightAnalytics';
import Image from 'next/image';
import styles from '../../styles/Insight.module.css';

export default function InsightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insightData, setInsightData] = useState(null);

  useEffect(() => {
    const fetchInsightData = async () => {
      try {
        const insightId = searchParams.get('id');
        console.log('Fetching insight data for:', { userId, insightId });

        if (!userId || !insightId) {
          console.log('Missing required parameters, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        const response = await fetch('https://get-insight-q54hzgyghq-uc.a.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            insight_id: insightId
          })
        });

        const data = await response.json();
        console.log('Insight data received:', data);
        setInsightData(data);
      } catch (error) {
        console.error('Error fetching insight data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsightData();
  }, [userId, searchParams, router]);

  const handleAnalyseClick = () => {
    const insightId = searchParams.get('id');
    console.log('Navigating to ideas with insight:', insightId);
    router.push(`/ideas?id=${insightId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.mainLayout}>
          <Sidebar />
          <main className={styles.mainContent}>
            <div className={styles.contentLoading}>Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.glassBox}>
            {insightData?.description || 'No description available'}
          </div>

          <div className={styles.actionRow}>
            <p className={styles.subText}>
              Uncover actionable insights for each metric and enhance your strategies effortlessly.
            </p>
            <button className={styles.analyseButton} onClick={handleAnalyseClick}>
              <span>Analyse Board</span>
              <div className={styles.iconWrapper}>
                <Image 
                  src="/Analyse_icon.svg" 
                  alt="Analyse" 
                  width={24} 
                  height={24} 
                  className={styles.buttonIcon}
                  priority
                />
              </div>
            </button>
          </div>

          <InsightAnalytics graphData={insightData?.graphs || []} />
        </main>
      </div>
    </div>
  );
}