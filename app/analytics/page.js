"use client";
import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import styles from "../../styles/Analytics.module.css";

export default function AnalyticsPage() {
  // Initialize state for API data, loading state, and error handling
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to format header text (e.g., "user_count" -> "User Count")
  const formatHeader = (header) => {
    return header
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter out unwanted columns and get final headers to display
  const getVisibleHeaders = (data) => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(header => header !== 'calculated_at');
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching data...");
      
      const response = await fetch('https://heart-q54hzgyghq-uc.a.run.app');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();
      console.log("Received data:", apiData);
      
      // Store all data received from API
      setData(apiData);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Set up initial data fetch and refresh interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 60 * 1000); // 30 minutes refresh
    return () => clearInterval(interval);
  }, []);

  // Render a table based on provided data
  const renderTable = (data, tableName) => {
    if (!data || data.length === 0) return null;

    // Get visible headers (excluding calculated_at)
    const headers = getVisibleHeaders(data);

    return (
      <div className={styles.glassBox}>
        <h2 className={styles.tableTitle}>
          {formatHeader(tableName)} Metrics
        </h2>
        <div className={styles.tableWrapper}>
          <table className={styles.glassTable}>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{formatHeader(header)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={`${tableName}-${rowIndex}`}>
                  {headers.map((header, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`}>
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        {isLoading ? (
          <main className={styles.mainContent}>
            <div className={styles.loading}>Loading...</div>
          </main>
        ) : (
          <main className={styles.mainContent}>
            {error ? (
              <div className={styles.errorState}>{error}</div>
            ) : (
              <>
                {/* Dynamically render all tables from the API */}
                {Object.entries(data).map(([tableName, tableData], index) => (
                  <div 
                    key={tableName} 
                    className={index > 0 ? styles.marginTop : ''}
                  >
                    {renderTable(tableData, tableName)}
                  </div>
                ))}
              </>
            )}
          </main>
        )}
      </div>
    </div>
  );
}