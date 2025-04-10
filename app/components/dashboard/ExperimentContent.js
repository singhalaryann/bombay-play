"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/ExperimentContent.module.css";
import ExperimentGraphDisplay from "../experiment/ExperimentGraphDisplay";
import LoadingAnimation from "../common/LoadingAnimation";
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

export default function ExperimentContent({ userId }) {
  const [experimentData, setExperimentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // New states for graph handling
  const [selectedGraphs, setSelectedGraphs] = useState(null);
  const [selectedExperimentId, setSelectedExperimentId] = useState(null);
  const [loadingGraphs, setLoadingGraphs] = useState(false);
  
  // ADDED: New state for skeleton loading
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Existing useEffect for initial data fetch
  useEffect(() => {
    let isSubscribed = true;
    const fetchExperiments = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // ADDED: Make sure we show skeleton content first
        setIsInitialRender(false);
        
        const userExperimentsResponse = await fetch(
          "https://get-user-experiments-q54hzgyghq-uc.a.run.app",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (!isSubscribed) return;

        if (!userExperimentsResponse.ok) {
          throw new Error("Failed to fetch user experiments");
        }

        const userExperiments = await userExperimentsResponse.json();

        if (!isSubscribed) return;

        if (!userExperiments.experiment_ids?.length) {
          setExperimentData([]);
          setLoading(false);
          return;
        }

        const experimentsPromises = userExperiments.experiment_ids.map((id) =>
          fetch("https://get-experiment-q54hzgyghq-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experiment_id: id }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch experiment ${id}`);
            }
            return response.json();
          })
        );

        const experimentsResults = await Promise.allSettled(
          experimentsPromises
        );

        if (!isSubscribed) return;

        console.log("Raw API Response:", experimentsResults);

        const validExperiments = experimentsResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => {
            console.log("Single result value:", result.value);
            return result.value.experiment;
          })
          .filter((exp) => {
            console.log("After mapping, single experiment:", exp);
            return exp?.status === "active" || exp?.status === "complete";
          });

        setExperimentData(validExperiments);
        setError(null);
      } catch (err) {
        if (isSubscribed) {
          console.error("Error fetching experiments:", err);
          setError("Failed to load experiments");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchExperiments();

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  // New function to handle experiment click
  const handleExperimentClick = async (experimentId) => {
    console.log("Experiment clicked:", experimentId);

    // Toggle graphs if clicking same experiment
    if (selectedExperimentId === experimentId) {
      setSelectedGraphs(null);
      setSelectedExperimentId(null);
      return;
    }

    setLoadingGraphs(true);  // Start loading animation
    setSelectedExperimentId(experimentId);

    try {
      const response = await fetch(
        "https://get-experiment-q54hzgyghq-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experiment_id: experimentId }),
        }
      );

      const data = await response.json();
      console.log("Graph data received:", data.experiment.graphs);

      setSelectedGraphs(data.experiment.graphs);
    } catch (err) {
      console.error("Error fetching experiment graphs:", err);
    } finally {
      setLoadingGraphs(false);  // Stop loading whether success or error
    }
  };

  // ADDED: Render skeleton placeholders while loading
  const renderSkeletonContent = () => {
    return (
      <div className={styles.experimentSection}>
        {[1, 2, 3].map((index) => (
          <div key={index} className={`${styles.bundleContainer} ${styles.skeletonContainer}`}>
            <div className={styles.bundleTitle}>
              <div className={styles.titleWrapper}>
                <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
              </div>
              <div className={`${styles.clickIndicator} ${styles.skeletonButton}`}>
                <BarChart3 size={16} className="text-white opacity-30" />
                <div className={styles.skeletonButtonText}></div>
                <ChevronDown size={16} className="text-white opacity-30" />
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.bundleTable}>
                <thead>
                  <tr className={styles.headerRow}>
                    <th>Test Group</th>
                    <th className={styles.skeletonHeader}></th>
                    <th className={styles.skeletonHeader}></th>
                  </tr>
                </thead>
                <tbody className={styles.glassEffect}>
                  <tr>
                    <td className={styles.groupCell}>Control</td>
                    <td className={`${styles.valueCell} ${styles.skeletonCell}`}></td>
                    <td className={`${styles.valueCell} ${styles.skeletonCell}`}></td>
                  </tr>
                  <tr>
                    <td className={styles.groupCell}>Variant A</td>
                    <td className={`${styles.valueCell} ${styles.skeletonCell}`}></td>
                    <td className={`${styles.valueCell} ${styles.skeletonCell}`}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // UPDATED: Modified loading handler to show skeleton content
  if (isInitialRender) {
    return renderSkeletonContent();
  }

  if (loading) {
    return renderSkeletonContent();
  }

  if (error)
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  if (experimentData.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyMessage}>
          No active or completed experiments found
        </div>
      </div>
    );
  }

  // Existing helper functions
  const getUniqueStatNames = (experiment) => {
    if (!experiment?.result) return [];
    const allStats = [];
    if (experiment.result.control) {
      allStats.push(...experiment.result.control.map((stat) => stat.name));
    }
    if (experiment.result.variant) {
      allStats.push(...experiment.result.variant.map((stat) => stat.name));
    }
    return [...new Set(allStats)];
  };

  const renderGroupRow = (groupName, metrics, statNames) => {
    if (!metrics) return null;
    return (
      <tr>
        <td className={styles.groupCell}>{groupName}</td>
        {statNames.map((statName) => {
          const stat = metrics.find((m) => m.name === statName);
          return (
            <td key={statName} className={styles.valueCell}>
              {stat ? `${stat.value} ${stat.unit}` : "-"}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className={styles.experimentSection}>
      {experimentData.map((experiment) => {
        const statNames = getUniqueStatNames(experiment);

        return (
          <div
            key={experiment._id}
            className={styles.bundleContainer}
            onClick={() => handleExperimentClick(experiment._id)}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.bundleTitle}>
              <div className={styles.titleWrapper}>
                <span className={styles.titleText}>{experiment.label}</span>
              </div>
              <div className={styles.clickIndicator}>
                <BarChart3 size={16} className="text-white opacity-60" />
                <span>Click to view graphs</span>
                {selectedExperimentId === experiment._id ? (
                  <ChevronUp size={16} className="text-white opacity-100" /> 
                ) : (
                  <ChevronDown size={16} className="text-white opacity-100" /> 
                )}
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.bundleTable}>
                <thead>
                  <tr className={styles.headerRow}>
                    <th>Test Group</th>
                    {statNames.map((statName) => (
                      <th key={statName}>{statName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={styles.glassEffect}>
                  {experiment.result?.control &&
                    renderGroupRow(
                      "Control",
                      experiment.result.control,
                      statNames
                    )}
                  {experiment.result?.variant &&
                    renderGroupRow(
                      "Variant A",
                      experiment.result.variant,
                      statNames
                    )}
                </tbody>
              </table>
            </div>

            {/* Graph section */}
            {selectedExperimentId === experiment._id && (
              <div className={styles.graphsContainer}>
                <div className={styles.graphContent}>
                  {loadingGraphs || !selectedGraphs ? (
                    <LoadingAnimation />
                  ) : (
                    <ExperimentGraphDisplay graphs={selectedGraphs} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}