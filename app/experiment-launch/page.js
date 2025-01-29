"use client";
import React from "react";
import Image from "next/image";

// Import your existing Header and Sidebar
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

// Import the updated CSS module below
import styles from "../../styles/ExperimentLaunch.module.css";

export default function ExperimentLaunch() {
  return (
    <div className={styles.container}>
      {/* 1) Header at the top */}
      <Header />

      {/* 2) Main layout: Sidebar on the left, main content on the right */}
      <div className={styles.mainLayout}>
        <Sidebar />

        <main className={styles.mainContent}>
          <div className={styles.experimentGlass}>
            {/* The large glass-effect rectangle */}
            <div className={styles.glassEffect}>
              <div className={styles.contentRow}>
                {/* The circular glass around the rocket */}
                <div className={styles.rocketCircle}>
                  <Image
                    src="/rocket.svg"
                    alt="Rocket Icon"
                    width={80}
                    height={80}
                    priority
                  />
                </div>

                {/* Success text */}
                <h1 className={styles.launchTitle}>
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
