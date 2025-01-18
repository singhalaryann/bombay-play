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

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Added state for dynamic metrics and graphs
const [dynamicMetrics, setDynamicMetrics] = useState([]);
const [dynamicGraphs, setDynamicGraphs] = useState([]);

// Add these handlers
const handleMetricsUpdate = (newMetrics) => {
  console.log('Setting new metrics:', newMetrics);
  setDynamicMetrics(newMetrics); // Replace entirely, don't append
  // Clear previous graphs when metrics update
  setDynamicGraphs([]);
};
const handleGraphsUpdate = (newGraphs) => {
  console.log('Updating graphs:', newGraphs);
  setDynamicGraphs(prevGraphs => [...prevGraphs, ...newGraphs]);
};

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const ideaId = searchParams.get('idea');
        const insightId = searchParams.get('insight');
        const chatId = searchParams.get('chat'); // New: Get chat_id from URL
        
        console.log('Fetching chat data with:', { userId, insightId, ideaId, chatId }); // Added chatId to logging
        
        if (!userId || !insightId || !ideaId || !chatId) { // Added chatId check
          throw new Error('Missing required parameters');
        }
    
        const response = await fetch('https://get-chat-q54hzgyghq-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,     // New: Added chat_id
            insight_id: insightId,
            idea_id: ideaId
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

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <section className={styles.problemSection}>
              <h2 className={styles.sectionTitle}>Problem statement</h2>
              <div className={styles.problemStatement}>
                {chatData?.insight_description || 'No insight available'}
              </div>
            </section>

            <div className={styles.contentLayout}>
              <div className={styles.leftPanel}>
                <div className={styles.chatSection}>
                <ChatInterface
  messages={chatData?.chat?.messages || []}
  ideaId={searchParams.get('idea')}
  insightId={searchParams.get('insight')}
  userId={userId}
  chatId={searchParams.get('chat')} // Added chatId
  ideaDescription={chatData?.idea_description}
  onMetricsUpdate={handleMetricsUpdate} // Added metrics handler
  onGraphsUpdate={handleGraphsUpdate}   // Added graphs handler
/>
                </div>
              </div>
              <div className={styles.rightPanel}>
  {/* Pass both initial and dynamic metrics/graphs */}
  <MetricsDisplay metrics={[...(chatData?.metrics || []), ...dynamicMetrics]} />
  <GraphDisplay graphs={chatData?.graphs?.length > 0 ? chatData.graphs : dynamicGraphs} />
</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}