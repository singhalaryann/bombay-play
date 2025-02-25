"use client";
import React from "react";
import Image from "next/image";
// import { Lightbulb, FlaskConical } from "lucide-react";
import styles from "../../../styles/DashboardTabs.module.css";

const DashboardTabs = ({
  activeTab,
  onTabChange,
  children,
  experimentContent,
}) => {
  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "insights" ? styles.active : ""
          }`}
          onClick={() => onTabChange("insights")}
        >
          <Image
            src="/social_media.svg"
            alt="Insights"
            width={20}
            height={20}
            className={styles.tabIcon}
          />
          <span>Insights</span>
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "experiment" ? styles.active : ""
          }`}
          onClick={() => onTabChange("experiment")}
        >
          <Image
            src="/experiment_content.svg"
            alt="Experiments"
            width={20}
            height={20}
            className={styles.tabIcon}
          />
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
