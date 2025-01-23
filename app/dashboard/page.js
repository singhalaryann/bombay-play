// Dashboard.js
"use client";
import React, { useState, useEffect } from "react";
import styles from "../../styles/Dashboard.module.css";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import TabFilter from "../components/dashboard/TabFilter";
import MetricCard from "../components/dashboard/MetricCard";
import InsightCard from "../components/dashboard/InsightCard";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Lightbulb } from "lucide-react";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const { userId } = useAuth();
  const [selectedTime, setSelectedTime] = useState("Today");
  const [metrics, setMetrics] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const fetchDashboardData = async (time) => {
    try {
      setLoading(true);
      console.log("Fetching dashboard data:", { userId, time });

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
      const data = await response.json();

      if (data) {
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      router.push("/");
      return;
    }
    fetchDashboardData(selectedTime);
  }, [userId, selectedTime]);

  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.filterSection}>
            <TabFilter selected={selectedTime} onChange={handleTimeChange} />
          </div>

          {/* Metrics Section */}

          <div className={styles.metricsGrid}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : metrics.length > 0 ? (
              metrics.map((metric, index) => (
                <MetricCard key={`${metric.name}-${index}`} {...metric} />
              ))
            ) : (
              <div className={styles.noData}>No metrics available</div>
            )}
          </div>

          {/* Insights Section */}

          {insights.length > 0 && (
            <div className={styles.insightsSection}>
              <div className={styles.insightsTitleContainer}>
                <div className={styles.insightsHeader}>
                  <Lightbulb className={styles.insightIcon} size={20} />
                  <span className={styles.insightsTitle}>Insights</span>
                  <button
                    className={`${styles.brainstormButton} ${
                      isActive ? styles.active : ""
                    }`}
                    onClick={() => {
                      setIsActive(true);
                      router.push("/ideationchat");
                    }}
                  >
                    <Image
                      src="/datasourceicon.png"
                      width={20}
                      height={20}
                      alt="Brainstorm"
                      className={styles.brainstormIcon}
                    />
                    <span>Brainstorm with AI</span>
                  </button>
                </div>
                <div className={styles.insightsProgress} />
              </div>
              <div className={styles.insightsList}>
                {insights.map((insight, index) => (
                  <InsightCard
                    key={`${insight.insight_id}-${index}`}
                    description={insight.description}
                    insight_id={insight.insight_id}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
