// components/knowledgebase/KnowledgeBaseTabs.js
"use client";
import React, { useState } from "react";
import { Lightbulb, Database, PieChart } from "lucide-react";
import styles from "../../../styles/knowledgebase/KnowledgeBaseTabs.module.css";

const KnowledgeBaseTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.tabHeader}>
      <button
        className={`${styles.tabButton} ${
          activeTab === "social" ? styles.active : ""
        }`}
        onClick={() => onTabChange("social")}
      >
        <Lightbulb size={20} />
        <span>Social Media</span>
      </button>
      <button
        className={`${styles.tabButton} ${
          activeTab === "knowledge" ? styles.active : ""
        }`}
        onClick={() => onTabChange("knowledge")}
      >
        <Database size={20} />
        <span>Knowledge Base</span>
      </button>
      <button
        className={`${styles.tabButton} ${
          activeTab === "competitive" ? styles.active : ""
        }`}
        onClick={() => onTabChange("competitive")}
      >
        <PieChart size={20} />
        <span>Competitive Analysis</span>
      </button>
    </div>
  );
};

export default KnowledgeBaseTabs;