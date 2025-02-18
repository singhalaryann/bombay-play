"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/knowledgebase/SocialMedia.module.css";
import { MessageSquare } from "lucide-react";

const SocialMedia = () => {
    const [socialData, setSocialData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case "reddit":
                return <img src="/reddit.png" alt="Reddit" width={20} height={20} />;
            case "instagram":
                return <img src="/instagram.png" alt="Instagram" width={20} height={20} />;
            case "discord":
                return <img src="/discord.png" alt="Discord" width={20} height={20} />;
            default:
                return <img src="/default.png" alt="Default" width={20} height={20} />;
        }
    };

    useEffect(() => {
        const fetchSocialData = async () => {
            try {
                setLoading(true);
                console.log("Fetching social media data...");
                const response = await fetch(
                    "https://fetchminecraftposts-w5guhfrcya-uc.a.run.app "
                );
                const result = await response.json();
                console.log("API Response:", result);
                if (result.success) {
                    setSocialData(result.data);
                    console.log("Processed social data:", result.data);
                } else {
                    throw new Error("Failed to fetch data");
                }
            } catch (err) {
                console.error("Error fetching social data:", err);
                setError("Failed to load social media data");
            } finally {
                setLoading(false);
            }
        };

        fetchSocialData();
    }, []);

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Data Sources</h2>
            <div className={styles.feedContainer}>
                {socialData.map((item, index) => (
                    <div
                        key={`${item.post_id || index}`}
                        className={`${styles.card} ${styles[item.source || 'reddit']}`}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.platformIcon}>
                                {getPlatformIcon(item.source || 'reddit')}
                            </div>
                            <p className={styles.content}>{item.summary}</p>
                        </div>
                        <div className={styles.dateContainer}>
                            <span className={styles.date}>{item.date}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SocialMedia;