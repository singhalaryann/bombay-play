// app/components/insights/InsightAnalytics.js
'use client';
import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../../../styles/InsightAnalytics.module.css';

const COLORS = ['#98FB98', '#FF9B9B', '#94A3B8', '#FFB86C'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p>{`${label}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ x, y, value, index }) => (
  <text 
    x={x} 
    y={y - 10} 
    fill="#ffffff" 
    textAnchor="middle"
    fontSize={12}
  >
    {value}
  </text>
);

const InsightAnalytics = ({ graphData }) => {
  console.log('Rendering graphs with data:', graphData);

  const renderChart = (graph) => {
    const { type, name, categories, values } = graph;
    const data = categories.map((category, index) => ({
      name: category,
      value: values[index]
    }));

    switch (type) {
      case 'hist':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.1)"
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
              />
              <Bar 
                dataKey="value" 
                fill="#98FB98"
                radius={[4, 4, 0, 0]}
                label={<CustomLabel />}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => 
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className={styles.analyticsContainer}>
      {graphData && graphData.map((graph, index) => (
        <div key={`${graph.name}-${index}`} className={styles.section}>
          <div className={styles.glassEffect}>
            <h3 className={styles.chartTitle}>{graph.name}</h3>
            {renderChart(graph)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InsightAnalytics;