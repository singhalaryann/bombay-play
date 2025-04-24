'use client';
import React, { useState, useRef, useEffect } from 'react';
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
 Legend,
 ResponsiveContainer,
 ReferenceArea,
} from 'recharts';
import styles from '../../../styles/GraphDisplay.module.css';
import { RotateCcw, MousePointer } from 'lucide-react';

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

 const renderChart = (graph, index) => {
  const { metric_type, title, columns, values, categories, series, x_unit, y_unit, value_unit } = graph;

  // Skip values check for multiline charts which use categories and series instead
  if (metric_type !== 'multiline') {
    if (!Array.isArray(values)) return null;
    
    // Check for empty values array
    if (values.length === 0) {
      console.log(`Empty values array for chart ${title}`);
      return null;
    }
  } else {
    // For multiline charts, verify categories and series
    if (!Array.isArray(categories) || !Array.isArray(series) || categories.length === 0 || series.length === 0) {
      console.log(`Missing categories or series for multiline chart ${title}`);
      return null;
    }
  }

   const x_label = columns?.[0] || 'X';
   const y_label = columns?.[1] || 'Y';

   // Initial zoom state
   const [zoomState, setZoomState] = useState({
     left: 'dataMin',
     right: 'dataMax',
     refAreaLeft: '',
     refAreaRight: '',
     top: 'dataMax+10%',
     bottom: 'dataMin-10%',
     animation: true,
   });
   // Track whether chart is zoomed
   const [isZoomed, setIsZoomed] = useState(false);
   // State for zoom mode (drag or wheel)
   const [zoomMode, setZoomMode] = useState('wheel'); // Default to wheel zoom
   // Ref for chart container to add wheel event listener
   const chartContainerRef = useRef(null);

   const calculateDomain = (data, key) => {
     const values = data.map(d => parseFloat(d[key]));
     const min = Math.min(...values);
     const max = Math.max(...values);
     const padding = (max - min) * 0.1;
     return [min - padding, max + padding];
   };

   // Zoom functions for line and bar charts
   const zoom = (data, xDataKey, yDataKey) => {
     if (zoomState.refAreaLeft === zoomState.refAreaRight || zoomState.refAreaRight === '') {
       setZoomState((prevState) => ({
         ...prevState,
         refAreaLeft: '',
         refAreaRight: '',
       }));
       return;
     }

     // xAxis domain
     let left = Math.min(zoomState.refAreaLeft, zoomState.refAreaRight);
     let right = Math.max(zoomState.refAreaLeft, zoomState.refAreaRight);

     // yAxis domain
     let filteredData = [];
     if (typeof left === 'number' && typeof right === 'number') {
       filteredData = data.filter((_, idx) => idx >= left && idx <= right);
     }
     
     const newYDomain = calculateDomain(filteredData, yDataKey);

     setZoomState({
       ...zoomState,
       refAreaLeft: '',
       refAreaRight: '',
       left: left,
       right: right,
       bottom: newYDomain[0],
       top: newYDomain[1],
     });
     
     setIsZoomed(true);
   };

   // Reset zoom function
   const zoomOut = () => {
     setZoomState({
       left: 'dataMin',
       right: 'dataMax',
       refAreaLeft: '',
       refAreaRight: '',
       top: 'dataMax+10%',
       bottom: 'dataMin-10%',
       animation: true,
     });
     setIsZoomed(false);
   };

   // Mouse handlers for drag zooming
   const onMouseDown = (e) => {
     if (!e || zoomMode !== 'drag') return;
     setZoomState((prevState) => ({
       ...prevState,
       refAreaLeft: e.activeTooltipIndex,
     }));
   };

   const onMouseMove = (e) => {
     if (!e || zoomMode !== 'drag') return;
     if (zoomState.refAreaLeft !== '') {
       setZoomState((prevState) => ({
         ...prevState,
         refAreaRight: e.activeTooltipIndex,
       }));
     }
   };

   // Function to get visible data indices
   const getVisibleIndices = (data) => {
     // If not zoomed, all data is visible
     if (!isZoomed || typeof zoomState.left === 'string' || typeof zoomState.right === 'string') {
       return { startIdx: 0, endIdx: data.length - 1 };
     }
     
     // Otherwise use zoom boundaries
     return {
       startIdx: Math.max(0, Math.floor(zoomState.left)),
       endIdx: Math.min(data.length - 1, Math.ceil(zoomState.right))
     };
   };

   // Calculate appropriate number of ticks based on visible data range
   const calculateTickCount = (data) => {
     if (!isZoomed || typeof zoomState.left === 'string' || typeof zoomState.right === 'string') {
       return Math.min(10, data.length);
     }
     
     const { startIdx, endIdx } = getVisibleIndices(data);
     const visiblePoints = endIdx - startIdx + 1;
     
     // Calculate a sensible number of ticks: roughly 1 tick per 3-5 data points, but at least 2
     return Math.max(2, Math.min(Math.floor(visiblePoints / 3), 10));
   };

   // Handle mouse wheel zoom
   const handleWheel = (e, data, yDataKey) => {
     if (zoomMode !== 'wheel' || !data || !Array.isArray(data) || data.length === 0) return;
     
     e.preventDefault();
     
     // Get mouse position relative to container
     const containerRect = e.currentTarget.getBoundingClientRect();
     const mouseX = e.clientX - containerRect.left;
     const containerWidth = containerRect.width;
     
     // Convert mouse position to a percentage of the chart width
     const mouseXPercent = mouseX / containerWidth;
     
     // Get current visible data range
     const { startIdx, endIdx } = getVisibleIndices(data);
     const visibleRange = endIdx - startIdx;
     
     // Calculate zoom factor based on wheel delta
     // Negative delta = zoom in, Positive delta = zoom out
     const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
     
     // Calculate new range, ensuring a minimum range of 2 points
     let newRange = Math.max(2, visibleRange * zoomFactor);
     
     // Calculate new start and end points, keeping the mouse position as the focal point
     let newStart = startIdx + (mouseXPercent * visibleRange) - (mouseXPercent * newRange);
     let newEnd = newStart + newRange;
     
     // Ensure the new range doesn't go out of bounds
     if (newStart < 0) {
       newStart = 0;
       newEnd = Math.min(data.length - 1, newStart + newRange);
     }
     
     if (newEnd > data.length - 1) {
       newEnd = data.length - 1;
       newStart = Math.max(0, newEnd - newRange);
     }
     
     // Calculate new Y domain based on the visible data
     const visibleData = data.filter(
       (_, idx) => idx >= newStart && idx <= newEnd
     );
     
     const newYDomain = calculateDomain(visibleData, yDataKey);
     
     // Update zoom state
     setZoomState({
       ...zoomState,
       left: newStart,
       right: newEnd,
       bottom: newYDomain[0],
       top: newYDomain[1],
     });
     
     setIsZoomed(true);
   };

   // Toggle between zoom modes
   const toggleZoomMode = () => {
     setZoomMode(prevMode => prevMode === 'drag' ? 'wheel' : 'drag');
   };

   // Effect to add/remove wheel event listener based on chart type
   useEffect(() => {
     const currentContainer = chartContainerRef.current;
     
     if (!currentContainer || zoomMode !== 'wheel' || metric_type === 'pie') {
       return;
     }
     
     let wheelHandler;
     
     if (metric_type === 'line') {
       let data;
       
       if (typeof values[0] === 'number') {
         data = values.map((value, index) => ({
           x: index.toString(),
           y: value,
           originalIndex: index
         }));
       } else if (Array.isArray(values[0])) {
         data = values.map(([xVal, yVal], index) => ({
           x: xVal,
           y: parseFloat(yVal),
           originalIndex: index
         }));
       } else {
         return; // Invalid data format
       }
       
       wheelHandler = (e) => handleWheel(e, data, 'y');
     } else if (metric_type === 'bar' || metric_type === 'hist') {
       let data;
       
       if (typeof values[0] === 'number') {
         data = values.map((value, index) => ({
           name: index.toString(),
           value: value,
           originalIndex: index
         }));
       } else if (Array.isArray(values[0])) {
         data = values.map(([cat, val], index) => ({
           name: cat,
           value: parseFloat(val),
           originalIndex: index
         }));
       } else {
         return; // Invalid data format
       }
       
       wheelHandler = (e) => handleWheel(e, data, 'value');
     }
     
     if (wheelHandler) {
       currentContainer.addEventListener('wheel', wheelHandler, { passive: false });
       
       return () => {
         currentContainer.removeEventListener('wheel', wheelHandler);
       };
     }
   }, [zoomMode, zoomState, isZoomed, metric_type, values]);

   try {
     switch (metric_type) {
       case 'pie': {
         let data;
         
         // Case 1: Flat array of numbers for pie chart (geographical_breakdown, device_os_distribution)
         if (typeof values[0] === 'number') {
           data = values.map((value, index) => ({
             name: `Region ${index + 1}`,
             value: value,
             unit: value_unit
           }));
           
           // Filter out zero values for better visualization
           data = data.filter(item => item.value > 0);
           
           // Limit to top values for readability
           if (data.length > 10) {
             data = data.sort((a, b) => b.value - a.value).slice(0, 10);
           }
         }
         // Case 2: Array of [category, value] pairs (standard format)
         else if (Array.isArray(values[0])) {
           data = values.map(([cat, val]) => ({
             name: cat,
             value: parseFloat(val),
             unit: value_unit
           }));
         }
         // Case 3: Invalid format
         else {
           console.error(`Invalid pie chart values format for chart ${title}:`, values);
           return null;
         }

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
         let data;
         
         // Check if values is a flat array of numbers (session_distribution_by_hour)
         if (typeof values[0] === 'number') {
           data = values.map((value, index) => ({
             x: index.toString(),
             y: value,
             originalIndex: index
           }));
         }
         // Standard format: array of [x, y] pairs
         else if (Array.isArray(values[0])) {
           data = values.map(([xVal, yVal], index) => ({
             x: xVal,
             y: parseFloat(yVal),
             originalIndex: index
           }));
         } else {
           console.error(`Invalid line chart values format for chart ${title}:`, values);
           return null;
         }
         
         const yDomain = calculateDomain(data, 'y');
         
         // Determine domains based on zoom state
         const xDomain = isZoomed 
           ? [zoomState.left, zoomState.right] 
           : ['dataMin', 'dataMax'];
         
         const yDomainFinal = isZoomed 
           ? [zoomState.bottom, zoomState.top] 
           : yDomain;

         // Calculate appropriate tick count based on visible data
         const tickCount = calculateTickCount(data);

         return (
           <div className={styles.chartWrapper} ref={chartContainerRef}>
             <div className={styles.zoomControls}>
               <button 
                 onClick={toggleZoomMode} 
                 title={`Switch to ${zoomMode === 'drag' ? 'wheel' : 'drag'} zoom`}
                 className={styles.zoomButton}
                 style={{ marginRight: '8px' }}
               >
                 {zoomMode === 'drag' ? 
                   <MousePointer size={16} color="white" /> : 
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="12" cy="12" r="10" />
                     <line x1="12" y1="8" x2="12" y2="16" />
                     <line x1="8" y1="12" x2="16" y2="12" />
                   </svg>
                 }
                 <span>{zoomMode === 'drag' ? 'Drag Zoom' : 'Wheel Zoom'}</span>
               </button>
               
               <button 
                 onClick={zoomOut} 
                 disabled={!isZoomed}
                 title="Reset zoom"
                 className={`${styles.zoomButton} ${!isZoomed ? styles.disabled : ''}`}
               >
                 <RotateCcw size={16} />
                 <span>Reset Zoom</span>
               </button>
             </div>
             
             <ResponsiveContainer width="100%" height={300}>
               <LineChart 
                 data={data} 
                 margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                 onMouseDown={onMouseDown}
                 onMouseMove={onMouseMove}
                 onMouseUp={() => zoomMode === 'drag' && zoom(data, 'originalIndex', 'y')}
               >
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                 <XAxis
                   dataKey="originalIndex"
                   type="number"
                   domain={xDomain}
                   allowDataOverflow
                   stroke="rgba(255,255,255,0.6)"
                   tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                   // Use calculated tick count
                   tickCount={tickCount}
                   // Improved tick formatter to ensure labels are visible
                   tickFormatter={(index) => {
                     // Make sure index is within bounds
                     if (index < 0 || index >= data.length) return '';
                     const item = data[Math.floor(index)];
                     return item ? formatDateIfValid(item.x) : '';
                   }}
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
                   domain={yDomainFinal}
                   allowDataOverflow
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
                   isAnimationActive={false}
                 />
                 
                 {/* Highlight zoom area */}
                 {zoomState.refAreaLeft && zoomState.refAreaRight ? (
                   <ReferenceArea 
                     x1={zoomState.refAreaLeft} 
                     x2={zoomState.refAreaRight} 
                     strokeOpacity={0.3}
                     fill="rgba(255, 255, 255, 0.2)" 
                   />
                 ) : null}
               </LineChart>
             </ResponsiveContainer>
             
             {/* Zoom instructions based on mode */}
             {!isZoomed && (
               <div className={styles.zoomInstructions}>
                 {zoomMode === 'drag' 
                   ? 'Click and drag on the chart to zoom' 
                   : 'Use mouse wheel to zoom in/out'}
               </div>
             )}
           </div>
         );
       }

       case 'bar':
       case 'hist': {
         // Different data formats handling for bar/hist charts
         let data;
         
         // Handle flat array of numbers (for session distribution by hour)
         if (typeof values[0] === 'number') {
           data = values.map((value, index) => ({
             name: index.toString(),
             value: value,
             originalIndex: index
           }));
         }
         // Handle regular case: array of [category, value] pairs
         else if (Array.isArray(values[0])) {
           data = values.map(([cat, val], index) => ({
             name: cat,
             value: parseFloat(val),
             originalIndex: index
           }));
         }
         // Handle invalid format
         else {
           console.error(`Invalid bar/hist values format for chart ${title}:`, values);
           return null;
         }
        
         const yDomain = calculateDomain(data, 'value');
         
         // Determine domains based on zoom state
         const xDomain = isZoomed 
           ? [zoomState.left, zoomState.right] 
           : ['dataMin', 'dataMax'];
         
         const yDomainFinal = isZoomed 
           ? [zoomState.bottom, zoomState.top] 
           : yDomain;
        
         // Calculate appropriate tick count based on visible data
         const tickCount = calculateTickCount(data);

         return (
           <div className={styles.chartWrapper} ref={chartContainerRef}>
             <div className={styles.zoomControls}>
               <button 
                 onClick={toggleZoomMode} 
                 title={`Switch to ${zoomMode === 'drag' ? 'wheel' : 'drag'} zoom`}
                 className={styles.zoomButton}
                 style={{ marginRight: '8px' }}
               >
                 {zoomMode === 'drag' ? 
                   <MousePointer size={16} color="white" /> : 
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="12" cy="12" r="10" />
                     <line x1="12" y1="8" x2="12" y2="16" />
                     <line x1="8" y1="12" x2="16" y2="12" />
                   </svg>
                 }
                 <span>{zoomMode === 'drag' ? 'Drag Zoom' : 'Wheel Zoom'}</span>
               </button>
               
               <button 
                 onClick={zoomOut} 
                 disabled={!isZoomed}
                 title="Reset zoom"
                 className={`${styles.zoomButton} ${!isZoomed ? styles.disabled : ''}`}
               >
                 <RotateCcw size={16} />
                 <span>Reset Zoom</span>
               </button>
             </div>
             
             <ResponsiveContainer width="100%" height={300}>
               <BarChart 
                 data={data} 
                 margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                 onMouseDown={onMouseDown}
                 onMouseMove={onMouseMove}
                 onMouseUp={() => zoomMode === 'drag' && zoom(data, 'originalIndex', 'value')}
               >
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                 <XAxis
                   dataKey="originalIndex"
                   type="number"
                   domain={xDomain}
                   allowDataOverflow
                   stroke="rgba(255,255,255,0.6)"
                   tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                   // Use calculated tick count
                   tickCount={tickCount}
                   // Improved tick formatter to ensure labels are visible
                   tickFormatter={(index) => {
                     // Make sure index is within bounds
                     if (index < 0 || index >= data.length) return '';
                     const item = data[Math.floor(index)];
                     return item ? formatDateIfValid(item.name) : '';
                   }}
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
                   domain={yDomainFinal}
                   allowDataOverflow
                   scale="linear"
                 />
                 <Tooltip
                   content={(props) => (
                     <CustomTooltip {...props} valueUnit={value_unit} />
                   )}
                 />             
                 <Bar 
                   dataKey="value" 
                   fill="#82FF83" 
                   radius={[4, 4, 0, 0]}
                   isAnimationActive={false}
                 />
                 
                 {/* Highlight zoom area */}
                 {zoomState.refAreaLeft && zoomState.refAreaRight ? (
                   <ReferenceArea 
                     x1={zoomState.refAreaLeft} 
                     x2={zoomState.refAreaRight} 
                     strokeOpacity={0.3}
                     fill="rgba(255, 255, 255, 0.2)" 
                   />
                 ) : null}
               </BarChart>
             </ResponsiveContainer>
             
             {/* Zoom instructions based on mode */}
             {!isZoomed && (
               <div className={styles.zoomInstructions}>
                 {zoomMode === 'drag' 
                   ? 'Click and drag on the chart to zoom' 
                   : 'Use mouse wheel to zoom in/out'}
               </div>
             )}
           </div>
         );
       }

       case 'multiline': {
        // Format the data for a multiline chart
        const categories = graph.categories || [];
        const series = graph.series || [];
        
        // Transform the data into the format needed by Recharts
        const data = categories.map((category, index) => {
          const point = { category, originalIndex: index };
          series.forEach(s => {
            point[s.name] = s.values[index];
          });
          return point;
        });

        // Calculate Y domain for all series
        const calculateYDomain = () => {
          let min = Infinity;
          let max = -Infinity;
          
          series.forEach(s => {
            const values = s.values;
            const seriesMin = Math.min(...values);
            const seriesMax = Math.max(...values);
            min = Math.min(min, seriesMin);
            max = Math.max(max, seriesMax);
          });
          
          const padding = (max - min) * 0.1;
          return [min - padding, max + padding];
        };

        const yDomain = calculateYDomain();
        
        // Determine domains based on zoom state
        const xDomain = isZoomed 
          ? [zoomState.left, zoomState.right] 
          : ['dataMin', 'dataMax'];
        
        const yDomainFinal = isZoomed 
          ? [zoomState.bottom, zoomState.top] 
          : yDomain;

        // Calculate appropriate tick count based on visible data
        const tickCount = calculateTickCount(data);

        // Handle mouse wheel zoom for multiline chart
        const handleWheel = (e) => {
          if (zoomMode !== 'wheel') return;
          
          e.preventDefault();
          
          const containerRect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - containerRect.left;
          const containerWidth = containerRect.width;
          const mouseXPercent = mouseX / containerWidth;
          
          const { startIdx, endIdx } = getVisibleIndices(data);
          const visibleRange = endIdx - startIdx;
          const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
          let newRange = Math.max(2, visibleRange * zoomFactor);
          
          let newStart = startIdx + (mouseXPercent * visibleRange) - (mouseXPercent * newRange);
          let newEnd = newStart + newRange;
          
          if (newStart < 0) {
            newStart = 0;
            newEnd = Math.min(data.length - 1, newStart + newRange);
          }
          
          if (newEnd > data.length - 1) {
            newEnd = data.length - 1;
            newStart = Math.max(0, newEnd - newRange);
          }
          
          // Calculate new Y domain based on visible data
          const visibleData = data.filter(
            (_, idx) => idx >= newStart && idx <= newEnd
          );
          
          let minY = Infinity;
          let maxY = -Infinity;
          
          series.forEach(s => {
            visibleData.forEach(point => {
              const value = point[s.name];
              minY = Math.min(minY, value);
              maxY = Math.max(maxY, value);
            });
          });
          
          const yPadding = (maxY - minY) * 0.1;
          
          setZoomState({
            ...zoomState,
            left: newStart,
            right: newEnd,
            bottom: minY - yPadding,
            top: maxY + yPadding,
          });
          
          setIsZoomed(true);
        };

        // Effect to add/remove wheel event listener
        useEffect(() => {
          const currentContainer = chartContainerRef.current;
          
          if (!currentContainer || zoomMode !== 'wheel') {
            return;
          }
          
          const wheelHandler = (e) => handleWheel(e);
          
          currentContainer.addEventListener('wheel', wheelHandler, { passive: false });
          
          return () => {
            currentContainer.removeEventListener('wheel', wheelHandler);
          };
        }, [zoomMode, zoomState, isZoomed, data]);

        return (
          <div className={styles.chartWrapper} ref={chartContainerRef}>
            <div className={styles.zoomControls}>
              <button 
                onClick={toggleZoomMode} 
                title={`Switch to ${zoomMode === 'drag' ? 'wheel' : 'drag'} zoom`}
                className={styles.zoomButton}
                style={{ marginRight: '8px' }}
              >
                {zoomMode === 'drag' ? 
                  <MousePointer size={16} color="white" /> : 
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                }
                <span>{zoomMode === 'drag' ? 'Drag Zoom' : 'Wheel Zoom'}</span>
              </button>
              
              <button 
                onClick={zoomOut} 
                disabled={!isZoomed}
                title="Reset zoom"
                className={`${styles.zoomButton} ${!isZoomed ? styles.disabled : ''}`}
              >
                <RotateCcw size={16} />
                <span>Reset Zoom</span>
              </button>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={() => zoomMode === 'drag' && zoom(data, 'originalIndex', 'y')}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="originalIndex"
                  type="number"
                  domain={xDomain}
                  allowDataOverflow
                  stroke="rgba(255,255,255,0.6)"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  tickCount={tickCount}
                  tickFormatter={(index) => {
                    if (index < 0 || index >= data.length) return '';
                    const item = data[Math.floor(index)];
                    return item ? formatDateIfValid(item.category) : '';
                  }}
                  label={{
                    value: graph.x_label || '',
                    position: 'bottom',
                    fill: 'rgba(255,255,255,0.6)',
                    fontSize: 12
                  }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.6)"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  label={{
                    value: graph.y_label || '',
                    angle: -90,
                    position: 'left',
                    fill: 'rgba(255,255,255,0.6)',
                    fontSize: 12
                  }}
                  domain={yDomainFinal}
                  allowDataOverflow
                  scale="linear"
                />
                <Tooltip />
                <Legend />
                {series.map((s, i) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[i % COLORS.length], strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
                
                {/* Highlight zoom area */}
                {zoomState.refAreaLeft && zoomState.refAreaRight ? (
                  <ReferenceArea 
                    x1={zoomState.refAreaLeft} 
                    x2={zoomState.refAreaRight} 
                    strokeOpacity={0.3}
                    fill="rgba(255, 255, 255, 0.2)" 
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
            
            {/* Zoom instructions based on mode */}
            {!isZoomed && (
              <div className={styles.zoomInstructions}>
                {zoomMode === 'drag' 
                  ? 'Click and drag on the chart to zoom' 
                  : 'Use mouse wheel to zoom in/out'}
              </div>
            )}
          </div>
        );
      }
       default:
         return null;
     }
   } catch (error) {
     console.error(`Error rendering chart ${title}:`, error);
     return null;
   }
 };

 return (
   <div className={styles.analyticsContainer}>
     {graphs.map((graph, index) => {
       // Skip any invalid graph objects
       if (!graph || typeof graph !== 'object') return null;
       
       return (
         <div key={`${graph.metric_id || index}-${index}`} className={styles.section}>
           <div className={styles.glassEffect}>
             <h3 className={styles.chartTitle}>{graph.title || 'Untitled Chart'}</h3>
             {renderChart(graph, index)}
           </div>
         </div>
       );
     })}
   </div>
 );
};

export default GraphDisplay;