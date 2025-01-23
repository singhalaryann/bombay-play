'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ChatInterface from '../components/analysis/ChatInterface';
import MetricsDisplay from '../components/analysis/MetricsDisplay';
import GraphDisplay from '../components/analysis/GraphDisplay';
import styles from '../../styles/Analysis.module.css';

// Helper function to transform the API metrics into the shape GraphDisplay expects
function convertMetricsToGraphs(metrics) {
  // Simply copy all the relevant fields and rename them properly
  return metrics.map((m) => {
    return {
      metric_type: m.metric_type, // GraphDisplay checks this to decide chart type
      metric_id: m.metric_id,
      title: m.title,
      columns: m.columns,
      values: m.values,
      // Extra fields for completeness
      x_unit: '',
      y_unit: '',
      value_unit: ''
    };
  });
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for dynamic metrics and graphs
  const [dynamicMetrics, setDynamicMetrics] = useState([]);
  const [dynamicGraphs, setDynamicGraphs] = useState([]);

  // Handlers to update metrics and graphs
  const handleMetricsUpdate = (newMetrics) => {
    console.log('Setting new metrics:', newMetrics);

    // Keep only the "metric" ones for MetricsDisplay
    const filteredMetrics = newMetrics.filter(
      (m) => m.metric_type === 'metric'
    );
    setDynamicMetrics(filteredMetrics); // Replace entirely

    // Convert any line/bar/pie metrics into graph objects
    const graphCandidates = newMetrics.filter(
      (m) =>
        m.metric_type === 'line' ||
        m.metric_type === 'bar' ||
        m.metric_type === 'pie' ||
        m.metric_type === 'hist'
    );
    const newGraphs = convertMetricsToGraphs(graphCandidates);

    // Reset and set the new graphsi 
    setDynamicGraphs(newGraphs);
  };

  const handleGraphsUpdate = (newGraphs) => {
    console.log('Updating graphs:', newGraphs);
    setDynamicGraphs((prevGraphs) => [...prevGraphs, ...newGraphs]);
  };

  // Fetch the initial chat data
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        // const ideaId = searchParams.get('idea');
        // const insightId = searchParams.get('insight');
        const chatId = searchParams.get('chat');

        console.log('Fetching chat data with:', { userId, chatId });

        if (!userId || !chatId) {
          throw new Error('Missing required parameters');
        }

        const response = await fetch('https://get-chat-q54hzgyghq-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            // insight_id: insightId,
            // idea_id: ideaId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat data');
        }

        const data = await response.json();
        console.log('Received chat data:', data);
        setChatData(data);

      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchChatData();
    }
  }, [userId, searchParams]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.mainLayout}>
          <Sidebar />
          <main className={styles.mainContent}>
            <div className={styles.loadingWrapper}>
              <div className={styles.loading}>Loading...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.mainLayout}>
          <Sidebar />
          <div className={styles.errorWrapper}>
            <div className={styles.error}>Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Convert the initial chatData.metrics (line/bar/pie) to graph format
  let initialGraphs = [];
  if (chatData?.metrics) {
    const graphCandidates = chatData.metrics.filter(
      (m) =>
        m.metric_type === 'line' ||
        m.metric_type === 'bar' ||
        m.metric_type === 'pie' ||
        m.metric_type === 'hist'
    );
    initialGraphs = convertMetricsToGraphs(graphCandidates);
  }

  // ------------------------------ NEW LOGIC TO AVOID DUPLICATE METRIC KEYS ------------------------------
  // We merge the original metrics with the dynamic metrics, replacing any duplicates by metric_id
  const combinedMetrics = (() => {
    const originalMetrics = chatData?.metrics || [];
    const combined = [...originalMetrics];

    dynamicMetrics.forEach((newMetric) => {
      const existingIndex = combined.findIndex(
        (m) => m.metric_id === newMetric.metric_id
      );
      if (existingIndex >= 0) {
        // Replace existing metric with the updated one
        combined[existingIndex] = newMetric;
      } else {
        // Otherwise just add it
        combined.push(newMetric);
      }
    });
    return combined;
  })();
  // ------------------------------------------------------------------------------------------------------

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.content}>
            {/* <section className={styles.problemSection}> */}
              {/* <h2 className={styles.sectionTitle}>Problem statement</h2> */}
              {/* <div className={styles.problemStatement}> */}
                {/* {chatData?.insight_description || 'No insight available'} */}
              {/* </div> */}
            {/* </section> */}

            <div className={styles.contentLayout}>
              <div className={styles.leftPanel}>
                <div className={styles.chatSection}>
                  <ChatInterface
                    messages={chatData?.chat || []}
                    ideaId={searchParams.get('idea')}
                    insightId={searchParams.get('insight')}
                    userId={userId}
                    chatId={searchParams.get('chat')}
                    ideaDescription={chatData?.idea_description}
                    onMetricsUpdate={handleMetricsUpdate}
                    onGraphsUpdate={handleGraphsUpdate}
                  />
                </div>
              </div>

              <div className={styles.rightPanel}>
                {/* Combine initial + dynamic metrics (in case user updates them) */}
                <MetricsDisplay
                  // metrics={combinedMetrics}
                  metrics={combinedMetrics?.filter(m => m.metric_type === 'metric' && m.values?.length === 1)}
                />

                {/* If chatData already has any existing graphs, show them.
                    Otherwise, show the ones we built from metric transformation,
                    plus anything dynamic. */}
                <GraphDisplay
                  graphs={
                    chatData?.graphs?.length > 0
                      ? chatData.graphs
                      : [...initialGraphs, ...dynamicGraphs]
                  }
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
