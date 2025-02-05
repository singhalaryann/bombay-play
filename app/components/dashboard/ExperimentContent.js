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

        const experimentsResults = await Promise.allSettled(experimentsPromises);

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

  const getUniqueStatNames = (experiment) => {
    if (!experiment?.result) return [];
    const allStats = [];
    if (experiment.result.control) {
      allStats.push(...experiment.result.control.map(stat => stat.name));
    }
    if (experiment.result.variant) {
      allStats.push(...experiment.result.variant.map(stat => stat.name));
    }
    return [...new Set(allStats)];
  };

  const renderGroupRow = (groupName, metrics, statNames) => {
    if (!metrics) return null;

    return (
      <tr>
        <td className={styles.groupCell}>{groupName}</td>
        {statNames.map(statName => {
          const stat = metrics.find(m => m.name === statName);
          return (
            <td key={statName} className={styles.valueCell}>
              {stat ? `${stat.value} ${stat.unit}` : '-'}
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
          <div key={experiment._id} className={styles.bundleContainer}>
            <h2 className={styles.bundleTitle}>{experiment.label}</h2>

            <div className={styles.tableWrapper}>
              <table className={styles.bundleTable}>
                <thead>
                  <tr className={styles.headerRow}>
                    <th>Test Group</th>
                    {statNames.map(statName => (
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
                    renderGroupRow("Variant A", experiment.result.variant, statNames)}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}