// app/insight/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import GetMetrics from '../components/dashboard/GetMetrics';
import { Calendar, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import Image from 'next/image';
import styles from '../../styles/Insight.module.css';

export default function InsightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [gameId, setGameId] = useState('ludogoldrush');
  const [userIds, setUserIds] = useState([]);
  
  // State to track which insights have their graphs visible
  const [visibleGraphs, setVisibleGraphs] = useState({});

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
            // user_id: userId,
            game_id: 'ludogoldrush',
            insight_ids: [insightId],
          }),
        });
        const data = await response.json();
        console.log('✅ API response:', data);
        if (data.insights && data.insights.length > 0) {
          const selectedInsight = data.insights[0];
          console.log('Insight data:', selectedInsight);
          setInsight(selectedInsight);
          
          // Extract query information
          if (selectedInsight.query) {
            console.log('Query data:', selectedInsight.query);
            setDateFilter(selectedInsight.query.date_filter || null);
            setGameId(selectedInsight.query.game_id || 'ludogoldrush');
            setUserIds(selectedInsight.query.user_ids || []);
          }
        } else {
          setInsight(null);
          setDateFilter(null);
        }
      } catch (error) {
        console.error('❌ Error fetching insight data:', error);
        setInsight(null);
        setDateFilter(null);
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

  // Toggle visibility of graphs for a specific lens
  const toggleGraphVisibility = (lensIndex) => {
    console.log('Toggling graph visibility for lens:', lensIndex);
    setVisibleGraphs(prev => ({
      ...prev,
      [lensIndex]: !prev[lensIndex]
    }));
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

      <div className={styles.skeletonInsightsList}>
        {[1, 2, 3].map((index) => (
          <div key={index} className={styles.skeletonInsightItem}>
            <div className={styles.skeletonInsightTitle}></div>
            <div className={styles.skeletonInsightText}></div>
          </div>
        ))}
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
                    <h2 className={styles.insightTitle}>{insight.headline || insight.insight_text}</h2>
                    {dateFilter && (
                      <div className={styles.filterContainer}>
                        <div className={styles.dateFilterButton}>
                          <Calendar size={16} className={styles.calendarIcon} />
                          <span>{formatDateFilter(dateFilter)}</span>
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

              {insight.insight_payload && insight.insight_payload.detailed_insights_by_lens && (
                <div className={styles.insightsList}>
                  {insight.insight_payload.detailed_insights_by_lens.map((lens, index) => (
                    <div key={index} className={styles.insightItem}>
                      <div className={styles.insightItemHeader}>
                        {/* CHANGED: Show hidden_signal instead of lens_name */}
                        <h3 className={styles.insightItemTitle}>{lens.hidden_signal}</h3>
                      </div>
                      <p className={styles.insightItemText}>{lens.insight}</p>
                      
                      <button 
                        className={styles.showGraphsButton}
                        onClick={() => toggleGraphVisibility(index)}
                      >
                        <BarChart2 size={18} className={styles.graphIcon} />
                        <span>{visibleGraphs[index] ? 'Hide Graphs' : 'Show Graphs'}</span>
                        {visibleGraphs[index] ? (
                          <ChevronUp size={16} className={styles.chevronIcon} />
                        ) : (
                          <ChevronDown size={16} className={styles.chevronIcon} />
                        )}
                      </button>
                      
                      {visibleGraphs[index] && lens.metrics_examined && lens.metrics_examined.length > 0 && (
                        <div className={styles.graphsContainer}>
                          {lens.metrics_examined.map((metric, metricIndex) => (
                            <div key={metricIndex} className={styles.metricGraphWrapper}>
                              {/* REMOVED: The metric name heading */}
                              <GetMetrics 
                                selectedTime={null}
                                onTimeChange={() => {}}
                                specificMetric={metric}
                                // REMOVED: specificMetricType="line"
                                readOnly={true}
                                initialDateFilter={dateFilter}
                                // ADDED: Only show skeletons for the first metric
                                hideSkeletons={metricIndex > 0}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}