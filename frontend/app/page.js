'use client'

import { useState, useEffect } from 'react';

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'fraudulent', 'legitimate'
  const [generating, setGenerating] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:8080/api/transactions';
      
      if (filter === 'fraudulent') {
        url = 'http://localhost:8080/api/transactions/fraudulent';
      } else if (filter === 'legitimate') {
        url = 'http://localhost:8080/api/transactions/legitimate';
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/transactions/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const generateData = async () => {
    try {
      setGenerating(true);
      const response = await fetch('http://localhost:8080/api/generate-data?count=1000', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to generate data');
      
      // Refresh data after generation
      await fetchTransactions();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const clearData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/transactions', {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to clear data');
      
      // Refresh data after clearing
      await fetchTransactions();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filter]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Fraud Detection System</h1>
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
          Error: {error}
        </div>
        <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '10px 20px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Fraud Detection System</h1>
      
      {/* Stats Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '5px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Total Transactions</h3>
          <p style={{ fontSize: '24px', margin: '0', color: '#333' }}>{stats.total || 0}</p>
        </div>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '5px',
          backgroundColor: '#ffe6e6'
        }}>
          <h3>Fraudulent</h3>
          <p style={{ fontSize: '24px', margin: '0', color: '#d9534f' }}>{stats.fraudulent || 0}</p>
        </div>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '5px',
          backgroundColor: '#e6ffe6'
        }}>
          <h3>Legitimate</h3>
          <p style={{ fontSize: '24px', margin: '0', color: '#5cb85c' }}>{stats.legitimate || 0}</p>
        </div>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '5px',
          backgroundColor: '#fff3cd'
        }}>
          <h3>Fraud Rate</h3>
          <p style={{ fontSize: '24px', margin: '0', color: '#856404' }}>
            {stats.fraudRate ? stats.fraudRate.toFixed(2) + '%' : '0%'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          onClick={generateData} 
          disabled={generating}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: generating ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: generating ? 'not-allowed' : 'pointer'
          }}
        >
          {generating ? 'Generating...' : 'Generate 1000 Transactions'}
        </button>
        
        <button 
          onClick={clearData}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear All Data
        </button>

        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #ddd' 
          }}
        >
          <option value="all">All Transactions</option>
          <option value="fraudulent">Fraudulent Only</option>
          <option value="legitimate">Legitimate Only</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading transactions...</p>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && (
        <div>
          <h2>Transactions ({transactions.length})</h2>
          {transactions.length === 0 ? (
            <p>No transactions found. Click "Generate 1000 Transactions" to create synthetic data.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginTop: '10px',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Transaction ID</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>User ID</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Merchant</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Category</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Amount</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Timestamp</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Payment Method</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Location</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Device</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Risk Score</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Fraud Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction.id}
                      style={{ 
                        backgroundColor: transaction.isFraudulent ? '#ffe6e6' : '#ffffff',
                        borderLeft: transaction.isFraudulent ? '4px solid #d9534f' : '4px solid #5cb85c'
                      }}
                    >
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{transaction.id}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontFamily: 'monospace' }}>
                        {transaction.transactionId}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontFamily: 'monospace' }}>
                        {transaction.userId}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {transaction.merchantName}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {transaction.merchantCategory}
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: transaction.amount > 1000 ? '#d9534f' : '#333'
                      }}>
                        {formatAmount(transaction.amount)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '11px' }}>
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {transaction.paymentMethod}
                        {transaction.cardLastFour && (
                          <div style={{ fontSize: '10px', color: '#666' }}>
                            ****{transaction.cardLastFour}
                          </div>
                        )}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '11px' }}>
                        <div>{transaction.locationCity}</div>
                        <div style={{ color: '#666' }}>{transaction.locationCountry}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                          {transaction.ipAddress}
                        </div>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {transaction.deviceType}
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        <span style={{ 
                          color: transaction.riskScore > 0.7 ? '#d9534f' : 
                                transaction.riskScore > 0.3 ? '#f0ad4e' : '#5cb85c'
                        }}>
                          {transaction.riskScore ? (transaction.riskScore * 100).toFixed(1) + '%' : 'N/A'}
                        </span>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '3px', 
                          fontSize: '11px',
                          backgroundColor: transaction.isFraudulent ? '#d9534f' : '#5cb85c',
                          color: 'white'
                        }}>
                          {transaction.isFraudulent ? 'FRAUD' : 'LEGIT'}
                        </span>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px',
                        fontSize: '11px',
                        fontStyle: 'italic',
                        color: '#666'
                      }}>
                        {transaction.fraudReason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
          