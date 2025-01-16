// app/components/insights/InsightAnalytics.js
'use client';
import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from '../../../styles/InsightAnalytics.module.css';

const COLORS = ['#98FB98', '#FF9B9B', '#94A3B8', '#FFB86C'];

const InsightAnalytics = ({ graphData }) => {
  console.log('Rendering graphs with data:', graphData);

  const renderChart = (graph) => {
    const { type, name, categories, values } = graph;
    
    // Create data array for charts
    const data = categories.map((category, index) => ({
      name: category,
      value: values[index]
    }));

    switch (type) {
      case 'hist':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)' 
                }}
              />
              <Bar dataKey="value" fill="#98FB98" />
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
                labelLine={true}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)' 
                }}
              />
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
            <h3>{graph.name}</h3>
            {renderChart(graph)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InsightAnalytics;