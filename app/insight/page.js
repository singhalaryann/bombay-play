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

  useEffect(() => {
    const fetchInsightData = async () => {
      try {
        const insightId = searchParams.get('id');
        console.log('Fetching insight data for:', { userId, insightId });

        // If missing required params, go back to dashboard
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

        // If we have data.graphs, split out "metric" items vs. line/bar/pie
        if (data?.graphs) {
          // "metric" type items for MetricsDisplay
          const metricItems = data.graphs.filter(
            (m) => m.metric_type === 'metric'
          );
          setInitialMetrics(metricItems);

          // line / bar / pie items for GraphDisplay
          const chartCandidates = data.graphs.filter(
            (m) => m.metric_type === 'line' || m.metric_type === 'bar' || m.metric_type === 'pie'
          );
          setInitialGraphs(convertMetricsToGraphs(chartCandidates));
        }
      } catch (error) {
        console.error('Error fetching insight data:', error);
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
