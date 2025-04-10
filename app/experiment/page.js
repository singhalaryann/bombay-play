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
import LoadingAnimation from "../components/common/LoadingAnimation";

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
  const [offerData, setOfferData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ADDED: New state for tracking initial render
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // ADDED: New state for tracking launch button loading state
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ADDED: Mark initial render as completed
        setIsInitialRender(false);

        if (!activeExperimentId) {
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

        // 2) Prepare to fetch offers
        const fetchPromises = [];
        const controlOfferId = expData.experiment.groups?.control?.offer_id;
        const variantOfferId = expData.experiment.groups?.variant?.offer_id;

        // CHANGED: Simplified offer fetching logic
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

        // 3) Fetch offers in parallel
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

          // CHANGED: Simplified offer data mapping
          if (isSubscribed) {
            const newOfferData = {};

            // If controlOfferId is present, assume the first fetch promise corresponds to it
            if (controlOfferId) {
              const controlRes = responseData[0];
              newOfferData.control = {
                ...controlRes.offer,
                name: controlRes.offer?.offer_name || "No Bundle Name",
              };
            }

            // If variantOfferId is present, figure out which response index to use
            // (index 1 if both control and variant exist, otherwise index 0)
            if (variantOfferId) {
              const variantIndex = controlOfferId ? 1 : 0;
              const variantRes = responseData[variantIndex];
              newOfferData.variant = {
                ...variantRes.offer,
                name: variantRes.offer?.offer_name || "No Bundle Name",
              };
            }

            // Updated part: now handles cases where only one offer_id exists
            setOfferData(newOfferData);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isSubscribed) {
          setError(err.message);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isSubscribed = false;
    };
  }, [activeExperimentId]);

  // CHANGED: Removed the second useEffect altogether
  const handleTabClick = (experimentId) => {
    setActiveExperimentId(experimentId);
  };

  const handleLaunchExperiment = async () => {
    try {
      console.log("Starting launch for experiments:", experimentIds);

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

      // CHANGED: Use isLaunching state instead of general loading
      setIsLaunching(true);
      setError(null);

      // NEW: Launch all experiments in parallel
      const launchPromises = experimentIds.map((id) => {
        console.log(
          `Attempting to launch ID: ${id} with split:${experimentData.split}, duration:${experimentData.duration}`
        );
        return fetch("https://set-experiment-q54hzgyghq-uc.a.run.app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experiment_id: id,
            split: experimentData.split,
            duration: experimentData.duration,
          }),
        });
      });

      // NEW: Wait for all launches to complete
      const responses = await Promise.all(launchPromises);
      const results = await Promise.all(responses.map((r) => r.json()));
      console.log("Launch results:", results);

      // NEW: Check if all experiments launched successfully
      const allSuccessful = results.every((data) => data.success);

      if (allSuccessful) {
        router.push("/experiment-launch");
      } else {
        throw new Error("One or more experiments failed to launch");
      }
    } catch (err) {
      console.error("Launch error:", err);
      setError(err.message);
    } finally {
      // CHANGED: Reset isLaunching state instead of general loading
      setIsLaunching(false);
    }
  };
  
  const handleSplitUpdate = (splitValue, controlUsers, variantUsers) => {
    if (!experimentData?.total_players) return;

    setExperimentData((prev) => ({
      ...prev,
      split: splitValue,
      groups: {
        ...prev.groups,
        control: {
          ...prev.groups?.control,
          traffic_split: controlUsers,
        },
        // Updated part: replaced "A" with "variant" to match the real group name
        variant: {
          ...prev.groups?.variant,
          traffic_split: variantUsers,
        },
      },
    }));
  };

  // ADDED: Render skeleton content function
  const renderSkeletonContent = () => {
    return (
      <>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Setting up Experiments</h2>

          <div className={styles.tabContainer}>
            <div className={styles.tabHeader}>
              {[1, 2].map((index) => (
                <button
                  key={index}
                  className={`${styles.tab} ${index === 1 ? styles.activeTab : ""}`}
                >
                  Experiment {index}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.tabUnderline}>
          <div
            className={styles.activeUnderline}
            style={{
              left: '0%',
              width: '50%',
            }}
          />
        </div>

        <div className={styles.scrollableSection}>
          <div className={`${styles.glassWrapper} ${styles.skeletonGlass}`}>
            {/* Skeleton experiment form */}
            <div className={styles.skeletonForm}>
              <div className={styles.skeletonFormTitle}></div>
              
              <div className={styles.skeletonFormRow}>
                <div className={styles.skeletonFormLabel}></div>
                <div className={styles.skeletonFormInput}></div>
              </div>
              
              <div className={styles.skeletonFormRow}>
                <div className={styles.skeletonFormLabel}></div>
                <div className={styles.skeletonFormRange}></div>
              </div>
              
              <div className={styles.skeletonFormRow}>
                <div className={styles.skeletonFormLabel}></div>
                <div className={styles.skeletonFormInput}></div>
              </div>
            </div>
            
            {/* Skeleton variant groups */}
            <div className={styles.skeletonVariant}>
              <div className={styles.skeletonVariantHeader}>
                <div className={styles.skeletonVariantTitle}></div>
                <div className={styles.skeletonVariantBadge}></div>
              </div>
              
              <div className={styles.skeletonVariantContent}>
                <div className={styles.skeletonVariantItem}></div>
                <div className={styles.skeletonVariantItem}></div>
                <div className={styles.skeletonVariantItem}></div>
              </div>
            </div>
            
            <div className={styles.skeletonVariant}>
              <div className={styles.skeletonVariantHeader}>
                <div className={styles.skeletonVariantTitle}></div>
                <div className={styles.skeletonVariantBadge}></div>
              </div>
              
              <div className={styles.skeletonVariantContent}>
                <div className={styles.skeletonVariantItem}></div>
                <div className={styles.skeletonVariantItem}></div>
                <div className={styles.skeletonVariantItem}></div>
              </div>
            </div>
            
            {/* Skeleton button */}
            <div className={styles.buttonGroup}>
              <div className={styles.skeletonButton}></div>
            </div>
          </div>
        </div>
      </>
    );
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
          {/* UPDATED: Show skeleton content when loading or initial render */}
          {isInitialRender || loading ? (
            renderSkeletonContent()
          ) : (
            <>
              <div className={styles.pageHeader}>
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
                {/* Main content with glass effect */}
                {experimentData && (
                  <div className={styles.glassWrapper}>
                    <ExperimentForm
                      experimentData={experimentData}
                      totalPlayers={experimentData?.total_players || 0} // Changed: Pass total_players directly
                      setExperimentData={setExperimentData}
                      onSplitChange={handleSplitUpdate}
                    />
                    <VariantGroup
                      experimentData={experimentData}
                      offerData={offerData}
                    />
                    <div className={styles.buttonGroup}>
                      {/* UPDATED: Modified button to show launching state */}
                      <button
                        className={styles.launchButton}
                        onClick={handleLaunchExperiment}
                        disabled={experimentData.status !== "pending" || isLaunching}
                      >
                        {isLaunching ? 'Launching...' : 'Launch Experiment'}
                        {!isLaunching && (
                          <Image
                            src="/experiment.png"
                            alt="Launch"
                            width={24}
                            height={24}
                            priority
                          />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}