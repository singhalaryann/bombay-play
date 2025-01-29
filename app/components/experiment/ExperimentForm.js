'use client';
import React, { useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from 'next/image';
import styles from '../../../styles/ExperimentForm.module.css';

const ExperimentForm = ({ experimentData, setExperimentData }) => {
  const [startDate, setStartDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleLabelChange = (e) => {
    setExperimentData(prev => ({
      ...prev,
      label: e.target.value
    }));
  };

  // CHANGED: Updated formatDate function to only return the selected day
  const formatDate = (date) => {
    if (!date) return '';
    // Instead of calculating difference with today's date,
    // we simply return the day number from selected date
    return `${date.getDate()} days`;
  };

  // CHANGED: Simplified handleDateChange to use the new formatDate
  const handleDateChange = (date) => {
    setStartDate(date);
    const formattedDuration = formatDate(date);
    setExperimentData(prev => ({
      ...prev,
      duration: formattedDuration
    }));
    setIsCalendarOpen(false);
  };

  const handleTrafficSplitChange = (value) => {
    setExperimentData(prev => ({
      ...prev,
      trafficSplit: value
    }));
  };

  return (
    <div className={styles.outerWrapper}>
      <div className={styles.glassContainer}>
        <div className={styles.experimentTag}>
          Experiment
        </div>

        {/* Label Input */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Label</label>
          <input
            type="text"
            className={styles.input}
            value={experimentData.label}
            onChange={handleLabelChange}
            placeholder="XG Warrior"
          />
        </div>

        {/* Duration Input with Calendar */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Experiment Duration</label>
          <div className={styles.durationWrapper}>
            <input
              type="text"
              className={`${styles.input} ${styles.durationInput}`}
              value={experimentData.duration || ''}
              readOnly
              placeholder="15 days"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            />
            <button 
              className={styles.calendarButton}
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
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

        {/* Traffic Split Slider */}
{/* Traffic Split Slider */}
<div className={styles.formGroup}>
  <label className={styles.label}>Traffic Split</label>
  <div className={styles.sliderContainer}>
    <div className={styles.sliderBox}>
    <div 
  className={styles.sliderTrack} 
>
  <div 
    className={styles.sliderFill}
    style={{
      width: `${experimentData.trafficSplit}%`
    }}
  />
</div>
      <input
        type="range"
        min="0"
        max="100"
        value={experimentData.trafficSplit}
        onChange={(e) => handleTrafficSplitChange(Number(e.target.value))}
        className={styles.slider}
      />
      <div 
        className={styles.sliderValue} 
        style={{ left: `calc(${experimentData.trafficSplit}% - 12px)` }}
      >
        {experimentData.trafficSplit}
      </div>
    </div>            <div className={styles.sliderLabels}>
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentForm;