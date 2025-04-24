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
  
  // ADDED: New state variables for progressive loading
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Cache duration in milliseconds (e.g., 5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Load cached data from localStorage on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        setIsInitialRender(false); // ADDED: Mark initial render as complete
        
        const cachedData = localStorage.getItem(`dashboard_cache_${userId}`);
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          setCache(parsedCache);
          
          // If we have cached data for the current time, use it immediately
          if (parsedCache[selectedTime] && 
              Date.now() - parsedCache[selectedTime].timestamp < CACHE_DURATION) {
            const { metrics: cachedMetrics, insights: cachedInsights } = parsedCache[selectedTime].data;
            console.log('Loading from cache for time:', selectedTime);
            
            // CHANGED: Set metrics and insights separately to enable progressive loading
            setMetrics(cachedMetrics);
            setInsights(cachedInsights);
            
            // CHANGED: Set loading states to false
            setMetricsLoading(false);
            setInsightsLoading(false);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };

    if (userId) {
      loadCachedData();
    }
  }, [userId, selectedTime]);

  // CHANGED: Fetch dashboard data progressively
  const fetchDashboardData = async (time) => {
    // Check cache first (same as before)
    if (cache[time] && Date.now() - cache[time].timestamp < CACHE_DURATION) {
      const { metrics: cachedMetrics, insights: cachedInsights } = cache[time].data;
      console.log('Loading from cache for time:', time);
      setMetrics(cachedMetrics);
      setInsights(cachedInsights);
      
      // CHANGED: Update loading states
      setMetricsLoading(false);
      setInsightsLoading(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMetricsLoading(true);
      setInsightsLoading(true);
      
      // CHANGED: Clear previous data when loading new data
      setMetrics([]);
      setInsights([]);
      
      console.log('Fetching dashboard data with params:', {
        user_id: userId,
        time: time,
      });

      // CHANGED: Split API fetch into a single request but handle data progressively
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

      const reader = response.body.getReader();
      let receivedData = '';
      
      // CHANGED: Set loading to false earlier to show UI immediately
      setLoading(false);
      
      // Start processing the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Convert the binary chunk to a string and append it
        receivedData += new TextDecoder().decode(value);
        
        try {
          // Try to parse the data we have so far
          // This may fail if we've only received a partial JSON object
          const partialData = JSON.parse(receivedData);
          
          // Process metrics as they arrive
          if (partialData.metrics) {
            console.log('Received metrics data:', partialData.metrics);
            setMetrics(partialData.metrics);
            setMetricsLoading(false);
          }
          
          // Process insights as they arrive
          if (partialData.insights) {
            console.log('Received insights data:', partialData.insights);
            setInsights(partialData.insights);
            setInsightsLoading(false);
          }
          
          // Update cache with the data we have so far
          const newCache = {
            ...cache,
            [time]: {
              data: { 
                metrics: partialData.metrics || [], 
                insights: partialData.insights || [] 
              },
              timestamp: Date.now()
            }
          };
          setCache(newCache);
          
          // Store in localStorage
          try {
            localStorage.setItem(`dashboard_cache_${userId}`, JSON.stringify(newCache));
            console.log('Data cached successfully');
          } catch (cacheError) {
            console.error('Error caching dashboard data:', cacheError);
          }
        } catch (parseError) {
          // If we can't parse the JSON yet, just continue reading
          console.log('Received partial data, continuing to read...');
        }
      }
      
      // Ensure loading states are set to false when complete
      setMetricsLoading(false);
      setInsightsLoading(false);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setMetrics([]);
      setInsights([]);
      // CHANGED: Update loading states even on error
      setMetricsLoading(false);
      setInsightsLoading(false);
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

  // CHANGED: Updated skeleton loading to show progressive loading states
  const renderSkeletonInsights = () => (
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
  );

  // CHANGED: Separate skeleton for metrics
  const renderSkeletonMetrics = () => (
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
  );

  // CHANGED: Render insights section with progressive loading
  const renderInsights = () => {
    if (isInitialRender) {
      return renderSkeletonInsights();
    }
    
    if (insightsLoading) {
      return renderSkeletonInsights();
    }

    if (insights.length === 0) {
      return <div className={styles.noData}>No insights available</div>;
    }

    return (
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
    );
  };

  // CHANGED: Render metrics section with progressive loading
  const renderMetrics = () => {
    if (isInitialRender) {
      return renderSkeletonMetrics();
    }
    
    if (metricsLoading) {
      return renderSkeletonMetrics();
    }

    if (metrics.length === 0) {
      return <div className={styles.noData}>No metrics available</div>;
    }

    return (
      <div className={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <MetricCard 
            key={`${metric.name || index}`} 
            name={metric.name || "Unnamed Metric"}
            value={metric.value !== undefined ? metric.value : "N/A"}
            change={metric.change !== undefined ? metric.change : 0}
            description={metric.description || ""}
          />
        ))}
      </div>
    );
  };

  // CHANGED: Render insights content combining both sections
  const renderInsightsContent = () => {
    // CHANGED: Show loading indicator for initial load only
    if (loading && isInitialRender) {
      return (
        <>
          {renderSkeletonInsights()}
          {renderSkeletonMetrics()}
        </>
      );
    }

    // CHANGED: Otherwise render each section with its own loading state
    return (
      <>
        {renderInsights()}
        {renderMetrics()}
        
        {/* ADDED: Progressively loading indicator */}
        {(metricsLoading || insightsLoading) && !isInitialRender && (
          <div className={styles.progressiveLoadingIndicator}>
            Loading more data...
          </div>
        )}
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
                // CHANGED: Only disable during initial loading
                disabled={loading && isInitialRender}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}