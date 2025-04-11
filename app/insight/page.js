// app/insight/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MetricsDisplay from '../components/analysis/MetricsDisplay';
import GraphDisplay from '../components/analysis/GraphDisplay';
import Image from 'next/image';
import styles from '../../styles/Insight.module.css';
import LoadingAnimation from '../components/common/LoadingAnimation';

// Helper function to transform line/bar/pie metrics into GraphDisplay format
function convertMetricsToGraphs(metrics) {
  return metrics.map((m) => {
    return {
      metric_type: m.metric_type,
      metric_id: m.metric_id,
      title: m.title,
      columns: m.columns,
      values: m.values,
      x_unit: '',
      y_unit: '',
      value_unit: ''
    };
  });
}

export default function InsightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insightData, setInsightData] = useState(null);

  // Separate arrays for metrics and graphs (just like the Analysis page)
  const [initialMetrics, setInitialMetrics] = useState([]);
  const [initialGraphs, setInitialGraphs] = useState([]);
  
  // Cache duration: 5 minutes in milliseconds
  const CACHE_DURATION = 5 * 60 * 1000;
  
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const fetchInsightData = async () => {
      try {
        const insightId = searchParams.get('id');
        console.log('🔍 Processing insight request for:', { userId, insightId });

        setIsInitialRender(false);

        // If missing required params, go back to dashboard
        if (!userId || !insightId) {
          console.log('⚠️ Missing required parameters, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Check cache first
        const cacheKey = `insight_cache_${insightId}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const { data: cachedInsight, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            const loadStart = performance.now();
            console.log('🔄 Loading insight from cache...');
            
            setInsightData(cachedInsight);
            
            // Process cached data for metrics and graphs
            if (cachedInsight?.graphs) {
              const metricItems = cachedInsight.graphs.filter(m => m.metric_type === 'metric');
              setInitialMetrics(metricItems);

              const chartCandidates = cachedInsight.graphs.filter(
                m => ['line', 'bar', 'pie', 'hist'].includes(m.metric_type)
              );
              setInitialGraphs(convertMetricsToGraphs(chartCandidates));
            }

            const loadEnd = performance.now();
            console.log(`✅ Cache load completed in ${((loadEnd - loadStart) / 1000).toFixed(2)} seconds`);
            setLoading(false);
            return;
          } else {
            console.log('🕒 Cache expired, fetching fresh data...');
          }
        } else {
          console.log('💭 No cache found, fetching fresh data...');
        }

        // Fetch from API if no valid cache
        const apiStart = performance.now();
        console.log('🔄 Starting API call to fetch insight data...');

        const response = await fetch('https://get-insight-q54hzgyghq-uc.a.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            insight_id: insightId
          })
        });

        const data = await response.json();
        const apiEnd = performance.now();
        console.log(`✅ API call completed in ${((apiEnd - apiStart) / 1000).toFixed(2)} seconds`);

        // Cache the fresh data
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
          }));
          console.log('💾 Insight data cached successfully');
        } catch (error) {
          console.error('❌ Error caching insight data:', error);
        }

        setInsightData(data);

        // Process data for metrics and graphs
        if (data?.graphs) {
          // "metric" type items for MetricsDisplay
          const metricItems = data.graphs.filter(m => m.metric_type === 'metric');
          setInitialMetrics(metricItems);

          // line / bar / pie items for GraphDisplay
          const chartCandidates = data.graphs.filter(
            m => ['line', 'bar', 'pie', 'hist'].includes(m.metric_type)
          );
          setInitialGraphs(convertMetricsToGraphs(chartCandidates));
        }
      } catch (error) {
        console.error('❌ Error fetching insight data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsightData();
  }, [userId, searchParams, router]);

  // When user clicks "Analyse Board," navigate to ideas page
  const handleAnalyseClick = () => {
    const insightId = searchParams.get('id');
    console.log('Navigating to ideas with insight:', insightId);
    router.push(`/ideas?insight=${insightId}`);
  };

  // ADDED: Render skeleton content function
  const renderSkeletonContent = () => {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.mainLayout}>
          <Sidebar />
          <main className={styles.mainContent}>
            {/* ADDED: Skeleton glass box */}
            <div className={`${styles.glassBox} ${styles.skeletonGlassBox}`}>
              <div className={styles.skeletonText}></div>
              <div className={styles.skeletonText}></div>
            </div>

            {/* ADDED: Skeleton action row */}
            <div className={styles.actionRow}>
              <div className={`${styles.subText} ${styles.skeletonSubText}`}></div>
              <div className={`${styles.analyseButton} ${styles.skeletonButton}`}>
                <div className={styles.skeletonButtonText}></div>
                <div className={styles.iconWrapper}>
                  <div className={styles.skeletonIcon}></div>
                </div>
              </div>
            </div>

            {/* ADDED: Skeleton metrics */}
            <div className={styles.metricsDisplay}>
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className={styles.skeletonMetricCard}>
                  <div className={styles.skeletonMetricTitle}></div>
                  <div className={styles.skeletonMetricValue}></div>
                </div>
              ))}
            </div>

            {/* ADDED: Skeleton graphs */}
            <div className={styles.graphsGrid}>
              {[1, 2].map((index) => (
                <div key={index} className={`${styles.graphCard} ${styles.skeletonGraphCard}`}>
                  <div className={styles.skeletonGraphTitle}></div>
                  <div className={styles.skeletonGraphContent}></div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  };

  // UPDATED: Modified loading handler to use skeleton content instead of just LoadingAnimation
  if (isInitialRender || loading) {
    return renderSkeletonContent();
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

          {/* Show only the metric-type items which have a single row of values */}
          <MetricsDisplay
            metrics={initialMetrics.filter(
              (m) => m.values?.length === 1
            )}
          />

          {/* Show line/bar/pie data as charts */}
          <GraphDisplay
            graphs={initialGraphs}
          />
        </main>
      </div>
    </div>
  );
}