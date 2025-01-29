'use client';
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ExperimentForm from '../components/experiment/ExperimentForm';
import VariantGroup from '../components/experiment/VariantGroup';
import Image from 'next/image';
import styles from '../../styles/Experiment.module.css';
import { useRouter } from 'next/navigation';

export default function ExperimentPage() {
  const [experimentData, setExperimentData] = useState({
    label: 'XG Warrior',
    duration: '15 days',
    trafficSplit: 40,
  });

  const handleAddVariant = () => {
    console.log('Add Variant clicked');
  };

  const router = useRouter();
  const handleLaunchExperiment = () => {
    router.push('/experiment-launch');
  };
  
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            {/* Form Section */}
            <ExperimentForm 
              experimentData={experimentData}
              setExperimentData={setExperimentData}
            />

            {/* Variant Groups */}
            <VariantGroup />

            {/* Footer Buttons */}
            <div className={styles.buttonGroup}>
              <button 
                className={styles.addVariantButton}
                onClick={handleAddVariant}
              >
                + Add Variant
              </button>
              <button 
                className={styles.launchButton}
                onClick={handleLaunchExperiment}
              >
                Launch Experiment
                <Image 
                  src="/experiment.png"
                  alt="Launch"
                  width={24}
                  height={24}
                  priority
                />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}