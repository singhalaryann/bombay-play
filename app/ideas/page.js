// app/ideas/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import IdeaCard from '../components/ideas/IdeaCard';
import styles from '../../styles/Ideas.module.css';
import { HelpCircle } from 'lucide-react';

export default function IdeasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ideasData, setIdeasData] = useState(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const insightId = searchParams.get('id');
        console.log('Fetching ideas data for:', { userId, insightId });

        if (!userId || !insightId) {
          console.log('Missing parameters, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        const response = await fetch('https://get-ideas-q54hzgyghq-uc.a.run.app', {
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
        console.log('Ideas data received:', data);
        setIdeasData(data);
      } catch (error) {
        console.error('Error fetching ideas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [userId, searchParams, router]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.glassEffect}>
            <section className={styles.problemSection}>
              <h2 className={styles.sectionTitle}>Problem statement</h2>
              <div className={styles.problemStatement}>
                {ideasData?.description || 'No problem statement available'}
              </div>
            </section>

            <section className={styles.hypothesisSection}>
              <div className={styles.hypothesisHeader}>
                <h2 className={styles.sectionTitle}>Hypothesis</h2>
                <HelpCircle className={styles.questionIcon} size={20} />
              </div>
              
              <div className={styles.ideasContainer}>
                {ideasData?.ideas?.map((idea, index) => (
                  <IdeaCard
                    key={idea.idea_id}
                    number={index + 1}
                    description={idea.description}
                    ideaId={idea.idea_id}
                    insightId={idea.insight_id}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}