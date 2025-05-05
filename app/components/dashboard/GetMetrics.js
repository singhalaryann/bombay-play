"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/GetMetrics.module.css";
import GraphDisplay from "../analysis/GraphDisplay";
import { useAuth } from "../../context/AuthContext";

// UPDATED: Added new props for prefetchedData and isDataLoading
const GetMetrics = ({ 
  selectedTime, 
  onTimeChange, 
  specificMetric = null, 
  specificMetricType = null, 
  readOnly = false,
  initialDateFilter = null,
  hideSkeletons = false,
  userIds = [],
  prefetchedData = null, // ADDED: New prop to accept pre-fetched metric data
  isDataLoading = false  // ADDED: New prop to indicate if parent is loading data
}) => {
  const { userId } = useAuth();
  
  // State for storing graph data received from API
  const [graphData, setGraphData] = useState([]);
  // Loading state to show skeleton while fetching data
  // UPDATED: Initialize isLoading based on isDataLoading prop
  const [isLoading, setIsLoading] = useState(isDataLoading !== false);
  // Error state to display error messages if API call fails
  const [error, setError] = useState(null);
  // UPDATED: Use initialDateFilter if provided, otherwise default to 30 days
  const [dateFilter, setDateFilter] = useState(initialDateFilter || { type: "last", days: 30 });
  // ADDED: State for storing metric knowledge data
  const [metricKnowledge, setMetricKnowledge] = useState({});
  
  // Cache duration: 5 minutes in milliseconds
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // UPDATED: List of metrics to request from the API - if specificMetric is provided, only request that metric
  const metricsToRequest = specificMetric 
    ? [specificMetric] 
    : [
      "dau",
      "wau", 
      "mau", 
      "rolling_retention", 
      "total_sessions_each_day", 
      "avg_sessions_per_day", 
      "session_distribution_by_hour", 
      "avg_session_length", 
      // "adaptive_session_length", 
      // "geographical_breakdown", 
      // "device_os_distribution",
      "session_length_distribution",
      // "d1_retention"
    ];

  // Game ID constant (same as used in Dashboard for insights)
  const GAME_ID = "ludogoldrush";

  // FIXED: Reset dateFilter when selectedTime or specificMetric changes
  useEffect(() => {
    // If initialDateFilter is provided and changes, use it directly
    if (initialDateFilter) {
      console.log('GetMetrics - Using updated initialDateFilter:', initialDateFilter);
      setDateFilter(initialDateFilter); // ADDED: Directly update dateFilter when initialDateFilter changes
      return;
    }
    console.log('GetMetrics - Time filter changed to:', selectedTime);
    console.log('GetMetrics - For specific metric:', specificMetric);
    
    // FIXED: Only set a new dateFilter if selectedTime actually changes
    if (!selectedTime) {
      console.log('GetMetrics - No selectedTime provided, skipping filter update');
      return;
    }
    
    // Convert UI time filter to API date_filter format
    let apiDateFilter = { type: "last", days: 30 }; // Default
    
    switch(selectedTime) {
      case "Today":
        apiDateFilter = { type: "last", days: 0 };
        break;
      case "Yesterday":
        apiDateFilter = { type: "last", days: 1 };
        break;
      case "7D":
        apiDateFilter = { type: "last", days: 7 };
        break;
      case "30D":
        apiDateFilter = { type: "last", days: 30 };
        break;
      case "3M":
        apiDateFilter = { type: "last", days: 90 };
        break;
      case "6M":
        apiDateFilter = { type: "last", days: 180 };
        break;
      case "12M":
        apiDateFilter = { type: "last", days: 365 };
        break;
      default:
        // Handle custom date range if implemented
        if (selectedTime.includes(" - ")) {
          // Parse date range like "Apr 1, 2025 - Apr 15, 2025"
          const [start, end] = selectedTime.split(" - ");
          apiDateFilter = { 
            type: "between", 
            start_date: formatApiDate(start.trim()),
            end_date: formatApiDate(end.trim())
          };
          console.log('GetMetrics - Parsed date range:', apiDateFilter);
        } else if (selectedTime.startsWith("Since ")) {
          // Parse "Since Apr 1, 2025"
          const sinceDate = selectedTime.replace("Since ", "").trim();
          apiDateFilter = { 
            type: "since", 
            start_date: formatApiDate(sinceDate)
          };
          console.log('GetMetrics - Parsed since date:', apiDateFilter);
        } else if (selectedTime.startsWith("Last ")) {
          // CHANGED: Parse "Last 45 days" with improved error handling
          const daysText = selectedTime.replace("Last ", "").replace(" days", "").trim();
          const days = parseInt(daysText);
          if (!isNaN(days)) {
            apiDateFilter = { type: "last", days: days };
            console.log(`GetMetrics - Parsed custom Last ${days} days filter`);
          } else {
            console.log('GetMetrics - Could not parse days from:', selectedTime);
          }
        }
    }
    
    // CHANGED: Log more details about the date filter and specific metric
    console.log('GetMetrics - Converted to API date filter:', apiDateFilter);
  console.log('GetMetrics - Using for specific metric:', specificMetric || 'all metrics');
  setDateFilter(apiDateFilter);
}, [selectedTime, specificMetric, initialDateFilter]); // Dependencies remain the same

  // Helper to format dates for API
  const formatApiDate = (dateStr) => {
    try {
      // Convert from "Apr 15, 2025" to "DD-MM-YYYY" format
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateStr);
        return '';
      }
      // Format as DD-MM-YYYY instead of YYYY-MM-DD
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };
  
  // ADDED: Function to fetch metric knowledge from API
  const fetchMetricKnowledge = async () => {
    try {
      console.log('GetMetrics - Fetching metric knowledge data');
      
      // CHANGED: Create a cache key for metric knowledge that includes specific metric
      const cacheKey = specificMetric 
        ? `metric_knowledge_cache_${specificMetric}` 
        : `metric_knowledge_cache`;
      
      // Check cache first
      const cachedKnowledge = localStorage.getItem(cacheKey);
      if (cachedKnowledge) {
        const { data: cachedData, timestamp } = JSON.parse(cachedKnowledge);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('GetMetrics - Loading metric knowledge from cache');
          setMetricKnowledge(cachedData);
          return cachedData;
        } else {
          console.log('GetMetrics - Metric knowledge cache expired, fetching fresh data');
        }
      } else {
        console.log('GetMetrics - No metric knowledge cache found, fetching fresh data');
      }
      
      // If no valid cache, fetch from API
      const startTime = performance.now();
      
      const response = await fetch('https://get-metric-knowledge-nrosabqhla-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsToRequest,
          game_id: GAME_ID,
          ...(userId && { user_id: userId })
        })
      });
      
      const endTime = performance.now();
      console.log(`GetMetrics - Metric knowledge API response time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const knowledgeData = await response.json();
      console.log('GetMetrics - Metric knowledge API Response:', knowledgeData);
      
      // Process the knowledge data into a more usable format
      const processedKnowledge = {};
      
      // Check if the response has the expected structure
      if (knowledgeData && typeof knowledgeData === 'object') {
        // Iterate through each metric in the knowledge data
        Object.keys(knowledgeData).forEach(metricId => {
          const metricInfo = knowledgeData[metricId];
          
          // Only include metrics with active or completed status
          if (metricInfo.status === 'active' || metricInfo.status === 'completed') {
            processedKnowledge[metricId] = {
              description: metricInfo.description || '',
              status: metricInfo.status
            };
          }
        });
      }
      
      console.log('GetMetrics - Processed metric knowledge:', processedKnowledge);
      
      // Update state with the processed knowledge
      setMetricKnowledge(processedKnowledge);
      
      // Cache the processed knowledge
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: processedKnowledge,
          timestamp: Date.now()
        }));
        console.log('GetMetrics - Metric knowledge cached successfully');
      } catch (error) {
        console.error('GetMetrics - Error caching metric knowledge:', error);
      }
      
      return processedKnowledge;
    } catch (err) {
      console.error('GetMetrics - Error fetching metric knowledge:', err);
      return {};
    }
  };
  
  // UPDATED: Function to transform metrics API data into format for GraphDisplay with knowledge data
  const transformMetricsForGraphs = (metricsData, knowledgeData = {}) => {
    // Check if we have valid data
    if (!metricsData || !metricsData.metrics || !Array.isArray(metricsData.metrics)) {
      console.log("GetMetrics - No valid metrics data to transform");
      return [];
    }

    console.log("GetMetrics - Transforming metrics data:", metricsData);
    console.log("GetMetrics - Using knowledge data:", knowledgeData);

    // Transform data for visualization
    return metricsData.metrics.map(metric => {
      // UPDATED: If specificMetricType is provided and we're processing the specific metric, use that type
      let metricType = metric.type;
      if (specificMetric && metric.metric_id === specificMetric && specificMetricType) {
        metricType = specificMetricType;
        console.log(`GetMetrics - Using specific metric type ${specificMetricType} for ${specificMetric}`);
      }
      
      // Check if this is a line/time-series type metric
      const isTimeSeries = metricType === "line" || 
                          (metric.values && metric.values.length > 0 && 
                           metric.values[0].length === 2 && 
                           !isNaN(new Date(metric.values[0][0])));

      // Default to line chart for time series data, or pie/bar for others based on type
      metricType = metricType || (isTimeSeries ? 'line' : 'bar');

      console.log(`GetMetrics - Processing metric ${metric.metric_id} as ${metricType} chart`);
      
      // ADDED: Get knowledge data for this metric if available
      const metricId = metric.metric_id || '';
      const knowledgeInfo = knowledgeData[metricId] || {};
      const description = knowledgeInfo.description || metric.description || '';

      // Handle multiline chart type differently to include categories and series
      if (metricType === 'multiline') {
        return {
          metric_id: metricId || `metric-${Math.random().toString(36).substr(2, 9)}`,
          metric_type: metricType,
          title: metric.name || "Untitled Metric",
          description: description,
          categories: metric.categories || [],
          series: metric.series || [],
          x_label: metric.x_label || "Date",
          y_label: metric.y_label || "Value",
          x_unit: metric.x_unit || "",
          y_unit: metric.y_unit || "",
          value_unit: metric.value_unit || "",
          status: knowledgeInfo.status || "pending" // ADDED: Include metric status
        };
      } else {
        return {
          metric_id: metricId || `metric-${Math.random().toString(36).substr(2, 9)}`,
          metric_type: metricType,
          title: metric.name || "Untitled Metric",
          description: description,
          columns: [
            metric.x_label || "Date", 
            metric.y_label || "Value"
          ],
          values: metric.values || [],
          x_unit: metric.x_unit || "",
          y_unit: metric.y_unit || "",
          status: knowledgeInfo.status || "pending" // ADDED: Include metric status
        };
      }
    });
  };

  // UPDATED: Function to process pre-fetched data if available
  const processPrefetchedData = async () => {
    if (!prefetchedData) {
      console.log("GetMetrics - No pre-fetched data available, skipping");
      return false;
    }
    
    console.log("GetMetrics - Processing pre-fetched data:", prefetchedData);
    
    try {
      // Fetch metric knowledge data
      const knowledgeData = await fetchMetricKnowledge();
      
      // Process pre-fetched data
      const singleMetricData = {
        metrics: [prefetchedData]
      };
      
      // Transform data for graphs
      const transformedData = transformMetricsForGraphs(singleMetricData, knowledgeData);
      console.log('GetMetrics - Transformed pre-fetched data with knowledge:', transformedData);
      
      // Update state
      setGraphData(transformedData);
      setIsLoading(false);
      
      return true;
    } catch (err) {
      console.error('GetMetrics - Error processing pre-fetched data:', err);
      return false;
    }
  };

  // UPDATED: Fetch metrics data from API with improved caching and error handling
  const fetchMetricsData = async () => {
    try {
      setIsLoading(true);
      
      // ADDED: Check if pre-fetched data was processed successfully
      const dataProcessed = await processPrefetchedData();
      if (dataProcessed) {
        console.log('GetMetrics - Used pre-fetched data, skipping API call');
        return;
      }
      
      // FIXED: Create a more specific cache key that includes both specificMetric and dateFilter
      const dateFilterStr = JSON.stringify(dateFilter);
      const cacheKey = specificMetric 
        ? `dashboard_metrics_graphs_cache_${specificMetric}_${dateFilterStr}` 
        : `dashboard_metrics_graphs_cache_${dateFilterStr}`;
      
      console.log('GetMetrics - Using cache key:', cacheKey);
      
      // Force clear any conflicting caches for this metric
      if (specificMetric) {
        // Get all localStorage keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`dashboard_metrics_graphs_cache_${specificMetric}_`) && key !== cacheKey) {
            console.log('GetMetrics - Clearing conflicting cache:', key);
            localStorage.removeItem(key);
          }
        });
      }
      
      // Check metrics cache first
      const cachedMetrics = localStorage.getItem(cacheKey);
      if (cachedMetrics) {
        const { data: cachedMetricsData, timestamp } = JSON.parse(cachedMetrics);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('GetMetrics - Loading metrics from cache for filter:', dateFilter);
          
          // ADDED: Fetch metric knowledge first
          const knowledgeData = await fetchMetricKnowledge();
          
          // Transform cached data for graphs with knowledge data
          const transformedData = transformMetricsForGraphs(cachedMetricsData, knowledgeData);
          console.log('GetMetrics - Transformed cached data with knowledge:', transformedData);
          
          setGraphData(transformedData);
          setIsLoading(false);
          return;
        } else {
          console.log('GetMetrics - Cache expired, fetching fresh data');
        }
      } else {
        console.log('GetMetrics - No cache found, fetching fresh data');
      }

      // If no valid cache, fetch from API
      const startTime = performance.now();
      console.log('GetMetrics - Fetching fresh metrics data with filter:', dateFilter);
      console.log('GetMetrics - Requesting metrics:', metricsToRequest);
      
     // API request with date_filter and game_id
const requestBody = {
  metrics: metricsToRequest,
  date_filter: dateFilter,
  // Add userIds array to the request if it has values
  ...(userIds && userIds.length > 0 && { user_ids: userIds }),
  // Only include user_id if it exists in auth context and userIds is empty
  ...(userId && (!userIds || userIds.length === 0) && { user_id: userId }),
  // Include game_id as specified
  game_id: GAME_ID
};
      
      console.log('GetMetrics - Full API request payload:', requestBody);
      
      const response = await fetch('https://get-metrics-nrosabqhla-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const endTime = performance.now();
      console.log(`GetMetrics - API response time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the response JSON
      const metricsData = await response.json();
      console.log('GetMetrics - API Response:', metricsData);
      
      // ADDED: Fetch metric knowledge after metrics data
      const knowledgeData = await fetchMetricKnowledge();
      
      // Transform data for visualization components with knowledge data
      const graphsData = transformMetricsForGraphs(metricsData, knowledgeData);
      console.log('GetMetrics - Transformed graph data with knowledge:', graphsData);
      
      // Update state with transformed data
      setGraphData(graphsData);

      // Store in cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: metricsData,
          timestamp: Date.now()
        }));
        console.log('GetMetrics - Metrics data cached successfully with key:', cacheKey);
      } catch (error) {
        console.error('GetMetrics - Error caching metrics:', error);
      }
    } catch (err) {
      console.error('GetMetrics - Error fetching metrics:', err);
      setError(`Failed to load metrics data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATED: Effect to fetch data when date filter, specificMetric or prefetchedData changes
  useEffect(() => {
    console.log('GetMetrics - Fetching data for dateFilter:', dateFilter, 'specificMetric:', specificMetric, 'prefetchedData:', prefetchedData ? 'available' : 'not available');
    
    // ADDED: Update loading state based on parent's isDataLoading prop
    if (isDataLoading !== undefined) {
      setIsLoading(isDataLoading);
    }
    
    // Call fetchMetricsData which will handle prefetched data if available
    fetchMetricsData();
  }, [dateFilter, specificMetric, prefetchedData, isDataLoading]); // UPDATED: Added prefetchedData and isDataLoading as dependencies

  // Skeleton for graph loading
  const renderSkeletonGraphs = () => {
    return (
      <>
        {/* Skeleton graph cards */}
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className={`${styles.skeletonGraph}`}>
            <div className={styles.skeletonGraphTitle}></div>
            <div className={styles.skeletonGraphContent}></div>
          </div>
        ))}
      </>
    );
  };

  // UPDATED: Modified return statement to handle hideSkeletons prop
  return (
    <div className={styles.metricsGraphContainer}>
      {/* UPDATED: Only show section title in non-readonly mode */}
      {!readOnly && <h3 className={styles.sectionTitle}>Metrics Visualization</h3>}
      
      {isLoading ? (
        // UPDATED: Show skeleton loading state only if not hidden
        !hideSkeletons ? (
          <div className={styles.skeletonContainer}>
            {renderSkeletonGraphs()}
          </div>
        ) : <div className={styles.hiddenLoading}></div> // Empty div when loading but skeletons are hidden
      ) : error ? (
        // Show error state
        <div className={styles.errorState}>{error}</div>
      ) : (
        // Show graphs if we have data
        graphData.length > 0 ? (
          <div className={styles.graphsWrapper}>
            <GraphDisplay graphs={graphData} />
          </div>
        ) : (
          <div className={styles.noDataState}>
            No graph data available
          </div>
        )
      )}
    </div>
  );
};

export default GetMetrics;