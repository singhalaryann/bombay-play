"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/ExperimentContent.module.css";

export default function ExperimentContent({ userId }) {
  const [experimentData, setExperimentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExperiments = async () => {
      if (!userId) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching experiments for user:", userId);
        const userExperimentsResponse = await fetch("https://get-user-experiments-q54hzgyghq-uc.a.run.app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId })
        });

        if (!userExperimentsResponse.ok) {
          throw new Error("Failed to fetch user experiments");
        }

        const userExperiments = await userExperimentsResponse.json();
        console.log("User experiments received:", userExperiments);

        if (!userExperiments.experiment_ids?.length) {
          console.log("No experiments found for user");
          setExperimentData([]);
          setLoading(false);
          return;
        }

        const experimentsPromises = userExperiments.experiment_ids.map(async (id) => {
          const response = await fetch("https://get-experiment-q54hzgyghq-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experiment_id: id })
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch experiment ${id}`);
          }

          return response.json();
        });

        const experimentsResults = await Promise.all(experimentsPromises);
        console.log("All experiments data:", experimentsResults);

        // Filter active/complete experiments
        const validExperiments = experimentsResults
          .filter(exp => {
            const status = exp.experiment?.status;
            return status === "active" || status === "complete";
          })
          .map(exp => exp.experiment);

        console.log("Filtered valid experiments:", validExperiments);
        setExperimentData(validExperiments);
        setError(null);
      } catch (err) {
        console.error("Error fetching experiments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiments();
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading experiments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (experimentData.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyMessage}>No active or completed experiments found</div>
      </div>
    );
  }

  // Helper function to render table rows for a group
  const renderGroupRows = (groupName, metrics) => {
    return metrics.map((metric, index) => (
      <tr key={`${groupName}-${index}`}>
        {/* Only show group name in first row of each group */}
        {index === 0 && (
          <td rowSpan={metrics.length} className={styles.groupCell}>
            {groupName}
          </td>
        )}
        <td className={styles.nameCell}>{metric.name}</td>
        <td className={styles.valueCell}>{metric.value}</td>
      </tr>
    ));
  };

  return (
    <div className={styles.experimentSection}>
      {experimentData.map((experiment) => (
        <div key={experiment._id} className={styles.bundleContainer}>
          {/* Experiment Label as Title */}
          <h2 className={styles.bundleTitle}>{experiment.label}</h2>

          {/* Status and Segment Info */}
          {/* <div className={styles.experimentInfo}>
            <span>Status: {experiment.status}</span>
            <span>Segment: {experiment.segment_id}</span>
          </div> */}

          {/* Results Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.bundleTable}>
              <thead>
                <tr className={styles.headerRow}>
                  <th>Test Group</th>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody className={styles.glassEffect}>
                {/* Control Group Rows */}
                {experiment.result?.control && 
                  renderGroupRows('Control', experiment.result.control)
                }
                {/* Variant A Rows */}
                {experiment.result?.A && 
                  renderGroupRows('Variant A', experiment.result.A)
                }
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}