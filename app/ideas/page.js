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
import LoadingAnimation from '../components/common/LoadingAnimation';

export default function IdeasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ideasData, setIdeasData] = useState(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const insightId = searchParams.get('insight');
        if (!userId || !insightId) {
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

        // NEW: Merge any new ideas with existing ideas (no duplicates)
        setIdeasData((prev) => {
          // If there's no previous data, just use the new data
          if (!prev) {
            return data;
          }

          // Otherwise, merge old ideas with new ones
          const mergedIdeas = [...(prev.ideas || [])];
          data.ideas.forEach(newIdea => {
            // Check if this new idea already exists
            const alreadyExists = mergedIdeas.some(
              oldIdea => oldIdea.idea_id === newIdea.idea_id
            );
            // If it's truly new, push it in
            if (!alreadyExists) {
              mergedIdeas.push(newIdea);
            }
          });

          return {
            ...prev,
            // (Optional) update the problem statement if needed
            description: data.description || prev.description,
            // Use the merged ideas list
            ideas: mergedIdeas
          };
        });

      } catch (error) {
        console.error('Error fetching ideas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, [userId, searchParams, router]);

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          {loading ? (
             <main className={styles.mainContent}>
             <LoadingAnimation />
         </main>
          ) : (
            <div className={styles.content}>
              <section className={styles.problemSection}>
                <h2 className={styles.sectionTitle}>Problem statement</h2>
                <div className={styles.problemStatement}>
                  {ideasData?.description || 'No problem statement available'}
                </div>
              </section>

              <section className={styles.hypothesisSection}>
                <div className={styles.hypothesisHeader}>
                  <h2 className={styles.sectionTitle}>Hypothesis</h2>
                  <HelpCircle className={styles.questionIcon} size={30} />
                </div>
                <div className={styles.ideasContainer}>
                {ideasData?.ideas?.map((idea, index) => (  // Added index parameter
  <IdeaCard
    key={idea.idea_id}
    number={index + 1}  // Using index+1 for sequential numbering
    description={idea.description}
    ideaId={idea.idea_id}
    insightId={idea.insight_id}
  />
))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
