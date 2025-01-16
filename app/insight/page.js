// app/insight/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import InsightAnalytics from '../components/insights/InsightAnalytics';
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
        // Get insight_id from URL params
        const insightId = searchParams.get('id');
        console.log('Fetching insight data for:', { userId, insightId });

        if (!userId || !insightId) {
          console.log('Missing required parameters, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Changed to POST request with proper body
        const response = await fetch('https://get-insight-q54hzgyghq-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.glassEffect}>
            <div className={styles.descriptionBox}>
              {insightData?.description || 'No description available'}
            </div>
            <div className={styles.actionSection}>
              <button
                className={styles.analyseButton}
                onClick={handleAnalyseClick}
              >
                Analyse Board
              </button>
            </div>
            <InsightAnalytics graphData={insightData?.graphs || []} />
          </div>
        </main>
      </div>
    </div>
  );
}