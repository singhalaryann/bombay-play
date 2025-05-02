"use client";
import React, { useState, useEffect } from "react";
import styles from "../../styles/Dashboard.module.css";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import TabFilter from "../components/dashboard/TabFilter";
import InsightCard from "../components/dashboard/InsightCard";
import DashboardTabs from "../components/dashboard/DashboardTabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// Import your separate ExperimentContent component
import ExperimentContent from "../components/dashboard/ExperimentContent";

export default function Dashboard() {
  const router = useRouter();
  const { userId } = useAuth();

  // State management
  const [selectedTime, setSelectedTime] = useState("30D");
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );
  
  // State for between format date filter (used by Overview metrics)
  const [apiDateFilter, setApiDateFilter] = useState({ 
    type: "between", 
    start_date: "", 
    end_date: "" 
  });
  
  // State for global format date filter (used by other components like Insights)
  const [globalDateFilter, setGlobalDateFilter] = useState({ 
    type: "last", 
    days: 30 
  });
  
  // State variables for progressive loading
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Fixed game ID for insights as provided
  const GAME_ID = "ludogoldrush";

  // Cache duration in milliseconds (e.g., 5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Define the data limit date
  const DATA_LIMIT_DATE = new Date('2025-04-03'); // April 3, 2025

  // Helper to format dates for API (DD-MM-YYYY format)
  const formatApiDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateStr);
        return '';
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  // Convert selectedTime to API date filter format (between format for Overview)
  useEffect(() => {
    console.log('Dashboard - Time filter changed to:', selectedTime);
    
    if (!selectedTime) {
      console.log('Dashboard - No selectedTime provided');
      return;
    }
    
    let endDate, startDate;
    const today = new Date();

    // Check if the selectedTime includes a date range (from TabFilter's custom date)
    if (selectedTime.includes(" - ")) {
      const [startStr, endStr] = selectedTime.split(" - ");
      const parsedEndDate = new Date(endStr.trim());
      
      // If selected end date is after data limit, use Apr 2-3 range
      if (parsedEndDate > DATA_LIMIT_DATE) {
        console.log('Dashboard - Using fixed Apr 2-3 range due to data limit');
        endDate = new Date('2025-04-03');
        startDate = new Date('2025-04-02');
      } else {
        // Otherwise use the selected range, but ensure start date is end date - 1
        endDate = parsedEndDate;
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 1);
      }
    } 
    // Handle "Since" date format
    else if (selectedTime.startsWith("Since ")) {
      const sinceStr = selectedTime.replace("Since ", "");
      const sinceDate = new Date(sinceStr);
      
      // If since date is after data limit, use Apr 2-3 range
      if (sinceDate > DATA_LIMIT_DATE) {
        console.log('Dashboard - Using fixed Apr 2-3 range due to data limit');
        endDate = new Date('2025-04-03');
        startDate = new Date('2025-04-02');
      } else {
        // Otherwise use today as end date and ensure start date is end date - 1
        endDate = today < DATA_LIMIT_DATE ? today : DATA_LIMIT_DATE;
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 1);
      }
    }
    // Handle "Last X days" format
    else if (selectedTime.startsWith("Last ")) {
      const daysText = selectedTime.replace("Last ", "").replace(" days", "");
      const days = parseInt(daysText);
      
      if (!isNaN(days)) {
        endDate = today < DATA_LIMIT_DATE ? today : DATA_LIMIT_DATE;
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 1);
      } else {
        console.log('Dashboard - Invalid days value, using default');
        endDate = today < DATA_LIMIT_DATE ? today : DATA_LIMIT_DATE;
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 1);
      }
    }
    // Handle preset values (Today, Yesterday, 7D, 30D, etc.)
    else {
      // For all preset values, ensure we don't exceed data limit
      const maxEndDate = today < DATA_LIMIT_DATE ? today : DATA_LIMIT_DATE;
      
      switch(selectedTime) {
        case "Today":
          endDate = maxEndDate;
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 1);
          break;
        case "Yesterday":
          endDate = new Date(maxEndDate);
          endDate.setDate(maxEndDate.getDate() - 1);
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 1);
          break;
        case "7D":
        case "30D":
        case "3M":
        case "6M":
        case "12M":
          // All these presets should use the same logic - end date is today/max date
          // and start date is end date - 1
          endDate = maxEndDate;
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 1);
          break;
        default:
          console.log('Dashboard - Unknown time filter, using default');
          endDate = maxEndDate;
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 1);
      }
    }
    
    // Format dates for API
    const formattedStartDate = formatApiDate(startDate);
    const formattedEndDate = formatApiDate(endDate);
    
    // Create the between format for API
    const newApiDateFilter = {
      type: "between",
      start_date: formattedStartDate,
      end_date: formattedEndDate
    };
    
    console.log('Dashboard - Converted to API date filter:', newApiDateFilter);
    setApiDateFilter(newApiDateFilter);
    
  }, [selectedTime]);

  // Load cached data from localStorage on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        setIsInitialRender(false); // Mark initial render as complete
        
        // Check for cached insights data
        const cachedInsightsData = localStorage.getItem(`dashboard_insights_cache_${userId}`);
        
        let shouldFetchInsights = true;
        
        // Check if we have valid cached insights data
        if (cachedInsightsData) {
          const parsedCache = JSON.parse(cachedInsightsData);
          if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
            setInsights(parsedCache.data);
            setInsightsLoading(false);
            shouldFetchInsights = false;
            console.log('Loading insights from cache');
          }
        }
        
        // If we have insights from cache, set overall loading to false
        if (!shouldFetchInsights) {
          setLoading(false);
        }
        
        return { shouldFetchInsights };
      } catch (error) {
        console.error('Error loading cache:', error);
        return { shouldFetchInsights: true };
      }
    };

    if (userId) {
      const { shouldFetchInsights } = loadCachedData();
      
      // Fetch insights only if needed
      if (shouldFetchInsights) {
        fetchInsightsData();
      }
    }
  }, [userId]);

  // Function to fetch insights data independently with game_id
  const fetchInsightsData = async () => {
    // Check cache first
    const cachedInsightsData = localStorage.getItem(`dashboard_insights_cache_${userId}`);
    if (cachedInsightsData) {
      const parsedCache = JSON.parse(cachedInsightsData);
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        console.log('Loading insights from cache');
        setInsights(parsedCache.data);
        setInsightsLoading(false);
        return;
      }
    }

    try {
      setInsightsLoading(true);
      
      console.log('Fetching insights data with game_id:', GAME_ID);

      // API call to get-insights endpoint with game_id and date filter
      const response = await fetch(
        "https://get-insights-nrosabqhla-uc.a.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            game_id: GAME_ID,
            date_filter: globalDateFilter
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Process insights data - extract insights from detailed_insights_by_lens
      if (data.insights && data.insights.length > 0) {
        console.log('Received insights data:', data.insights);
        
        // Transform the data to extract just the insights we need
        const processedInsights = [];
        
        data.insights.forEach(insightItem => {
          if (insightItem.insight_payload && 
              insightItem.insight_payload.detailed_insights_by_lens) {
            
            insightItem.insight_payload.detailed_insights_by_lens.forEach(lens => {
              if (lens.insight) {
                processedInsights.push({
                  insight_id: insightItem.insight_id,
                  insight_text: lens.insight
                });
              }
            });
          }
        });
        
        console.log('Processed insights:', processedInsights);
        setInsights(processedInsights);
        
        // Cache insights data
        localStorage.setItem(`dashboard_insights_cache_${userId}`, JSON.stringify({
          data: processedInsights,
          timestamp: Date.now()
        }));
      } else {
        console.log('No insights data found in the response');
        setInsights([]);
      }
      
      setInsightsLoading(false);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching insights data:', error);
      setInsights([]);
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

  // Add effect to fetch insights when tab changes to insights
  useEffect(() => {
    if (activeTab === "insights") {
      fetchInsightsData();
    }
  }, [activeTab, globalDateFilter]);

 // FIXED: Added 'static' flag by using React.useCallback
const handleTabChange = React.useCallback((tab) => {
  setActiveTab(tab);
  // Update URL without full page reload
  router.push(`/dashboard?tab=${tab}`, { shallow: true });
}, [router]); // Added dependency array

  // Effect to handle authentication only
  useEffect(() => {
    if (!userId) {
      router.push("/");
    }
  }, [userId, router]);

  // Handle time filter changes - Update both date filter formats
  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
    
    // Create global format date filter based on selection
    let newGlobalDateFilter;
    
    if (newTime === "Today") {
      newGlobalDateFilter = { type: "last", days: 0 };
    } else if (newTime === "Yesterday") {
      newGlobalDateFilter = { type: "last", days: 1 };
    } else if (newTime === "7D") {
      newGlobalDateFilter = { type: "last", days: 7 };
    } else if (newTime === "30D") {
      newGlobalDateFilter = { type: "last", days: 30 };
    } else if (newTime === "3M") {
      newGlobalDateFilter = { type: "last", days: 90 };
    } else if (newTime === "6M") {
      newGlobalDateFilter = { type: "last", days: 180 };
    } else if (newTime === "12M") {
      newGlobalDateFilter = { type: "last", days: 365 };
    } else if (newTime.includes(" - ")) {
      // Parse date range like "Apr 1, 2025 - Apr 15, 2025"
      const [start, end] = newTime.split(" - ");
      newGlobalDateFilter = { 
        type: "between", 
        start_date: formatApiDate(start.trim()),
        end_date: formatApiDate(end.trim())
      };
    } else if (newTime.startsWith("Since ")) {
      // Parse "Since Apr 1, 2025"
      const sinceDate = newTime.replace("Since ", "").trim();
      newGlobalDateFilter = { 
        type: "since", 
        start_date: formatApiDate(sinceDate)
      };
    } else if (newTime.startsWith("Last ")) {
      // Parse "Last 45 days"
      const daysText = newTime.replace("Last ", "").replace(" days", "").trim();
      const days = parseInt(daysText);
      if (!isNaN(days)) {
        newGlobalDateFilter = { type: "last", days: days };
      } else {
        newGlobalDateFilter = { type: "last", days: 30 }; // Default
      }
    } else {
      newGlobalDateFilter = { type: "last", days: 30 }; // Default
    }
    
    console.log('Dashboard - Set global date filter:', newGlobalDateFilter);
    setGlobalDateFilter(newGlobalDateFilter);
  };

  // Skeleton loading for insights
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

  // Render insights section with progressive loading
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
              key={`${insight.insight_id || index}-${index}`}
              description={insight.insight_text || "No description available"}
              insight_id={insight.insight_id || `insight-${index}`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render insights content 
  const renderInsightsContent = () => {
    // Show loading indicator for initial load only
    if (loading && isInitialRender) {
      return (
        <>
          {renderSkeletonInsights()}
        </>
      );
    }

    // Otherwise render insights section with its own loading state
    return (
      <>
        {renderInsights()}
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
                selectedTime={selectedTime}
                apiDateFilter={apiDateFilter}
              >
                {activeTab === "insights" && (
                  <>
                    {renderInsightsContent()}
                  </>
                )}
              </DashboardTabs>
            </div>
            <div className={styles.filterContainer}>
              <TabFilter 
                selected={selectedTime} 
                onChange={handleTimeChange} 
                disabled={activeTab !== "overview"}
                readOnly={activeTab === "insights"}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
