'use client';

import React, { useEffect, useRef } from 'react';
import * as Chart from 'chart.js/auto';

// Fraud vs Legitimate Pie Chart
export const FraudVsLegitChart = ({ transactions }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !transactions.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const fraudulent = transactions.filter(t => t.isFraudulent).length;
    const legitimate = transactions.filter(t => !t.isFraudulent).length;
    const total = transactions.length;

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart.Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Fraud', 'No Fraud'],
        datasets: [{
          data: [fraudulent, legitimate],
          backgroundColor: ['#ef4444', '#10b981'],
          borderColor: ['#dc2626', '#059669'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e5e7eb',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [transactions]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h3 className="text-lg font-semibold mb-4 text-center">Fraud vs No Fraud</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

// Merchant Categories with Fraud Pie Chart
export const MerchantFraudChart = ({ transactions }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !transactions.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const fraudTransactions = transactions.filter(t => t.isFraudulent);
    const categoryStats = {};

    // Count fraud transactions by category
    fraudTransactions.forEach(t => {
      categoryStats[t.merchantCategory] = (categoryStats[t.merchantCategory] || 0) + 1;
    });

    const labels = Object.keys(categoryStats);
    const data = Object.values(categoryStats);
    
    // Generate colors for categories
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981',
      '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
      '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#9ca3af'
    ];

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart.Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(c => c.replace('4', '6')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e5e7eb',
              font: {
                size: 10
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [transactions]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h3 className="text-lg font-semibold mb-4 text-center">Merchant Categories with Fraud Percentages</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

// Fraudulent Reasons Bar Chart
export const FraudulentReasonsChart = ({ transactions }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !transactions.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const fraudTransactions = transactions.filter(t => t.isFraudulent && t.fraudReason);
    const reasonStats = {};

    // Count fraud reasons
    fraudTransactions.forEach(t => {
      reasonStats[t.fraudReason] = (reasonStats[t.fraudReason] || 0) + 1;
    });

    const labels = Object.keys(reasonStats);
    const data = Object.values(reasonStats);

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Frequency',
          data: data,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#e5e7eb'
            },
            grid: {
              color: '#374151'
            }
          },
          x: {
            ticks: {
              color: '#e5e7eb',
              maxRotation: 45
            },
            grid: {
              color: '#374151'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [transactions]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h3 className="text-lg font-semibold mb-4 text-center">Fraudulent Reasons Bar Chart</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

// Analytics Cards Component
export const AnalyticsCards = ({ transactions }) => {
  // Calculate metrics
  const fraudTransactions = transactions.filter(t => t.isFraudulent);
  const legitimateTransactions = transactions.filter(t => !t.isFraudulent);
  
  const fraudRate = transactions.length > 0 ? (fraudTransactions.length / transactions.length * 100).toFixed(2) : 0;
  
  const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const fraudLosses = fraudTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const fraudLossesPercentage = totalRevenue > 0 ? (fraudLosses / totalRevenue * 100).toFixed(2) : 0;
  
  const averageRiskScore = transactions.length > 0 ? 
    (transactions.reduce((sum, t) => sum + parseFloat(t.riskScore || 0), 0) / transactions.length * 100).toFixed(1) : 0;
  
  const averageTransactionAmount = transactions.length > 0 ?
    (transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / transactions.length).toFixed(2) : 0;

  // Additional metrics for bottom row
  const averageFraudAmount = fraudTransactions.length > 0 ?
    (fraudTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / fraudTransactions.length).toFixed(2) : 0;
  
  const highRiskTransactions = transactions.filter(t => parseFloat(t.riskScore || 0) > 0.7).length;
  
  const uniqueUsers = new Set(transactions.map(t => t.userId)).size;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Middle Row - Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-red-400 mb-2">{fraudRate}%</div>
          <div className="text-gray-400 text-sm">Fraud Rate %</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-orange-400 mb-2">{fraudLossesPercentage}%</div>
          <div className="text-gray-400 text-sm">Fraud Losses as a Percentage of Revenue</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{formatAmount(fraudLosses)}</div>
          <div className="text-gray-400 text-sm">Fraud Amount $</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">{averageRiskScore}%</div>
          <div className="text-gray-400 text-sm">Avg Risk Score</div>
        </div>
      </div>

      {/* Bottom Row - Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">{formatAmount(averageTransactionAmount)}</div>
          <div className="text-gray-400 text-sm">Avg Fraud Transaction Amount</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">{formatAmount(averageFraudAmount)}</div>
          <div className="text-gray-400 text-sm">Avg Fraud Amount</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-indigo-400 mb-2">{highRiskTransactions}</div>
          <div className="text-gray-400 text-sm">High Risk Transactions </div>
          {/* (>70%) */}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center">
          <div className="text-3xl font-bold text-cyan-400 mb-2">{uniqueUsers}</div>
          <div className="text-gray-400 text-sm">Unique Users</div>
        </div>
      </div>
    </div>
  );
};