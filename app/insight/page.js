// app/insight/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import GraphDisplay from '../components/analysis/GraphDisplay';
import { Calendar } from 'lucide-react';
import Image from 'next/image';
import styles from '../../styles/Insight.module.css';

export default function InsightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [graphData, setGraphData] = useState([]);

  // Function to transform insight data into format for GraphDisplay
  const transformInsightForGraph = (insightData) => {
    if (!insightData || !insightData.query || !insightData.query[0]) {
      console.log("No valid insight data to transform");
      return [];
    }

    const { metric, date_filter, metric_type } = insightData.query[0];
    console.log("Transforming insight data:", { metric, date_filter, metric_type });

    // Determine the appropriate metric type based on the insight data
    let chartType = 'line'; // Default to line chart
    if (metric_type) {
      chartType = metric_type.toLowerCase();
    } else if (metric.includes('distribution') || metric.includes('breakdown')) {
      chartType = 'bar'; // Use bar chart for distribution data
    } else if (metric.includes('percentage') || metric.includes('ratio')) {
      chartType = 'pie'; // Use pie chart for percentage/ratio data
    }

    // Create graph configuration based on the metric type
    return [{
      metric_id: `insight-${insightData.insight_id}`,
      metric_type: chartType,
      title: insightData.insight_text,
      description: insightData.description || "",
      columns: ['Date', metric],
      values: insightData.data || [], // Use data if it exists, otherwise empty array
      x_unit: "",
      y_unit: "",
      date_filter: date_filter
    }];
  };

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
            game_id: '4705d90b-f4a9-4a71-b0b1-e4da22acfb36',
            insight_ids: [insightId],
          }),
        });
        const data = await response.json();
        console.log('✅ API response:', data);
        if (data.insights && data.insights.length > 0) {
          const selectedInsight = data.insights[0];
          setInsight(selectedInsight);
          
          // Transform the insight data for the graph
          const transformedData = transformInsightForGraph(selectedInsight);
          setGraphData(transformedData);
        } else {
          setInsight(null);
          setGraphData([]);
        }
      } catch (error) {
        console.error('❌ Error fetching insight data:', error);
        setInsight(null);
        setGraphData([]);
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
                    {graphData[0]?.date_filter && (
                      <div className={styles.filterContainer}>
                        <div className={styles.dateFilterButton}>
                          <Calendar size={16} className={styles.calendarIcon} />
                          <span>{formatDateFilter(graphData[0].date_filter)}</span>
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

              {graphData.length > 0 && (
                <div className={styles.graphSection}>
                  <GraphDisplay graphs={graphData} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}