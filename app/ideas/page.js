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
  
  // Cache duration: 5 minutes in milliseconds
  const CACHE_DURATION = 5 * 60 * 1000;
  
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const insightId = searchParams.get('insight');
        console.log('🔍 Processing ideas request for:', { userId, insightId });
        
        setIsInitialRender(false);
        
        if (!userId || !insightId) {
          console.log('⚠️ Missing required parameters, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Check cache first
        const cacheKey = `ideas_cache_${insightId}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const { data: cachedIdeas, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            const loadStart = performance.now();
            console.log('🔄 Loading ideas from cache...');
            
            setIdeasData(cachedIdeas);
            
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
        console.log('🔄 Starting API call to fetch ideas...');
        
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
        const apiEnd = performance.now();
        console.log(`✅ API call completed in ${((apiEnd - apiStart) / 1000).toFixed(2)} seconds`);
        
        // Process and merge ideas
        setIdeasData((prev) => {
          const newData = !prev ? data : {
            ...prev,
            description: data.description || prev.description,
            ideas: [...(prev.ideas || [])].concat(
              data.ideas.filter(newIdea => 
                !prev.ideas.some(oldIdea => oldIdea.idea_id === newIdea.idea_id)
              )
            )
          };

          // Cache the merged data
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: newData,
              timestamp: Date.now()
            }));
            console.log('💾 Ideas data cached successfully');
          } catch (error) {
            console.error('❌ Error caching ideas:', error);
          }

          return newData;
        });

      } catch (error) {
        console.error('❌ Error fetching ideas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIdeas();
  }, [userId, searchParams, router]);

  // ADDED: Render skeleton content function
  const renderSkeletonContent = () => {
    return (
      <div className={styles.content}>
        <section className={styles.problemSection}>
          <h2 className={styles.sectionTitle}>Problem statement</h2>
          <div className={`${styles.problemStatement} ${styles.skeletonProblemStatement}`}>
            <div className={styles.skeletonText}></div>
            <div className={styles.skeletonText}></div>
            <div className={styles.skeletonText} style={{ width: '70%' }}></div>
          </div>
        </section>
        
        <section className={styles.hypothesisSection}>
          <div className={styles.hypothesisHeader}>
            <h2 className={styles.sectionTitle}>Hypothesis</h2>
            <HelpCircle className={styles.questionIcon} size={30} />
          </div>
          
          <div className={styles.ideasContainer}>
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className={`${styles.skeletonCard}`}>
                <div className={styles.glassEffect}>
                  <div className={styles.content}>
                    <div className={`${styles.skeletonIdeaLabel}`}>
                      <div className={styles.skeletonBulb}></div>
                      <div className={styles.skeletonLabelText}></div>
                    </div>
                    <div className={styles.skeletonDescription}></div>
                    <div className={styles.skeletonButton}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          {/* UPDATED: Show skeleton content when loading */}
          {isInitialRender || loading ? (
            renderSkeletonContent()
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
          )}
        </main>
      </div>
    </div>
  );
}