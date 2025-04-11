"use client";
import React, { useState, useEffect } from "react";
import styles from "../../styles/Dashboard.module.css";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import TabFilter from "../components/dashboard/TabFilter";
import MetricCard from "../components/dashboard/MetricCard";
import InsightCard from "../components/dashboard/InsightCard";
import DashboardTabs from "../components/dashboard/DashboardTabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// Import your separate ExperimentContent component
import ExperimentContent from "../components/dashboard/ExperimentContent";
import LoadingAnimation from "../components/common/LoadingAnimation";

export default function Dashboard() {
  const router = useRouter();
  const { userId } = useAuth();

  // State management
  const [selectedTime, setSelectedTime] = useState("Today");
  const [metrics, setMetrics] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState({});
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "insights"
  );

  // Cache duration in milliseconds (e.g., 5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Load cached data from localStorage on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedData = localStorage.getItem(`dashboard_cache_${userId}`);
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          setCache(parsedCache);
          
          // If we have cached data for the current time, use it immediately
          if (parsedCache[selectedTime] && 
              Date.now() - parsedCache[selectedTime].timestamp < CACHE_DURATION) {
            const { metrics: cachedMetrics, insights: cachedInsights } = parsedCache[selectedTime].data;
            setMetrics(cachedMetrics);
            setInsights(cachedInsights);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };

    loadCachedData();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async (time) => {
    // Check cache first
    if (cache[time] && Date.now() - cache[time].timestamp < CACHE_DURATION) {
      const { metrics: cachedMetrics, insights: cachedInsights } = cache[time].data;
      console.log('Loading from cache for time:', time, {
        metrics: cachedMetrics,
        insights: cachedInsights
      });
      setMetrics(cachedMetrics);
      setInsights(cachedInsights);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Fetching dashboard data with params:', {
        user_id: userId,
        time: time,
      });

      const response = await fetch(
        "https://dashboard-q54hzgyghq-uc.a.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            time: time,
          }),
        }
      );

      const data = await response.json();
      console.log('API Response Data:', {
        metrics: data.metrics,
        insights: data.insights,
        fullResponse: data
      });
      
      if (data) {
        const newMetrics = data.metrics || [];
        const newInsights = data.insights || [];
        
        setMetrics(newMetrics);
        setInsights(newInsights);

        // Update cache
        const newCache = {
          ...cache,
          [time]: {
            data: { metrics: newMetrics, insights: newInsights },
            timestamp: Date.now()
          }
        };
        setCache(newCache);

        // Update localStorage
        try {
          localStorage.setItem(`dashboard_cache_${userId}`, JSON.stringify(newCache));
        } catch (error) {
          console.error('Error saving to cache:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setMetrics([]);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  // Add effect to handle URL param changes
  useEffect(() => {
    // Update active tab when URL params change
    const tabParam = searchParams.get("tab");
    if (tabParam && ["insights", "experiments"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL without full page reload
    router.push(`/dashboard?tab=${tab}`, { shallow: true });
  };

  // Effect to handle data fetching and authentication
  useEffect(() => {
    if (!userId) {
      router.push("/");
      return;
    }
    fetchDashboardData(selectedTime);
  }, [userId, selectedTime]);

  // Handle time filter changes
  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
  };

  // Render skeleton insights
  const renderSkeletonContent = () => (
    <>
      <div className={styles.insightsSection}>
        <div className={styles.insightsList}>
          {[1, 2, 3].map((index) => (
            <div key={index} className={`${styles.insightCard} ${styles.skeletonInsight}`}>
              <div className={styles.skeletonInsightContent}></div>
              <div className={styles.skeletonInsightButton}></div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.metricsGrid}>
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className={`${styles.metricCard} ${styles.skeletonMetric}`}>
            <div className={styles.skeletonMetricHeader}>
              <div className={styles.skeletonMetricTitle}></div>
              <div className={styles.skeletonMetricIcon}></div>
            </div>
            <div className={styles.skeletonMetricValue}></div>
            <div className={styles.skeletonMetricSubtitle}></div>
          </div>
        ))}
      </div>
    </>
  );

  // Render insights section content
  const renderInsightsContent = () => {
    // Show skeleton content while loading
    if (loading) {
      return renderSkeletonContent();
    }

    return (
      <>
        {insights.length > 0 ? (
          <div className={styles.insightsSection}>
            <div className={styles.insightsList}>
              {insights.map((insight, index) => (
                <InsightCard
                  key={`${insight.insight_id || index}`}
                  description={insight.description || "No description available"}
                  insight_id={insight.insight_id || `insight-${index}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.noData}>No insights available</div>
        )}
        <div className={styles.metricsGrid}>
          {metrics.length > 0 ? (
            metrics.map((metric, index) => (
              <MetricCard 
                key={`${metric.name || index}`} 
                name={metric.name || "Unnamed Metric"}
                value={metric.value !== undefined ? metric.value : "N/A"}
                change={metric.change !== undefined ? metric.change : 0}
                description={metric.description || ""}
              />
            ))
          ) : (
            <div className={styles.noData}>No metrics available</div>
          )}
        </div>
      </>
    );
  };

  // Main render
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.filterSection}>
            <div className={styles.tabsContainer}>
              <DashboardTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                experimentContent={<ExperimentContent userId={userId} />}
              >
                {renderInsightsContent()}
              </DashboardTabs>
            </div>
            <div className={styles.filterContainer}>
              <TabFilter 
                selected={selectedTime} 
                onChange={handleTimeChange} 
                disabled={loading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}