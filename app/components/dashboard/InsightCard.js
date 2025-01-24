'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/InsightCard.module.css';
import { Lightbulb, ChevronRight } from 'lucide-react';

const InsightCard = ({ description, insight_id }) => {
 const router = useRouter();
 
 return (
   <div className={styles.card}>
     <div className={styles.content}>
       <div className={styles.messageWrapper}>
         <div className={styles.description}>
           <span className={styles.bullet}>•</span>
           {description}
         </div>
       </div>
       <button 
         className={styles.investigateButton} 
         onClick={() => router.push(`/insight?id=${insight_id}`)}
       >
         <Lightbulb size={16} />
         <span>Investigate</span>
         <ChevronRight size={16} />
       </button>
     </div>
   </div>
 );
};

export default InsightCard;