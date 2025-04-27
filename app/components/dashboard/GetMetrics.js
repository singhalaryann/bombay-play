"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/GetMetrics.module.css";
import GraphDisplay from "../analysis/GraphDisplay";
import { useAuth } from "../../context/AuthContext";

const GetMetrics = ({ selectedTime, onTimeChange }) => {
  const { userId } = useAuth();
  
  // State for storing graph data received from API
  const [graphData, setGraphData] = useState([]);
  // Loading state to show skeleton while fetching data
  const [isLoading, setIsLoading] = useState(true);
  // Error state to display error messages if API call fails
  const [error, setError] = useState(null);
  // State for date filter to pass to API
  const [dateFilter, setDateFilter] = useState({ type: "last", days: 30 });
  
  // Cache duration: 5 minutes in milliseconds
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // List of metrics to request from the API
  const metricsToRequest = [
    "dau",
        "wau", 
        "mau", 
        "rolling_retention", 
        "total_sessions_each_day", 
        "avg_sessions_per_day", 
        "session_distribution_by_hour", 
        "avg_session_length", 
        "adaptive_session_length", 
        "geographical_breakdown", 
        "device_os_distribution"
  ];

  // Game ID constant (same as used in Dashboard for insights)
  const GAME_ID = "4705d90b-f4a9-4a71-b0b1-e4da22acfb36";

  // Effect to convert selected time to API date filter
  useEffect(() => {
    console.log('GetMetrics - Time filter changed to:', selectedTime);
    
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
        } else if (selectedTime.startsWith("Since ")) {
          // Parse "Since Apr 1, 2025"
          const sinceDate = selectedTime.replace("Since ", "").trim();
          apiDateFilter = { 
            type: "since", 
            start_date: formatApiDate(sinceDate)
          };
        } else if (selectedTime.startsWith("Last ")) {
          // Parse "Last 45 days"
          const daysText = selectedTime.replace("Last ", "").replace(" days", "").trim();
          const days = parseInt(daysText);
          if (!isNaN(days)) {
            apiDateFilter = { type: "last", days: days };
          }
        }
    }
    
    console.log('GetMetrics - Converted to API date filter:', apiDateFilter);
    setDateFilter(apiDateFilter);
  }, [selectedTime]);
  
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
  
  // Function to transform metrics API data into format for GraphDisplay
  const transformMetricsForGraphs = (metricsData) => {
    // Check if we have valid data
    if (!metricsData || !metricsData.metrics || !Array.isArray(metricsData.metrics)) {
      console.log("No valid metrics data to transform");
      return [];
    }

    console.log("Transforming metrics data:", metricsData);

    // Transform data for visualization
    return metricsData.metrics.map(metric => {
      // Check if this is a line/time-series type metric
      const isTimeSeries = metric.type === "line" || 
                          (metric.values && metric.values.length > 0 && 
                           metric.values[0].length === 2 && 
                           !isNaN(new Date(metric.values[0][0])));

      // Default to line chart for time series data, or pie/bar for others based on type
      const metricType = metric.type || (isTimeSeries ? 'line' : 'bar');

      console.log(`Processing metric ${metric.metric_id} as ${metricType} chart`);

      // Handle multiline chart type differently to include categories and series
      if (metricType === 'multiline') {
        return {
          metric_id: metric.metric_id || `metric-${Math.random().toString(36).substr(2, 9)}`,
          metric_type: metricType,
          title: metric.name || "Untitled Metric",
          description: metric.description || "",
          categories: metric.categories || [],
          series: metric.series || [],
          x_label: metric.x_label || "Date",
          y_label: metric.y_label || "Value",
          x_unit: metric.x_unit || "",
          y_unit: metric.y_unit || "",
          value_unit: metric.value_unit || ""
        };
      } else {
        return {
          metric_id: metric.metric_id || `metric-${Math.random().toString(36).substr(2, 9)}`,
          metric_type: metricType,
          title: metric.name || "Untitled Metric",
          description: metric.description || "",
          columns: [
            metric.x_label || "Date", 
            metric.y_label || "Value"
          ],
          values: metric.values || [],
          x_unit: metric.x_unit || "",
          y_unit: metric.y_unit || ""
        };
      }
    });
  };

  // Fetch metrics data from API
  const fetchMetricsData = async () => {
    try {
      setIsLoading(true);
      
      // Create a cache key that includes the date filter
      const cacheKey = `dashboard_metrics_graphs_cache_${JSON.stringify(dateFilter)}`;
      
      // Check metrics cache first
      const cachedMetrics = localStorage.getItem(cacheKey);
      if (cachedMetrics) {
        const { data: cachedMetricsData, timestamp } = JSON.parse(cachedMetrics);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('GetMetrics - Loading metrics from cache for filter:', dateFilter);
          
          // Transform cached data for graphs
          const transformedData = transformMetricsForGraphs(cachedMetricsData);
          console.log('GetMetrics - Transformed cached data:', transformedData);
          
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
        // Only include user_id if it exists in auth context
        ...(userId && { user_id: userId }),
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
      
      // Transform data for visualization components
      const graphsData = transformMetricsForGraphs(metricsData);
      console.log('GetMetrics - Transformed graph data:', graphsData);
      
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

  // Effect to fetch data when date filter changes
  useEffect(() => {
    fetchMetricsData();
  }, [dateFilter]);

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

  return (
    <div className={styles.metricsGraphContainer}>
      <h3 className={styles.sectionTitle}>Metrics Visualization</h3>
      
      {isLoading ? (
        // Show skeleton loading state
        <div className={styles.skeletonContainer}>
          {renderSkeletonGraphs()}
        </div>
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