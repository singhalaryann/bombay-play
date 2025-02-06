// ExperimentGraphDisplay.js
'use client';
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import styles from '../../../styles/ExperimentGraphDisplay.module.css';

// Tooltip for control/variant line charts
const LineTooltip = ({ active, payload, x_label, y_label, x_unit, y_unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p>{`${x_label}: ${payload[0].payload.x}${x_unit ? ` ${x_unit}` : ''}`}</p>
        <p>{`Control: ${payload[0].payload.control}${y_unit ? ` ${y_unit}` : ''}`}</p>
        <p>{`Variant: ${payload[0].payload.variant}${y_unit ? ` ${y_unit}` : ''}`}</p>
      </div>
    );
  }
  return null;
};

const ExperimentGraphDisplay = ({ graphs }) => {
  if (!graphs || graphs.length === 0) return null;

  const renderChart = (graph) => {
    const { columns, values, x_unit, y_unit } = graph;

    if (!Array.isArray(values)) return null;

    const x_label = columns?.[0] || 'Date';
    const y_label = columns?.[1] || 'Value';

    // Calculate y-axis domain with padding
    const calculateDomain = (data, keys) => {
      const allValues = data.flatMap(d => keys.map(key => parseFloat(d[key])));
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const padding = (max - min) * 0.1;
      return [min - padding, max + padding];
    };

    // Transform data for control and variant lines
    const data = values.map(([date, [controlVal, variantVal]]) => ({
      x: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      control: parseFloat(controlVal),
      variant: parseFloat(variantVal)
    }));
    
    const yDomain = calculateDomain(data, ['control', 'variant']);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 35, right: 30, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="x"
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
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
          <Legend 
            verticalAlign="bottom"
            align="right"
            wrapperStyle={{ marginTop: '15px' }}
            iconType="circle"
          />
          {/* Control Line */}
          <Line
            type="monotone"
            dataKey="control"
            stroke="#82FF83"
            strokeWidth={2}
            dot={{ fill: '#82FF83', r: 3 }}
            activeDot={{ r: 5, stroke: '#82FF83' }}
            name="Control"
          />
          {/* Variant Line */}
          <Line
            type="monotone"
            dataKey="variant"
            stroke="#FF33F1"
            strokeWidth={2}
            dot={{ fill: '#FF33F1', r: 3 }}
            activeDot={{ r: 5, stroke: '#FF33F1' }}
            name="Variant A"
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    );
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

export default ExperimentGraphDisplay;