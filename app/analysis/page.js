"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ChatInterface from "../components/analysis/ChatInterface";
import MetricsDisplay from "../components/analysis/MetricsDisplay";
import GraphDisplay from "../components/analysis/GraphDisplay";
import styles from "../../styles/Analysis.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Helper function to transform the API metrics into the shape GraphDisplay expects
function convertMetricsToGraphs(metrics) {
  // Simply copy all the relevant fields and rename them properly
  return metrics.map((m) => {
    return {
      metric_type: m.metric_type, // GraphDisplay checks this to decide chart type
      metric_id: m.metric_id,
      title: m.title,
      columns: m.columns,
      values: m.values,
      // Extra fields for completeness
      x_unit: "",
      y_unit: "",
      value_unit: "",
    };
  });
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // State for dynamic metrics and graphs
  const [dynamicMetrics, setDynamicMetrics] = useState([]);
  const [dynamicGraphs, setDynamicGraphs] = useState([]);

  const [isNavigating, setIsNavigating] = useState(false); // Add this state

  // 1) Modified handleContinue to fetch experiment IDs using chatId
  //    and then pass them to /experiment in the URL.

  const handleContinue = async () => {
    setIsNavigating(true); // Set loading state
    const chatId = searchParams.get("chat");
    if (!chatId) {
      console.error("No chatId found in the URL!");
      setIsNavigating(false);
      return;
    }

    try {
      // Call the get-experiments API with chatId
      const response = await fetch(
        "https://create-experiment-flnr5jia5q-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,  // Added user_id
            chat_id: chatId,
            segment_ids: ["1", "2"]  // Added segment_ids array
             }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch experiment IDs");
      }

      const data = await response.json();
      console.log("Received experiment IDs:", data.experiment_ids);

      // Convert array of IDs to a comma-separated string for the query param
      const idsParam = data.experiment_ids.join(",");

      // Now navigate to /experiment, including both chatId AND idsParam
      router.push(`/experiment?chat=${chatId}&ids=${idsParam}`);
    } catch (err) {
      console.error("Error fetching experiment IDs:", err);
      setError("Failed to load experiments. Please try again."); // Show error to user
      setIsNavigating(false);
    }
  };

  // Handle new metrics coming from the chat interface
  const handleMetricsUpdate = (newMetrics) => {
    console.log("Setting new metrics:", newMetrics);

    // Keep only the "metric" ones for MetricsDisplay
    const filteredMetrics = newMetrics.filter(
      (m) => m.metric_type === "metric"
    );
    setDynamicMetrics(filteredMetrics); // Replace entirely

    // Convert any line/bar/pie metrics into graph objects
    const graphCandidates = newMetrics.filter(
      (m) =>
        m.metric_type === "line" ||
        m.metric_type === "bar" ||
        m.metric_type === "pie" ||
        m.metric_type === "hist"
    );
    const newGraphs = convertMetricsToGraphs(graphCandidates);

    // Reset and set the new graphs
    setDynamicGraphs(newGraphs);
  };

  // Handle new graphs (if needed separately)
  const handleGraphsUpdate = (newGraphs) => {
    console.log("Updating graphs:", newGraphs);
    setDynamicGraphs((prevGraphs) => [...prevGraphs, ...newGraphs]);
  };

  // On initial load, fetch the chat data from the given chatId
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const chatId = searchParams.get("chat");
        console.log("Fetching chat data with:", { userId, chatId });

        if (!userId || !chatId) {
          throw new Error("Missing required parameters");
        }

        const response = await fetch(
          "https://get-chat-q54hzgyghq-uc.a.run.app",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: chatId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch chat data");
        }

        const data = await response.json();
        console.log("Received chat data:", data);
        setChatData(data);
      } catch (error) {
        console.error("Error fetching chat data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchChatData();
    }
  }, [userId, searchParams]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.mainLayout}>
          <Sidebar />
          <main className={styles.mainContent}>
            <div className={styles.loadingWrapper}>
              <div className={styles.loading}>Loading...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.mainLayout}>
          <Sidebar />
          <div className={styles.errorWrapper}>
            <div className={styles.error}>Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Convert the initial chatData.metrics to graph format (line/bar/pie/hist)
  let initialGraphs = [];
  if (chatData?.metrics) {
    const graphCandidates = chatData.metrics.filter(
      (m) =>
        m.metric_type === "line" ||
        m.metric_type === "bar" ||
        m.metric_type === "pie" ||
        m.metric_type === "hist"
    );
    initialGraphs = convertMetricsToGraphs(graphCandidates);
  }

  // Merge original metrics with any dynamic updates (avoid duplicates)
  const combinedMetrics = (() => {
    const originalMetrics = chatData?.metrics || [];
    const combined = [...originalMetrics];

    dynamicMetrics.forEach((newMetric) => {
      const existingIndex = combined.findIndex(
        (m) => m.metric_id === newMetric.metric_id
      );
      if (existingIndex >= 0) {
        // Replace existing metric with the updated one
        combined[existingIndex] = newMetric;
      } else {
        // Otherwise just add it
        combined.push(newMetric);
      }
    });
    return combined;
  })();

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <div className={styles.contentLayout}>
              <div className={styles.leftPanel}>
                <div className={styles.chatSection}>
                  <ChatInterface
                    messages={chatData?.chat || []}
                    ideaId={searchParams.get("idea")}
                    insightId={searchParams.get("insight")}
                    userId={userId}
                    chatId={searchParams.get("chat")}
                    ideaDescription={chatData?.idea_description}
                    onMetricsUpdate={handleMetricsUpdate}
                    onGraphsUpdate={handleGraphsUpdate}
                  />
                </div>
              </div>

              <div className={styles.rightPanel}>
                {/* Continue button triggers handleContinue */}
                <div className={styles.continueButtonContainer}>
                <button
 className={styles.continueButton}
 onClick={handleContinue}
 disabled={isNavigating}
>
 <span>{isNavigating ? 'Loading...' : 'Continue'}</span>
 <div className={styles.iconWrapper}>
   <Image
     src="/Analyse_icon.svg"
     alt="Continue"
     width={24} 
     height={24}
     className={styles.buttonIcon}
     priority
   />
 </div>
</button>
                </div>

                {/* Show metrics (filter for single-value "metric" type) */}
                <MetricsDisplay
                  metrics={combinedMetrics?.filter(
                    (m) => m.metric_type === "metric" && m.values?.length === 1
                  )}
                />

                {/* If chatData already has its own graphs, show them.
                    Else show the ones from our conversion plus dynamic ones. */}
                <GraphDisplay
                  graphs={
                    chatData?.graphs?.length > 0
                      ? chatData.graphs
                      : [...initialGraphs, ...dynamicGraphs]
                  }
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
