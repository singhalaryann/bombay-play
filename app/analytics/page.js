"use client";
import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import styles from "../../styles/Analytics.module.css";
import GraphDisplay from "../components/analysis/GraphDisplay";

export default function AnalyticsPage() {
    // State for storing graph data received from API
    const [graphData, setGraphData] = useState([]);
    // Loading state to show skeleton while fetching data
    const [isLoading, setIsLoading] = useState(true);
    // Error state to display error messages if API call fails
    const [error, setError] = useState(null);

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
        });
    };

    const fetchMetricsData = async () => {
        try {
            setIsLoading(true);
            
            // Check metrics cache first
            const cachedMetrics = localStorage.getItem('metrics_cache');
            if (cachedMetrics) {
                const { data: cachedMetricsData, timestamp } = JSON.parse(cachedMetrics);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    console.log('Loading metrics from cache');
                    
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
            console.log('Fetching fresh metrics data from API...');
            console.log('Requesting metrics:', metricsToRequest);
            
            // Important: Using POST method with metrics array in the request body
            const response = await fetch('https://get-metrics-q54hzgyghq-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metrics: metricsToRequest })
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
                localStorage.setItem('metrics_cache', JSON.stringify({
                    data: metricsData,
                    timestamp: Date.now()
                }));
                console.log('Metrics data cached successfully');
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

    // Effect to fetch data on component mount
    useEffect(() => {
        fetchMetricsData();
        
        // Refresh data every 30 minutes
        const interval = setInterval(fetchMetricsData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

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
                    <h2 className={styles.pageTitle}>Analytics Dashboard</h2>
                    
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