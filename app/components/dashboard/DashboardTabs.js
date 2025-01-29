"use client";
import React from "react";
import { Lightbulb, FlaskConical } from "lucide-react";
import styles from "../../../styles/DashboardTabs.module.css";

const DashboardTabs = ({ activeTab, onTabChange, children, experimentContent }) => {
  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${activeTab === "insights" ? styles.active : ""}`}
          onClick={() => onTabChange("insights")}
        >
          <Lightbulb size={20} />
          <span>Insights</span>
        </button>
        
        <button
          className={`${styles.tabButton} ${activeTab === "experiment" ? styles.active : ""}`}
          onClick={() => onTabChange("experiment")}
        >
          <FlaskConical size={20} />
          <span>Experiments</span>
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "insights" ? children : experimentContent}
      </div>
    </div>
  );
};

export default DashboardTabs;
