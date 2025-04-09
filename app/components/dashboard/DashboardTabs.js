"use client";
import React from "react";
import Image from "next/image";
import { Layout } from "lucide-react"; // CHANGED: Imported Layout icon from lucide-react
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
        {/* CHANGED: Replaced Image with Layout icon for Overview tab */}
        <button
          className={`${styles.tabButton} ${
            activeTab === "overview" ? styles.active : "" // CHANGED: Now using "overview" for activeTab check
          }`}
          onClick={() => {
            console.log("Overview clicked"); // ADDED: Console logging when clicked
            onTabChange("overview"); // CHANGED: Now passing "overview" instead of "experiment"
          }}
        >
          <Layout // CHANGED: Using Layout component instead of Image
            className={styles.tabIcon}
            size={20}
          />
          <span>Overview</span>
        </button>
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
      {/* CHANGED: Updated tab content rendering to handle "overview" tab properly */}
      <div className={styles.tabContent}>
        {activeTab === "insights" 
          ? children 
          : activeTab === "overview" 
            ? null // ADDED: When overview is active, show nothing (or replace with Overview content)
            : experimentContent
        }
      </div>
    </div>
  );
};

export default DashboardTabs;