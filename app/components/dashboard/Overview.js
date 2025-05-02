"use client";
import React, { useState, useEffect } from "react";
import { Users, Target, TrendingUp, Clock } from "lucide-react";
import styles from "../../../styles/Overview.module.css";
import { useAuth } from "../../context/AuthContext";
// ADDED: Import GetMetrics component
import GetMetrics from "./GetMetrics";

const Overview = ({ selectedTime, apiDateFilter, globalDateFilter }) => { // UPDATED: Added globalDateFilter prop
  const { userId } = useAuth();
  
  // State for storing the metrics data
  const [metricsData, setMetricsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Game ID constant
  const GAME_ID = "ludogoldrush";
  
  // Cache duration: 5 minutes in milliseconds
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // Metrics to request for the overview cards
  const metricsToRequest = ["dau", "avg_session_length", "classic_retention", "new_players"];

  // Calculate delta percentage between new and old values using mentor's formula
  const calculateDeltaPercentage = (newValue, oldValue) => {
    if (!oldValue || oldValue === 0) {
      return { value: 0, isPositive: true };
    }
    
    // Using formula: (1 - (new value/old value)) * 100%
    const delta = (1 - (newValue / oldValue)) * 100;
    return {
      value: Math.abs(delta).toFixed(1),
      // Negative delta means value increased (which is positive for business)
      isPositive: delta <= 0
    };
  };
  
  // Format value for display based on metric type
  const formatValue = (metric, value) => {
    if (!value && value !== 0) return "N/A";
    
    switch (metric) {
      case "dau":
        return `${Math.round(value).toLocaleString()}`;
      case "new_players":
        return `${Math.round(value).toLocaleString()}`;
      case "avg_session_length":
        // Display raw seconds value
        return `${Math.round(value)}`;
      case "classic_retention":
        return `${value.toFixed(1)}%`;
      default:
        return `${value}`;
    }
  };

// Fetch metrics data from API
const fetchMetricsData = async () => {
  try {
    // UPDATED: Set loading state to true immediately when fetch starts
    setIsLoading(true);
    setMetricsData(null); // Clear current data to show loading state
    
    if (!apiDateFilter || !apiDateFilter.start_date || !apiDateFilter.end_date) {
      console.log("Overview - Invalid date filter:", apiDateFilter);
      return;
    }
    
    // Create a cache key based on date filter
    const dateFilterStr = JSON.stringify(apiDateFilter);
    const cacheKey = `overview_metrics_cache_${dateFilterStr}`;
    
    // Check cache first
    const cachedMetrics = localStorage.getItem(cacheKey);
    // Rest of the function...
          if (cachedMetrics) {
        const { data: cachedMetricsData, timestamp } = JSON.parse(cachedMetrics);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('Overview - Loading metrics from cache for filter:', apiDateFilter);
          processMetricsData(cachedMetricsData);
          setIsLoading(false);
          return;
        } else {
          console.log('Overview - Cache expired, fetching fresh data');
        }
      } else {
        console.log('Overview - No cache found, fetching fresh data');
      }

      // If no valid cache, fetch from API
      const startTime = performance.now();
      console.log('Overview - Fetching fresh metrics data with filter:', apiDateFilter);
      console.log('Overview - Requesting metrics:', metricsToRequest);
      
      // API request with date_filter and game_id
      const requestBody = {
        metrics: metricsToRequest,
        date_filter: apiDateFilter,
        ...(userId && { user_id: userId }),
        game_id: GAME_ID
      };
      
      console.log('Overview - Full API request payload:', requestBody);
      
      const response = await fetch('https://get-metrics-nrosabqhla-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const endTime = performance.now();
      console.log(`Overview - API response time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the response JSON
      const data = await response.json();
      console.log('Overview - API Response:', data);
      
      // Process metrics data
      processMetricsData(data);
      
      // Store in cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data,
          timestamp: Date.now()
        }));
        console.log('Overview - Metrics data cached successfully with key:', cacheKey);
      } catch (error) {
        console.error('Overview - Error caching metrics:', error);
      }
    } catch (err) {
      console.error('Overview - Error fetching metrics:', err);
      setError(`Failed to load metrics data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process the metrics data for display
  const processMetricsData = (data) => {
    if (!data || !data.metrics || !Array.isArray(data.metrics)) {
      console.log("Overview - No valid metrics data to process");
      setMetricsData(null);
      return;
    }
    
    console.log("Overview - Processing metrics data:", data);
    
    // Create an object to hold the processed metrics
    const processedMetrics = {};
    
    // Process each metric
    data.metrics.forEach(metric => {
      const metricId = metric.metric_id;
      
      // Skip if not the metric we're looking for
      if (!metricsToRequest.includes(metricId)) {
        return;
      }
      
      // Handle different metric types
      if (metricId === "classic_retention") {
        // For classic retention, we want Day 7 specifically
        if (metric.series && Array.isArray(metric.series)) {
          // Find the Day 7 series
          const day7Series = metric.series.find(s => s.name === "Day 7 Classic Retention");
          
          if (day7Series && Array.isArray(day7Series.values) && day7Series.values.length > 0) {
            // Get the latest value (last in array)
            const newValue = day7Series.values[day7Series.values.length - 1] || 0;
            // Get the previous value (second to last)
            const oldValue = day7Series.values.length > 1 ? day7Series.values[day7Series.values.length - 2] : 0;
            
            // Calculate delta
            const delta = calculateDeltaPercentage(newValue, oldValue);
            
            processedMetrics[metricId] = {
              title: day7Series.name,
              value: formatValue(metricId, newValue),
              change: `${delta.isPositive ? '+' : '-'}${delta.value}%`,
              isPositive: delta.isPositive,
              icon: Target
            };
          }
        }
      } else if (Array.isArray(metric.values) && metric.values.length > 0) {
        // For time series data, get the latest values
        // Sort values by date if not already sorted
        const sortedValues = [...metric.values].sort((a, b) => new Date(a[0]) - new Date(b[0]));
        
        // Get the latest value (last in array)
        const newValue = sortedValues[sortedValues.length - 1][1] || 0;
        // Get the previous value (second to last)
        const oldValue = sortedValues.length > 1 ? sortedValues[sortedValues.length - 2][1] : 0;
        
        // Calculate delta
        const delta = calculateDeltaPercentage(newValue, oldValue);
        
        // Set icon based on metric type
        let icon;
        switch (metricId) {
          case "dau":
            icon = Users;
            break;
          case "new_players":
            icon = TrendingUp;
            break;
          case "avg_session_length":
            icon = Clock;
            break;
          default:
            icon = Target;
        }
        
        processedMetrics[metricId] = {
          title: metric.name, // Use the name from the API
          value: formatValue(metricId, newValue),
          change: `${delta.isPositive ? '+' : '-'}${delta.value}%`,
          isPositive: delta.isPositive,
          icon
        };
      }
    });
    
    console.log("Overview - Processed metrics:", processedMetrics);
    setMetricsData(processedMetrics);
  };

  // Fetch metrics when apiDateFilter changes
  useEffect(() => {
    if (apiDateFilter && apiDateFilter.start_date && apiDateFilter.end_date) {
      console.log("Overview - Date filter is valid, fetching metrics");
      fetchMetricsData();
    } else {
      console.log("Overview - Waiting for valid date filter");
    }
  }, [apiDateFilter]);

  // Define order of metrics for display
  const metricOrder = ["dau", "classic_retention", "new_players", "avg_session_length"];

  // Map of metrics for the overview cards - using loading state when API data is not available
  const getOverviewStats = () => {
    if (!metricsData) {
      // Return loading placeholders if no metrics data is available
      return [
        {
          title: "Loading...",
          value: "...",
          change: "0%",
          isPositive: true,
          icon: Users,
        },
        {
          title: "Loading...",
          value: "...",
          change: "0%",
          isPositive: true,
          icon: Target,
        },
        {
          title: "Loading...",
          value: "...",
          change: "0%",
          isPositive: true,
          icon: TrendingUp,
        },
        {
          title: "Loading...",
          value: "...",
          change: "0%",
          isPositive: true,
          icon: Clock,
        }
      ];
    }
    
    // Return metrics in the specified order
    return metricOrder.map(metricId => {
      const metric = metricsData[metricId];
      if (!metric) {
        // Fallback for missing metrics
        let fallbackIcon;
        switch (metricId) {
          case "dau":
            fallbackIcon = Users;
            break;
          case "classic_retention":
            fallbackIcon = Target;
            break;
          case "new_players":
            fallbackIcon = TrendingUp;
            break;
          case "avg_session_length":
            fallbackIcon = Clock;
            break;
          default:
            fallbackIcon = Target;
        }
        
        return {
          title: "No Data",
          value: "N/A",
          change: "0%",
          isPositive: true,
icon: fallbackIcon
        };
      }
      
      return metric;
    });
  };

  // Render the overview stats
  return (
    <div className={styles.overviewContainer}>
      <div className={styles.statsGrid}>
        {getOverviewStats().map((stat, index) => (
          <div key={index} className={`${styles.statCard} ${isLoading ? styles.loading : ''}`}>
            <div className={styles.statHeader}>
              <h3>{stat.title}</h3>
              <stat.icon size={20} className={styles.statIcon} />
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={`${styles.statChange} ${stat.isPositive ? styles.positive : styles.negative}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {/* ADDED: Section to display graphs for each metric using GetMetrics */}
      <div className={styles.overviewGraphsContainer}>
        {/* Display DAU Graph - first graph shows skeletons */}
        <GetMetrics 
          selectedTime={selectedTime}
          specificMetric="dau"
          specificMetricType="line"
          readOnly={true}
          initialDateFilter={globalDateFilter}
        />
        
        {/* UPDATED: Hide skeletons for the other graphs */}
        <GetMetrics 
          selectedTime={selectedTime}
          specificMetric="classic_retention"
          specificMetricType="multiline"
          readOnly={true}
          initialDateFilter={globalDateFilter}
          hideSkeletons={true} // ADDED: Hide skeletons for this component
        />
        
        {/* UPDATED: Hide skeletons for this graph too */}
        <GetMetrics 
          selectedTime={selectedTime}
          specificMetric="new_players"
          specificMetricType="line"
          readOnly={true}
          initialDateFilter={globalDateFilter}
          hideSkeletons={true} // ADDED: Hide skeletons for this component
        />
        
        {/* UPDATED: Hide skeletons for this graph too */}
        <GetMetrics 
          selectedTime={selectedTime}
          specificMetric="avg_session_length"
          specificMetricType="line"
          readOnly={true}
          initialDateFilter={globalDateFilter}
          hideSkeletons={true} // ADDED: Hide skeletons for this component
        />
      </div>
    </div>
  );
};

export default Overview;