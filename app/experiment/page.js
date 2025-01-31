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

  const [activeExperimentId, setActiveExperimentId] = useState(
    experimentIds[0] || null
  );
  const [experimentData, setExperimentData] = useState(null);
  const [segmentData, setSegmentData] = useState(null);
  const [offerData, setOfferData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // CHANGED: We removed the original two separate useEffect calls and combined them here.
  //          Now we only set `loading` once at the start, and turn it off at the end.
  useEffect(() => {
    let isSubscribed = true;

    // CHANGED: Single async function to handle both experiment fetch & subsequent segment/offer fetch
    const fetchAllData = async () => {
      setLoading(true); // CHANGED: Only set loading once
      setError(null);

      try {
        if (!activeExperimentId) {
          // If there's no active experiment, we can't fetch
          setLoading(false);
          return;
        }

        // 1) Fetch the main experiment data
        console.log("Starting experiment fetch with ID:", activeExperimentId);
        const expResponse = await fetch(
          "https://get-experiment-q54hzgyghq-uc.a.run.app",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experiment_id: activeExperimentId }),
          }
        );

        if (!expResponse.ok) {
          throw new Error(
            `Failed to fetch experiment details: ${expResponse.statusText}`
          );
        }

        const expData = await expResponse.json();
        if (!expData.experiment) {
          throw new Error("No experiment data received");
        }

        // Set experiment data
        if (isSubscribed) {
          console.log("Experiment Status:", expData.experiment.status);
          setExperimentData(expData.experiment);
        }

        // 2) Prepare to fetch segment/offers in parallel if needed
        const fetchPromises = [];

        if (expData.experiment?.segment_id) {
          fetchPromises.push(
            fetch("https://get-segment-q54hzgyghq-uc.a.run.app", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                segment_id: expData.experiment.segment_id,
              }),
            })
          );
        }

        const controlOfferId = expData.experiment.groups?.control?.offer_id;
        const variantOfferId = expData.experiment.groups?.A?.offer_id;

        if (controlOfferId) {
          fetchPromises.push(
            fetch("https://get-offer-q54hzgyghq-uc.a.run.app", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ offer_id: controlOfferId }),
            })
          );
        }

        if (variantOfferId) {
          fetchPromises.push(
            fetch("https://get-offer-q54hzgyghq-uc.a.run.app", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ offer_id: variantOfferId }),
            })
          );
        }

        // 3) Fetch those in parallel (if there are any)
        if (fetchPromises.length > 0) {
          const responses = await Promise.all(fetchPromises);
          responses.forEach((response, index) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch data for request ${index + 1}`);
            }
          });

          const responseData = await Promise.all(
            responses.map((r) => r.json())
          );

          // 4) Map responses to the correct data sets
          //    The first successful fetch might be segment if present,
          //    followed by up to two offer fetches, depending on the order you pushed them.

          if (isSubscribed) {
            // If the first fetchPromises was segment, it's responseData[0] if present
            if (responseData[0]?.segment) {
              setSegmentData(responseData[0].segment);
            }

            // If we have three fetches, that means segment + 2 offers
            if (responseData.length === 3) {
              const [, controlRes, variantRes] = responseData;
              setOfferData({
                control: {
                  ...controlRes.offer,
                  name: controlRes.offer?.name || "No Bundle Name",
                },
                variant: {
                  ...variantRes.offer,
                  name: variantRes.offer?.name || "No Bundle Name",
                },
              });
            }
            // NOTE: If you have a different array order or fewer fetches, adjust accordingly
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isSubscribed) {
          setError(err.message);
        }
      } finally {
        // CHANGED: Only clear loading once at the very end of the combined fetch
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isSubscribed = false;
    };
  }, [activeExperimentId]); // CHANGED: No second effect here

  // CHANGED: Removed the second useEffect altogether
  const handleTabClick = (experimentId) => {
    setActiveExperimentId(experimentId);
  };

  const handleLaunchExperiment = async () => {
    try {
      if (!experimentData) {
        setError("Missing experiment data");
        return;
      }

      // Check for pending status
      if (experimentData.status !== "pending") {
        setError("Cannot launch: Experiment must be in pending state");
        return;
      }

      if (!experimentData.split || !experimentData.duration) {
        setError("Missing required split or duration values");
        return;
      }

      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://set-experiment-q54hzgyghq-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experiment_id: activeExperimentId,
            split: experimentData.split,
            duration: experimentData.duration,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to launch experiment");
      }

      const data = await response.json();
      console.log("Launch response:", data);

      if (data.success) {
        router.push("/experiment-launch");
      } else {
        throw new Error("Launch failed: No success confirmation");
      }
    } catch (err) {
      console.error("Launch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitUpdate = (splitValue, controlUsers, variantUsers) => {
    if (!segmentData?.total_players) return;

    setExperimentData((prev) => ({
      ...prev,
      split: splitValue,
      groups: {
        ...prev.groups,
        control: {
          ...prev.groups?.control,
          traffic_split: controlUsers,
        },
        A: {
          ...prev.groups?.A,
          traffic_split: variantUsers,
        },
      },
    }));
  };

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
            <div className={styles.tabHeader}>
              {experimentIds.map((expId, index) => (
                <button
                  key={expId}
                  className={`${styles.tab} ${
                    activeExperimentId === expId ? styles.activeTab : ""
                  }`}
                  onClick={() => handleTabClick(expId)}
                >
                  Experiment {index + 1}
                </button>
              ))}
            </div>
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
            {loading ? (
              // Loading state without glass effect
              <div className={styles.loadingWrapper}>
                <div className={styles.loading}>Loading...</div>
              </div>
            ) : (
              // Main content with glass effect
              experimentData && (
                <div className={styles.glassWrapper}>
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
                      className={styles.launchButton}
                      onClick={handleLaunchExperiment}
                      disabled={experimentData.status !== "pending"}
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
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
