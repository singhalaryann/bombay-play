"use client";
import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import styles from "../../styles/Analytics.module.css";
import GraphDisplay from "../components/analysis/GraphDisplay";
import TabFilter from "../components/dashboard/TabFilter";
import { useAuth } from "../context/AuthContext";

export default function AnalyticsPage() {
    const { userId } = useAuth();
    
    // UPDATED: Check localStorage for previously selected time filter
    const savedTimeFilter = localStorage.getItem(`analytics_current_filter_${userId}`);
    const [selectedTime, setSelectedTime] = useState(savedTimeFilter || "30D");
    
    // State for storing graph data received from API
    const [graphData, setGraphData] = useState([]);
    // Loading state to show skeleton while fetching data
    const [isLoading, setIsLoading] = useState(true);
    // Error state to display error messages if API call fails
    const [error, setError] = useState(null);
    // State for date filter to pass to API
    const [dateFilter, setDateFilter] = useState({ type: "last", days: 30 });
    // State for metric knowledge data
    const [metricKnowledge, setMetricKnowledge] = useState({});

    // Cache duration: 5 minutes in milliseconds
    const CACHE_DURATION = 5 * 60 * 1000;

    // List of all metrics to request from the API
    const metricsToRequest = [
        "dau",
        "wau", 
        "mau", 
        "rolling_retention", 
        "total_sessions_each_day", 
        "avg_sessions_per_day", 
        "session_distribution_by_hour", 
        "avg_session_length", 
        // "adaptive_session_length", 
        "geographical_breakdown", 
        "device_os_distribution",
        "session_length_distribution",
        // "d1_retention"
    ];

    // UPDATED: Handle time filter changes with localStorage persistence
    const handleTimeFilterChange = (newTime) => {
        console.log('Time filter changed to:', newTime);
        setSelectedTime(newTime);
        
        // Store current filter in localStorage for page reload
        localStorage.setItem(`analytics_current_filter_${userId}`, newTime);
        
        // Convert UI time filter to API date_filter format
        let apiDateFilter = { type: "last", days: 30 }; // Default
        
        switch(newTime) {
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
                if (newTime.includes(" - ")) {
                    // Parse date range like "Apr 1, 2025 - Apr 15, 2025"
                    const [start, end] = newTime.split(" - ");
                    apiDateFilter = { 
                        type: "between", 
                        start_date: formatApiDate(start.trim()),
                        end_date: formatApiDate(end.trim())
                    };
                } else if (newTime.startsWith("Since ")) {
                    // Parse "Since Apr 1, 2025"
                    const sinceDate = newTime.replace("Since ", "").trim();
                    apiDateFilter = { 
                        type: "since", 
                        start_date: formatApiDate(sinceDate)
                    };
                } else if (newTime.startsWith("Last ")) {
                    // Parse "Last 45 days"
                    const daysText = newTime.replace("Last ", "").replace(" days", "").trim();
                    const days = parseInt(daysText);
                    if (!isNaN(days)) {
                        apiDateFilter = { type: "last", days: days };
                    }
                }
        }
        
        console.log('Converted to API date filter:', apiDateFilter);
        setDateFilter(apiDateFilter);
    };

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

    // ADDED: Effect to restore filter from localStorage on page reload
    useEffect(() => {
        // This will run once when the component mounts
        if (userId && savedTimeFilter) {
            console.log('Analytics - Restoring saved filter:', savedTimeFilter);
            // Convert the saved filter to date filter format
            handleTimeFilterChange(savedTimeFilter);
        }
    }, [userId]); // Only run when userId changes or on initial mount

    // Function to fetch metric knowledge data
    const fetchMetricKnowledge = async () => {
        try {
            console.log('Fetching metric knowledge data');
            
            // Create a cache key for metric knowledge
            const cacheKey = `metric_knowledge_cache`;
            
            // Check cache first
            const cachedKnowledge = localStorage.getItem(cacheKey);
            if (cachedKnowledge) {
                const { data: cachedData, timestamp } = JSON.parse(cachedKnowledge);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    console.log('Loading metric knowledge from cache');
                    setMetricKnowledge(cachedData);
                    return cachedData;
                } else {
                    console.log('Metric knowledge cache expired, fetching fresh data');
                }
            } else {
                console.log('No metric knowledge cache found, fetching fresh data');
            }
            
            // If no valid cache, fetch from API
            const startTime = performance.now();
            
            const response = await fetch('https://get-metric-knowledge-nrosabqhla-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metrics: metricsToRequest,
                    game_id: "ludogoldrush",
                    ...(userId && { user_id: userId })
                })
            });
            
            const endTime = performance.now();
            console.log(`Metric knowledge API response time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const knowledgeData = await response.json();
            console.log('Metric knowledge API Response:', knowledgeData);
            
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
            
            console.log('Processed metric knowledge:', processedKnowledge);
            
            // Update state with the processed knowledge
            setMetricKnowledge(processedKnowledge);
            
            // Cache the processed knowledge
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: processedKnowledge,
                    timestamp: Date.now()
                }));
                console.log('Metric knowledge cached successfully');
            } catch (error) {
                console.error('Error caching metric knowledge:', error);
            }
            
            return processedKnowledge;
        } catch (err) {
            console.error('Error fetching metric knowledge:', err);
            return {};
        }
    };

    // Function to transform metrics API data into format for GraphDisplay
    const transformMetricsForGraphs = (metricsData, knowledgeData = {}) => {
        // Check if we have valid data
        if (!metricsData || !metricsData.metrics || !Array.isArray(metricsData.metrics)) {
            console.log("No valid metrics data to transform");
            return [];
        }

        console.log("Transforming metrics data:", metricsData);
        console.log("Using knowledge data:", knowledgeData);

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
            
            // Use knowledge data description if available
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
                    status: knowledgeInfo.status || "pending"
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
                    status: knowledgeInfo.status || "pending"
                };
            }
        });
    };

    // fetchMetricsData now calls fetchMetricKnowledge
    const fetchMetricsData = async () => {
        try {
            setIsLoading(true);
            
            // Create a cache key that includes the date filter
            const cacheKey = `metrics_cache_${JSON.stringify(dateFilter)}`;
            
            // Check metrics cache first
            const cachedMetrics = localStorage.getItem(cacheKey);
            if (cachedMetrics) {
                const { data: cachedMetricsData, timestamp } = JSON.parse(cachedMetrics);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    console.log('Loading metrics from cache for filter:', dateFilter);
                    
                    // Fetch metric knowledge first
                    const knowledgeData = await fetchMetricKnowledge();
                    
                    // Transform cached data for graphs with knowledge data
                    const transformedData = transformMetricsForGraphs(cachedMetricsData, knowledgeData);
                    console.log('Transformed cached data with knowledge:', transformedData);
                    
                    setGraphData(transformedData);
                    setIsLoading(false);
                    return;
                } else {
                    console.log('Cache expired, fetching fresh data');
                }
            } else {
                console.log('No cache found, fetching fresh data');
            }

            // If no valid cache, fetch from API
            const startTime = performance.now();
            console.log('Fetching fresh metrics data from API with filter:', dateFilter);
            console.log('Requesting metrics:', metricsToRequest);
            
            // API request now includes date_filter and game_id
            const requestBody = {
                metrics: metricsToRequest,
                date_filter: dateFilter,
                // Only include user_id if it exists in auth context
                ...(userId && { user_id: userId }),
                // Include game_id as specified
                game_id: "ludogoldrush"
            };
            
            console.log('Full API request payload:', requestBody);
            
            const response = await fetch('https://get-metrics-nrosabqhla-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const endTime = performance.now();
            console.log(`Metrics API response time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse the response JSON
            const metricsData = await response.json();
            console.log('API Response:', metricsData);
            
            // Fetch metric knowledge after metrics data
            const knowledgeData = await fetchMetricKnowledge();
            
            // Transform data for visualization components with knowledge data
            const graphsData = transformMetricsForGraphs(metricsData, knowledgeData);
            console.log('Transformed graph data with knowledge:', graphsData);
            
            // Update state with transformed data
            setGraphData(graphsData);

            // Store in cache
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: metricsData,
                    timestamp: Date.now()
                }));
                console.log('Metrics data cached successfully with key:', cacheKey);
            } catch (error) {
                console.error('Error caching metrics:', error);
            }
        } catch (err) {
            console.error('Error fetching metrics:', err);
            setError(`Failed to load metrics data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to fetch data when date filter changes
    useEffect(() => {
        fetchMetricsData();
        
        // Refresh data every 30 minutes
        const interval = setInterval(fetchMetricsData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [dateFilter]); // Added dateFilter dependency

    // Skeleton for graph loading
    const renderSkeletonGraphs = () => {
        return (
            <>
                {/* Skeleton graph cards */}
                {[1, 2, 3, 4].map((index) => (
                    <div key={index} className={`${styles.glassBox} ${index > 1 ? styles.marginTop : ''} ${styles.skeletonGraph}`}>
                        <div className={styles.skeletonGraphTitle}></div>
                        <div className={styles.skeletonGraphContent}></div>
                    </div>
                ))}
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
                    <div className={styles.pageHeader}>
                        <h2 className={styles.pageTitle}>Analytics Dashboard</h2>
                        
                        {/* TabFilter component for time selection */}
                        <div className={styles.filterContainer}>
                            <TabFilter 
                                selected={selectedTime} 
                                onChange={handleTimeFilterChange}
                            />
                        </div>
                    </div>
                    
                    {isLoading ? (
                        // Show skeleton loading state
                        renderSkeletonGraphs()
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
                </main>
            </div>
        </div>
    );
}