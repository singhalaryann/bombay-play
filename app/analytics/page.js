"use client";
import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import styles from "../../styles/Analytics.module.css";

export default function AnalyticsPage() {
    const [data, setData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatHeader = (header) => {
        return header
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://heart-q54hzgyghq-uc.a.run.app');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiData = await response.json();
            
            // Extract only engagement and retention data
            const { engagement, retention, order } = apiData;
            console.log('Engagement Data:', engagement);
            console.log('Retention Data:', retention);

            setData({ engagement, retention, order });
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getValueByHeader = (row, header) => {
        switch(header.toLowerCase()) {
            case 'segment type':
                return row['Segment Type'];
            case 'segment':
                return row.segment;
            case 'description':
                return row.Description;
            case 'current value (min)':
                return row.current_value_min;
            case 'day7 retention rate':
                return row.day7_retention_rate;
            case 'day14 retention rate':
                return row.day14_retention_rate;
            case 'user count':
                return row.user_count;
            default:
                return row[header] || '';
        }
    };

    const renderTable = (tableData, tableName) => {
        if (!Array.isArray(tableData) || tableData.length === 0 || !data.order?.[tableName]) return null;

        const headers = data.order[tableName];

        // Group data by Segment Type
        const groupedData = tableData.reduce((acc, row) => {
            const segmentType = row['Segment Type'];
            if (!acc[segmentType]) {
                acc[segmentType] = [];
            }
            acc[segmentType].push(row);
            return acc;
        }, {});

        return (
            <div className={styles.glassBox}>
                <h2 className={styles.tableTitle}>{formatHeader(tableName)} Metrics</h2>
                <div className={styles.tableWrapper}>
                    <table className={styles.glassTable}>
                        <thead>
                            <tr>
                                {headers.map((header) => (
                                    <th key={header}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedData).map(([segmentType, rows]) => (
                                rows.map((row, index) => (
                                    <tr key={`${segmentType}-${index}`}>
                                        {index === 0 ? (
                                            <td rowSpan={rows.length}>{segmentType}</td>
                                        ) : null}
                                        {headers.slice(1).map((header) => (
                                            <td key={header}>
                                                {getValueByHeader(row, header)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
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
                ) : error ? (
                    <main className={styles.mainContent}>
                        <div className={styles.errorState}>{error}</div>
                    </main>
                ) : (
                    <main className={styles.mainContent}>
                        {data.engagement && renderTable(data.engagement, 'engagement')}
                        {data.retention && (
                            <div className={styles.marginTop}>
                                {renderTable(data.retention, 'retention')}
                            </div>
                        )}
                    </main>
                )}
            </div>
        </div>
    );
}