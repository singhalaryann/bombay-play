"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ExperimentForm from "../components/experiment/ExperimentForm";
import VariantGroup from "../components/experiment/VariantGroup";
import Image from "next/image";
import styles from "../../styles/Experiment.module.css";
import { useRouter } from "next/navigation";

export default function ExperimentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const chatId = searchParams.get("chat");
  const idsParam = searchParams.get("ids");
  const experimentIds = idsParam ? idsParam.split(",") : [];

  // State management
  const [activeExperimentId, setActiveExperimentId] = useState(
    experimentIds[0]
  );
  const [experimentData, setExperimentData] = useState(null);
  const [segmentData, setSegmentData] = useState(null);
  const [offerData, setOfferData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch experiment details when active ID changes
  useEffect(() => {
    const fetchExperimentDetails = async () => {
      if (!activeExperimentId) return;

      try {
        setLoading(true);
        console.log("Fetching details for experiment:", activeExperimentId);

        const response = await fetch(
          "https://get-experiment-q54hzgyghq-uc.a.run.app",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experiment_id: activeExperimentId }),
          }
        );

        if (!response.ok) throw new Error("Failed to fetch experiment details");

        const data = await response.json();
        if (!data.experiment) throw new Error("No experiment data received");

        console.log("Received experiment data:", data.experiment);
        setExperimentData(data.experiment);
        setError(null);
      } catch (err) {
        console.error("Error fetching experiment details:", err);
        setError(err.message);
      }
    };

    fetchExperimentDetails();
  }, [activeExperimentId]);

  // Fetch all details in parallel
  // Fetch all details in parallel
  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!experimentData) return;  // <-- Add early return
     // Only set loading for initial data fetch, not slider updates
     if (!segmentData || !offerData) {
      setLoading(true);
    }
      console.log("Fetching additional details for experiment");

      try {
        const fetchPromises = [];

        // Add segment fetch
        if (experimentData?.segment_id) {
          fetchPromises.push(
            fetch("https://get-segment-q54hzgyghq-uc.a.run.app", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ segment_id: experimentData.segment_id }),
            })
          );
        }

        // Add offer fetches for both groups
        // CHANGED: now we grab the top-level offer_id instead of inside groups
        // Now we grab the offer IDs from each group (control, A) instead of the top level
        const controlOfferId = experimentData.groups?.control?.offer_id;
        if (controlOfferId) {
          fetchPromises.push(
            fetch("https://get-offer-q54hzgyghq-uc.a.run.app", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ offer_id: controlOfferId }),
            })
          );
        }

        const variantOfferId = experimentData.groups?.A?.offer_id;
        if (variantOfferId) {
          fetchPromises.push(
            fetch("https://get-offer-q54hzgyghq-uc.a.run.app", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ offer_id: variantOfferId }),
            })
          );
        }

        if (fetchPromises.length === 0) {
          setLoading(false);
          return;
        }

        const responses = await Promise.all(fetchPromises);

        responses.forEach((response) => {
          if (!response.ok) throw new Error("Failed to fetch data");
        });

        const responseData = await Promise.all(responses.map((r) => r.json()));

        // First response is always segment data
        setSegmentData(responseData[0].segment);

        // Next responses are offer data
        // Next response is the single top-level offer data (using topLevelOfferId)
        // First item in responseData is the segment data
        const segmentRes = responseData[0];
        setSegmentData(segmentRes.segment);

        // Next items (if present) are the control and variant offers
        if (responseData.length === 3) {
          const [, controlRes, variantRes] = responseData;
          setOfferData({
            control: controlRes.offer,
            variant: variantRes.offer,
          });
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [experimentData]);

  const handleTabClick = (experimentId) => {
    setActiveExperimentId(experimentId);
  };

  const handleAddVariant = () => {
    console.log("Add Variant clicked");
  };

  const handleLaunchExperiment = async () => {
    try {
      if (experimentData.status !== "active") {
        console.log("Cannot launch: Experiment is not active");
        setError("Cannot launch experiment: Status is not active");
        return;
      }

      const duration = experimentData.duration || 60; // Use experiment duration or default to 60

      const response = await fetch(
        "https://set-experiment-q54hzgyghq-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experiment_id: activeExperimentId,
            split: experimentData.split,
            duration: duration,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to launch experiment");

      const data = await response.json();
      console.log("Launch experiment response:", data);

      if (data.success) {
        router.push("/experiment-launch");
        setTimeout(() => {
          router.push("/components/experimentcontent");
        }, 5000);
      }
    } catch (err) {
      console.error("Error launching experiment:", err);
      setError(err.message);
    }
  };

  const calculateTrafficSplit = (totalUsers, splitPercentage) => {
    if (!totalUsers || !splitPercentage) return { control: 0, variant: 0 };

    const controlUsers = Math.round((splitPercentage / 100) * totalUsers);
    const variantUsers = totalUsers - controlUsers;

    return { control: controlUsers, variant: variantUsers };
  };

  const handleSplitUpdate = (splitValue, controlUsers, variantUsers) => {
    if (!segmentData?.total_players) return;

    const { control, variant } = calculateTrafficSplit(
      segmentData.total_players,
      splitValue
    );

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
  };

  // Error and loading states remain the same
  if (error) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.mainLayout}>
          <Sidebar />
          <main className={styles.mainContent}>
            <div className={styles.errorWrapper}>
              <div className={styles.error}>{error}</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <h2 className={styles.pageTitle}>Setting up Experiments</h2>

          <div className={styles.tabContainer}>
            {experimentIds.map((expId, index) => (
              <div
                key={expId}
                className={`${styles.tab} ${
                  activeExperimentId === expId ? styles.activeTab : ""
                }`}
                onClick={() => handleTabClick(expId)}
              >
                Experiment {index + 1}
              </div>
            ))}
          </div>

          <div className={styles.tabUnderline}>
            <div
              className={styles.activeUnderline}
              style={{
                left: `${
                  (experimentIds.indexOf(activeExperimentId) /
                    experimentIds.length) *
                  100
                }%`,
                width: `${100 / experimentIds.length}%`,
              }}
            />
          </div>

          <div className={styles.scrollableSection}>
            <div className={styles.glassWrapper}>
              {loading ? (
                <div className={styles.loadingWrapper}>
                  <div className={styles.loading}>Loading...</div>
                </div>
              ) : (
                experimentData && (
                  <>
                    <ExperimentForm
                      experimentData={experimentData}
                      segmentData={segmentData}
                      setExperimentData={setExperimentData}
                      onSplitChange={handleSplitUpdate}
                    />
                    <VariantGroup
                      experimentData={experimentData}
                      offerData={offerData}
                    />
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
                        disabled={experimentData.status !== "active"}
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
                  </>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
