'use client';
import React from 'react';
import {
 LineChart,
 Line,
 BarChart,
 Bar,
 PieChart,
 Pie,
 Cell,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer
} from 'recharts';
import styles from '../../../styles/GraphDisplay.module.css';

const COLORS = ['#82FF83', '#FF6B6B', '#94A3B8', '#FFB86C'];

/** Tooltip for bar charts */
const CustomTooltip = ({ active, payload, label, valueUnit }) => {
 if (active && payload && payload.length) {
   return (
     <div className={styles.customTooltip}>
       <p>{`${label}: ${payload[0].value}${
         valueUnit ? ` ${valueUnit}` : ''
       }`}</p>
     </div>
   );
 }
 return null;
};

/** Tooltip for pie charts */
const CustomPieTooltip = ({ active, payload }) => {
 if (active && payload && payload.length) {
   return (
     <div className={styles.customTooltip}>
       <p className={styles.tooltipLabel}>{payload[0].name}</p>
       <p className={styles.tooltipValue}>
         {`${payload[0].value}${payload[0].payload.unit ? ` ${payload[0].payload.unit}` : ''}`}
       </p>
     </div>
   );
 }
 return null;
};

/** Tooltip for line charts - Updated to format dates */
const LineTooltip = ({ active, payload, x_label, y_label, x_unit, y_unit }) => {
 if (active && payload && payload.length) {
   // Format date for tooltip display with validation
   const date = new Date(payload[0].payload.x);
   const formattedDate = !isNaN(date) ? 
     `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}` : 
     payload[0].payload.x;
   
   return (
     <div className={styles.customTooltip}>
       <p>{`${x_label}: ${formattedDate}${x_unit ? ` ${x_unit}` : ''}`}</p>
       <p>{`${y_label}: ${payload[0].payload.y}${y_unit ? ` ${y_unit}` : ''}`}</p>
     </div>
   );
 }
 return null;
};

const GraphDisplay = ({ graphs }) => {
 if (!graphs || graphs.length === 0) return null;

 // Helper function for date formatting with validation
 const formatDateIfValid = (value) => {
   const date = new Date(value);
   return !isNaN(date) ? 
     `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}` : 
     value;
 };

 const renderChart = (graph) => {
   const { metric_type, title, columns, values, x_unit, y_unit, value_unit } = graph;

   if (!Array.isArray(values)) return null;

   const x_label = columns?.[0] || 'X';
   const y_label = columns?.[1] || 'Y';

   const calculateDomain = (data, key) => {
     const values = data.map(d => parseFloat(d[key]));
     const min = Math.min(...values);
     const max = Math.max(...values);
     const padding = (max - min) * 0.1;
     return [min - padding, max + padding];
   };

   switch (metric_type) {
     case 'pie': {
       const data = values.map(([cat, val]) => ({
         name: cat,
         value: parseFloat(val),
         unit: value_unit
       }));

       return (
         <ResponsiveContainer width="100%" height={300}>
           <PieChart>
             <Pie
               data={data}
               cx="50%"
               cy="50%"
               innerRadius={60}
               outerRadius={80}
               fill="#8884d8"
               paddingAngle={2}
               dataKey="value"
               label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
               labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
             >
               {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
               ))}
             </Pie>
             <Tooltip content={<CustomPieTooltip />} />
           </PieChart>
         </ResponsiveContainer>
       );
     }

     case 'line': {
       const data = values.map(([xVal, yVal]) => ({
         x: xVal,
         y: parseFloat(yVal)
       }));
       const yDomain = calculateDomain(data, 'y');

       return (
         <ResponsiveContainer width="100%" height={300}>
           <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
             {/* Updated XAxis with flexible date formatting */}
             <XAxis
               dataKey="x"
               stroke="rgba(255,255,255,0.6)"
               tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
               tickFormatter={formatDateIfValid}
               label={{
                 value: x_label,
                 position: 'bottom',
                 fill: 'rgba(255,255,255,0.6)',
                 fontSize: 12
               }}
             />
             <YAxis
               stroke="rgba(255,255,255,0.6)"
               tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
               label={{
                 value: y_label,
                 angle: -90,
                 position: 'left',
                 fill: 'rgba(255,255,255,0.6)',
                 fontSize: 12
               }}
               domain={yDomain}
               scale="linear"
             />
             <Tooltip
               content={(props) => (
                 <LineTooltip
                   {...props}
                   x_label={x_label}
                   y_label={y_label}
                   x_unit={x_unit}
                   y_unit={y_unit}
                 />
               )}
             />
             <Line
               type="monotone"
               dataKey="y"
               stroke="#82FF83"
               strokeWidth={2}
               dot={{ fill: '#82FF83', strokeWidth: 2 }}
               activeDot={{ r: 6 }}
             />
           </LineChart>
         </ResponsiveContainer>
       );
     }

     case 'bar':
      case 'hist': {
        // Single implementation that works for both types
        const data = values.map(([cat, val]) => ({
          name: cat,
          value: parseFloat(val)
        }));
        const yDomain = calculateDomain(data, 'value');
      
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                tickFormatter={formatDateIfValid}
                label={{
                  value: x_label,
                  position: 'bottom',
                  fill: 'rgba(255,255,255,0.6)',
                  fontSize: 12
                }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                label={{
                  value: y_label,
                  angle: -90,
                  position: 'left',
                  fill: 'rgba(255,255,255,0.6)',
                  fontSize: 12
                }}
                domain={yDomain}
                scale="linear"
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} valueUnit={value_unit} />
                )}
              />             
              <Bar dataKey="value" fill="#82FF83" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
     default:
       return null;
   }
 };

 return (
   <div className={styles.analyticsContainer}>
     {graphs.map((graph, index) => (
       <div key={`${graph.metric_id}-${index}`} className={styles.section}>
         <div className={styles.glassEffect}>
           <h3 className={styles.chartTitle}>{graph.title || 'Untitled Chart'}</h3>
           {renderChart(graph)}
         </div>
       </div>
     ))}
   </div>
 );
};

export default GraphDisplay;