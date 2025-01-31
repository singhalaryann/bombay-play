"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/ExperimentContent.module.css";

export default function ExperimentContent({ userId }) {
  const [experimentData, setExperimentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchExperiments = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
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

        const validExperiments = experimentsResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value.experiment)
          .filter(
            (exp) => exp?.status === "active" || exp?.status === "complete"
          );

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
        <div className={styles.emptyMessage}>
          No active or completed experiments found
        </div>
      </div>
    );
  }

  const renderGroupRows = (groupName, metrics) => {
    if (!metrics) return null;

    return metrics.map((metric, index) => (
      <tr key={`${groupName}-${index}`}>
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
          <h2 className={styles.bundleTitle}>{experiment.label}</h2>

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
                {experiment.result?.control &&
                  renderGroupRows("Control", experiment.result.control)}
                {experiment.result?.A &&
                  renderGroupRows("Variant A", experiment.result.A)}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
