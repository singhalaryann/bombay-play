"use client";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";
import styles from "../../../styles/ExperimentForm.module.css";

const ExperimentForm = ({ 
  experimentData, 
  segmentData, 
  setExperimentData,
  onSplitChange 
}) => {
  const [startDate, setStartDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Debug log for incoming data
  useEffect(() => {
    console.log("ExperimentForm - Current data:", {
      experimentData,
      segmentData
    });
  }, [experimentData, segmentData]);

  // UPDATED: Simplified date handling to use day directly as seconds
  const handleDateChange = (date) => {
    setStartDate(date);
    setIsCalendarOpen(false);
    
    // Get the selected day directly
    const selectedDay = date.getDate();
    const durationInSeconds = selectedDay * 24 * 60 * 60;
    
    console.log('Selected days:', selectedDay);
    console.log('Converted to seconds:', durationInSeconds);
    
    setExperimentData(prev => ({
      ...prev,
      duration: durationInSeconds
    }));
  };

  // Handle experiment label change
  const handleLabelChange = (e) => {
    setExperimentData(prev => ({
      ...prev,
      label: e.target.value
    }));
  };

  // UPDATED: Enhanced traffic split handling with direct group updates
  const handleSplitChange = (value) => {
    const splitValue = Number(value);
    console.log("Traffic split changed to:", splitValue);
    
    // Calculate traffic split for both groups based on total users
    const totalUsers = segmentData?.total_players || 0;
// Pure frontend calculation without state updates
const controlUsers = Math.round((splitValue / 100) * totalUsers);
const variantUsers = totalUsers - controlUsers;

    // Update experiment data with split and calculated users
    setExperimentData(prev => ({
      ...prev,
      split: splitValue,
      groups: {
        ...prev.groups,
        control: {
          ...prev.groups?.control,
          traffic_split: controlUsers
        },
        A: {
          ...prev.groups?.A,
          traffic_split: variantUsers
        }
      }
    }));
    onSplitChange(splitValue, controlUsers, variantUsers);
  };

  // Format segment data for display
  const formatSegmentDisplay = () => {
    if (!segmentData?.total_players) return "";
    return `All Users (${segmentData.total_players})`;
  };

  return (
    <div className={styles.outerWrapper}>
      {/* Label Row */}
      <div className={styles.rowGroup}>
        {/* Experiment Label */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Experiment Label</label>
          <input
            type="text"
            className={styles.input}
            value={experimentData?.label || ""}
            onChange={handleLabelChange}
            placeholder="Enter experiment label"
          />
        </div>

        {/* Duration with Calendar - UPDATED display logic */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Experiment Duration</label>
          <div className={styles.durationWrapper}>
            <input
              type="text"
              className={`${styles.input} ${styles.durationInput}`}
              value={startDate ? `${startDate.getDate()} days` : ""}
              placeholder="Select duration"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              readOnly
            />
            <button
              className={styles.calendarButton}
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              type="button"
            >
              <Image
                src="/calender.png"
                alt="Calendar"
                width={20}
                height={20}
                className={styles.calendarIcon}
              />
            </button>
            {isCalendarOpen && (
              <div className={styles.calendarContainer}>
                <DatePicker
                  selected={startDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  inline
                  calendarClassName={styles.calendar}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segment Information */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Users 
        </label>
        <input
          type="text"
          className={styles.input}
          value={formatSegmentDisplay()}
          readOnly
          disabled
        />
      </div>

      {/* Traffic Split Slider */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Traffic Split 
        </label>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderBox}>
            <div className={styles.sliderTrack}>
              <div
                className={styles.sliderFill}
                style={{
                  width: `${experimentData?.split || 0}%`
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={experimentData?.split || 0}
              onChange={(e) => handleSplitChange(e.target.value)}
              className={styles.slider}
            />
            <div
              className={styles.sliderBubble}
              style={{
                left: `calc(${experimentData?.split || 0}% - 15px)`
              }}
            >
              {experimentData?.split || 0}%
            </div>
          </div>
          <div className={styles.sliderLabels}>
            <span>0%</span>
            <span>20%</span>
            <span>40%</span>
            <span>60%</span>
            <span>80%</span>
            <span>100%</span>
          </div>
        </div>
        {/* Real-time split display */}
        {/* <div className={styles.splitInfo}>
          Control Group: {Math.round((experimentData?.split || 0) * (segmentData?.total_players || 0) / 100)} users
          <br />
          Variant A: {Math.round((100 - (experimentData?.split || 0)) * (segmentData?.total_players || 0) / 100)} users
        </div> */}
      </div>
    </div>
  );
};

export default ExperimentForm;