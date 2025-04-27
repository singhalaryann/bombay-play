"use client";
import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import styles from "../../styles/Analytics.module.css";
import GraphDisplay from "../components/analysis/GraphDisplay";
import TabFilter from "../components/dashboard/TabFilter"; // ADDED: Import TabFilter component
import { useAuth } from "../context/AuthContext"; // ADDED: Import Auth context for userId

export default function AnalyticsPage() {
    const { userId } = useAuth(); // ADDED: Get userId from auth context
    
    // State for storing graph data received from API
    const [graphData, setGraphData] = useState([]);
    // Loading state to show skeleton while fetching data
    const [isLoading, setIsLoading] = useState(true);
    // Error state to display error messages if API call fails
    const [error, setError] = useState(null);
    // ADDED: State for selected time filter
    const [selectedTime, setSelectedTime] = useState("30D");
    // ADDED: State for date filter to pass to API
    const [dateFilter, setDateFilter] = useState({ type: "last", days: 30 });

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
        "adaptive_session_length", 
        "geographical_breakdown", 
        "device_os_distribution"
    ];

    // ADDED: Handle time filter changes
    const handleTimeFilterChange = (newTime) => {
        console.log('Time filter changed to:', newTime);
        setSelectedTime(newTime);
        
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

    // ADDED: Helper to format dates for API
// ADDED: Helper to format dates for API
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

    // UPDATED: fetchMetricsData now uses the date filter
    const fetchMetricsData = async () => {
        try {
            setIsLoading(true);
            
            // ADDED: Create a cache key that includes the date filter
            const cacheKey = `metrics_cache_${JSON.stringify(dateFilter)}`;
            
            // Check metrics cache first
            const cachedMetrics = localStorage.getItem(cacheKey);
            if (cachedMetrics) {
                const { data: cachedMetricsData, timestamp } = JSON.parse(cachedMetrics);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    console.log('Loading metrics from cache for filter:', dateFilter);
                    
                    // Transform cached data for graphs
                    const transformedData = transformMetricsForGraphs(cachedMetricsData);
                    console.log('Transformed cached data:', transformedData);
                    
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
            
            // UPDATED: API request now includes date_filter and game_id
            const requestBody = {
                metrics: metricsToRequest,
                date_filter: dateFilter,
                // Only include user_id if it exists in auth context
                ...(userId && { user_id: userId }),
                // Include game_id as specified
                game_id: "4705d90b-f4a9-4a71-b0b1-e4da22acfb36"
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
            
            // Transform data for visualization components
            const graphsData = transformMetricsForGraphs(metricsData);
            console.log('Transformed graph data:', graphsData);
            
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

    // UPDATED: Effect to fetch data when date filter changes
    useEffect(() => {
        fetchMetricsData();
        
        // Refresh data every 30 minutes
        const interval = setInterval(fetchMetricsData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [dateFilter]); // CHANGED: Added dateFilter dependency

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
                        
                        {/* ADDED: TabFilter component for time selection */}
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