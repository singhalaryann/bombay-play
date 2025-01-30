"use client";
import React from "react";
import styles from "../../../styles/VariantGroup.module.css";

const VariantGroup = ({ experimentData, offerData }) => {
  // Debug logging
  console.log("VariantGroup received props:", {
    experimentData,
    offerData
  });

  if (!experimentData?.groups) {
    return <div>Loading variant data...</div>;
  }

  const { control, A } = experimentData.groups;

  const renderVariantSection = (groupData, title, isControl = false) => {
    const groupOfferData = isControl ? offerData?.control : offerData?.variant;
    const trafficSplit = groupData?.traffic_split || 0;

    return (
      <div className={styles.variantGroup}>
        {/* Variant Title */}
        <div className={styles.variantTitleContainer}>
          <span className={styles.variantTitle}>{title}</span>
        </div>

        <div className={styles.variantContent}>
          {/* Bundle Name */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Bundle Name</label>
            {/* Bundle Name: now using the experiment’s label */}
            <input
              type="text"
              className={styles.input}
              value={experimentData?.label || ""}
              readOnly
            />
          </div>

          {/* Traffic Split Display */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Traffic Split</label>
            <input
              type="text"
              className={styles.input}
              value={`${trafficSplit} users`}
              readOnly
            />
          </div>

          {/* Offer ID */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Offer ID</label>
            {/* Offer ID: now using the top-level experimentData.offer_id */}
            <input
              type="text"
              className={styles.input}
              value={groupData?.offer_id || ""}
              readOnly
            />
          </div>

          {/* Items Table */}
          <div className={styles.glassBox}>
            <table className={styles.featureTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Name</th>
                  <th className={styles.tableHeader}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {groupOfferData?.items?.length > 0 ? (
                  groupOfferData.items.map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td className={styles.tableCell}>{item.name}</td>
                      <td
                        className={`${styles.tableCell} ${styles.quantityCell}`}
                      >
                        {item.amount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className={styles.tableCell}>
                      No items available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.variantSection}>
      {/* Render Control Group */}
      {control && renderVariantSection(control, "Control Group", true)}

      {/* Render Variant A */}
      {A && renderVariantSection(A, "Variant A", false)}

      {/* Show message if no variants available */}
      {!control && !A && (
        <div className={styles.noVariants}>No variant groups available</div>
      )}
    </div>
  );
};

export default VariantGroup;
