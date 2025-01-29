"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import styles from "../../styles/ExperimentLaunch.module.css";

export default function ExperimentLaunch() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);
  }, []);

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.experimentGlass}>
            <div className={`${styles.glassEffect} ${isVisible ? styles.visible : ''}`}>
              <div className={styles.contentRow}>
                <div className={`${styles.rocketCircle} ${isVisible ? styles.animate : ''}`}>
                  <Image
                    src="/rocket.svg"
                    alt="Rocket Icon"
                    width={80}
                    height={80}
                    priority
                    className={styles.rocketIcon}
                  />
                </div>
                <h1 className={`${styles.launchTitle} ${isVisible ? styles.visible : ''}`}>
                  Experiment Successfully Launched!
                </h1>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}