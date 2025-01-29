"use client";
import React from "react";
import styles from "../../../styles/ExperimentContent.module.css";

export default function ExperimentContent() {
  return (
    <div className={styles.experimentSection}>
      {/* XG Warrior Bundle */}
      <div className={styles.bundleContainer}>
        <h2 className={styles.bundleTitle}>XG Warrior Bundle</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.bundleTable}>
            <thead>
              <tr className={styles.headerRow}>
                <th>Test Group</th>
                <th>Overall</th>
                <th>Daily Average</th>
                <th>Daily Average per User</th>
                <th>Overall Lift %</th>
                <th>P-Value</th>
              </tr>
            </thead>
            <tbody className={styles.glassEffect}>
              <tr>
                <td>Control (Control)</td>
                <td>11.01k</td>
                <td>51.70</td>
                <td>0.001057</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Variant A</td>
                <td>10.40k</td>
                <td>48.85</td>
                <td>0.001008</td>
                <td>-4.6% + 4.7%</td>
                <td>0.026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* XG Expert Bundle */}
      <div className={styles.bundleContainer}>
        <h2 className={styles.bundleTitle}>XG Expert Bundle</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.bundleTable}>
            <thead>
              <tr className={styles.headerRow}>
                <th>Test Group</th>
                <th>Overall</th>
                <th>Daily Average</th>
                <th>Daily Average per User</th>
                <th>Overall Lift %</th>
                <th>P-Value</th>
              </tr>
            </thead>
            <tbody className={styles.glassEffect}>
              <tr>
                <td>Control (Control)</td>
                <td>6.32k</td>
                <td>29.67</td>
                <td>0.000607</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>AA Group</td>
                <td>6.11k</td>
                <td>48.85</td>
                <td>0.000592</td>
                <td>-2.4% + 3.5%</td>
                <td>0.091</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}