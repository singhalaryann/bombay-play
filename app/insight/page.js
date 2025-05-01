// app/insight/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
// UPDATED: Import GetMetrics instead of GraphDisplay directly
import GetMetrics from '../components/dashboard/GetMetrics';
import { Calendar } from 'lucide-react';
import Image from 'next/image';
import styles from '../../styles/Insight.module.css';

export default function InsightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  // UPDATED: State to store the metric name and date filter
  const [metricInfo, setMetricInfo] = useState({
    metricName: '',
    dateFilter: null,
    metricType: ''
  });

  useEffect(() => {
    const fetchInsightData = async () => {
      const insightId = searchParams.get('id');
      console.log('🔍 Fetching insight for id:', insightId);
      if (!userId || !insightId) {
        console.log('⚠️ Missing userId or insightId, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('https://get-insight-data-nrosabqhla-uc.a.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            game_id: 'ludogoldrush',
            insight_ids: [insightId],
          }),
        });
        const data = await response.json();
        console.log('✅ API response:', data);
        if (data.insights && data.insights.length > 0) {
          const selectedInsight = data.insights[0];
          setInsight(selectedInsight);
          
          // UPDATED: Extract metric and date_filter information
          if (selectedInsight.query && selectedInsight.query[0]) {
            const { metric, date_filter, metric_type } = selectedInsight.query[0];
            console.log("Found metric info:", { metric, date_filter, metric_type });
            
            // Set the metric info to pass to GetMetrics
            setMetricInfo({
              metricName: metric,
              dateFilter: date_filter,
              metricType: metric_type || ''
            });
          }
        } else {
          setInsight(null);
          setMetricInfo({ metricName: '', dateFilter: null, metricType: '' });
        }
      } catch (error) {
        console.error('❌ Error fetching insight data:', error);
        setInsight(null);
        setMetricInfo({ metricName: '', dateFilter: null, metricType: '' });
      } finally {
        setLoading(false);
      }
    };
    fetchInsightData();
  }, [userId, searchParams, router]);

  // Handle Analyse Board click
  const handleAnalyseClick = () => {
    const insightId = searchParams.get('id');
    console.log('Navigating to ideas with insight:', insightId);
    router.push(`/ideas?insight=${insightId}`);
  };

  // Format date filter for display
  const formatDateFilter = (filter) => {
    if (!filter) return '';
    
    if (filter.type === 'last') {
      if (filter.days === 0) return 'Today';
      if (filter.days === 1) return 'Yesterday';
      return `Last ${filter.days} days`;
    }
    if (filter.type === 'yesterday') return 'Yesterday';
    if (filter.type === 'between') return `${filter.start_date} - ${filter.end_date}`;
    if (filter.type === 'since') return `Since ${filter.start_date}`;
    return JSON.stringify(filter);
  };

  // Skeleton loading for insight content
  const renderSkeletonContent = () => (
    <>
      <div className={styles.insightSection}>
        <div className={styles.insightHeader}>
          <div className={styles.insightTitleContainer}>
            <div className={styles.insightSkeletonTitle}></div>
            <div className={styles.insightSkeletonFilter}></div>
          </div>
        </div>
        
        <div className={styles.actionRow}>
          <div className={styles.skeletonSubText}></div>
          <div className={styles.skeletonButton}>
            <div className={styles.skeletonButtonText}></div>
            <div className={styles.skeletonIcon}></div>
          </div>
        </div>
      </div>

      <div className={styles.graphSection}>
        <div className={styles.skeletonGraphTitle}></div>
        <div className={styles.skeletonGraphContent}></div>
      </div>
    </>
  );

  // No insight found state
  const renderNoInsight = () => (
    <div className={styles.noInsight}>
      <div className={styles.noInsightContent}>
        <h3>No insight found</h3>
        <p>The requested insight could not be found or is unavailable.</p>
        <button 
          className={styles.returnButton} 
          onClick={() => router.push('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          {loading ? (
            renderSkeletonContent()
          ) : !insight ? (
            renderNoInsight()
          ) : (
            <>
              <div className={styles.insightSection}>
                <div className={styles.insightHeader}>
                  <div className={styles.insightTitleContainer}>
                    <h2 className={styles.insightTitle}>{insight.insight_text}</h2>
                    {metricInfo.dateFilter && (
                      <div className={styles.filterContainer}>
                        <div className={styles.dateFilterButton}>
                          <Calendar size={16} className={styles.calendarIcon} />
                          <span>{formatDateFilter(metricInfo.dateFilter)}</span>
                        </div>
                      </div>
                    )}
                  </div>
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
              </div>

              {/* UPDATED: Use direct API date filter instead of converting through selectedTime */}
              {metricInfo.metricName && (
  // <div className={styles.graphSection}> ← Comment out this line
    <GetMetrics 
      selectedTime={null}
      onTimeChange={() => {}}
      specificMetric={metricInfo.metricName}
      specificMetricType={metricInfo.metricType}
      readOnly={true}
      initialDateFilter={metricInfo.dateFilter}
    />
  // </div> ← Comment out this line
)}
            </>
          )}
        </main>
      </div>
    </div>
  );
}