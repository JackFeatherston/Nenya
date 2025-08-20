'use client'

import React, { useEffect, useRef, useState } from 'react';

const FraudGlobe = () => {
  const canvasRef = useRef();
  const frameRef = useRef();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState({ total: 0, fraudulent: 0, legitimate: 0, fraudRate: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Fetch fraud transactions and stats from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const transactionsResponse = await fetch('http://localhost:8080/api/transactions/fraudulent');
      if (!transactionsResponse.ok) throw new Error('Failed to fetch fraud transactions');
      const transactionsData = await transactionsResponse.json();
      
      const statsResponse = await fetch('http://localhost:8080/api/transactions/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch transaction stats');
      const statsData = await statsResponse.json();
      
      // Add realistic coordinates
      const majorCities = [
        { name: "New York", lat: 40.7128, lng: -74.0060 },
        { name: "London", lat: 51.5074, lng: -0.1278 },
        { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
        { name: "Sydney", lat: -33.8688, lng: 151.2093 },
        { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
        { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
        { name: "Cairo", lat: 30.0444, lng: 31.2357 },
        { name: "Moscow", lat: 55.7558, lng: 37.6173 },
        { name: "Beijing", lat: 39.9042, lng: 116.4074 },
        { name: "Lagos", lat: 6.5244, lng: 3.3792 },
        { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
        { name: "Berlin", lat: 52.5200, lng: 13.4050 },
        { name: "Bangkok", lat: 13.7563, lng: 100.5018 },
        { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
        { name: "Toronto", lat: 43.6532, lng: -79.3832 }
      ];
      
      const transactionsWithCoords = transactionsData.map((transaction, index) => {
        let coords;
        if (index < majorCities.length) {
          coords = majorCities[index];
        } else {
          const cityIndex = Math.floor(Math.random() * majorCities.length);
          const baseCity = majorCities[cityIndex];
          coords = {
            lat: baseCity.lat + (Math.random() - 0.5) * 20,
            lng: baseCity.lng + (Math.random() - 0.5) * 40
          };
        }
        
        return {
          ...transaction,
          lat: Math.max(-85, Math.min(85, coords.lat)),
          lng: coords.lng
        };
      });
      
      setTransactions(transactionsWithCoords);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate synthetic data
  const generateData = async (count = 1000) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8080/api/generate-data?count=${count}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate data');
      }
      
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear all data
  const clearData = async () => {
    try {
      setIsClearing(true);
      setError(null);
      
      const response = await fetch('http://localhost:8080/api/transactions', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear data');
      }
      
      setTransactions([]);
      setStats({ total: 0, fraudulent: 0, legitimate: 0, fraudRate: 0 });
      setSelectedTransaction(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsClearing(false);
    }
  };

  // 3D Globe rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 200;

    // Convert lat/lng to 3D coordinates
    const latLngTo3D = (lat, lng, r = radius) => {
      const phi = (lat * Math.PI) / 180;
      const theta = ((lng - 90) * Math.PI) / 180;

      const x = r * Math.cos(phi) * Math.cos(theta);
      const y = r * Math.sin(phi);
      const z = r * Math.cos(phi) * Math.sin(theta);

      return { x, y, z };
    };

    // Project 3D to 2D
    const project3D = (x, y, z, rotX, rotY) => {
      // Apply rotation
      const cosRX = Math.cos(rotX);
      const sinRX = Math.sin(rotX);
      const cosRY = Math.cos(rotY);
      const sinRY = Math.sin(rotY);

      // Rotate around X axis
      const y1 = y * cosRX - z * sinRX;
      const z1 = y * sinRX + z * cosRX;

      // Rotate around Y axis
      const x2 = x * cosRY + z1 * sinRY;
      const z2 = -x * sinRY + z1 * cosRY;

      // Project to 2D
      const scale = 300 / (300 + z2);
      return {
        x: centerX + x2 * scale,
        y: centerY - y1 * scale,
        scale: scale,
        z: z2
      };
    };

    // Generate continent data (simplified)
    const generateContinentPoints = () => {
      const continents = [
        // North America
        { lat: 50, lng: -100 }, { lat: 45, lng: -75 }, { lat: 30, lng: -80 }, { lat: 25, lng: -110 },
        // Europe
        { lat: 60, lng: 10 }, { lat: 50, lng: 0 }, { lat: 45, lng: 15 }, { lat: 55, lng: 30 },
        // Asia
        { lat: 60, lng: 100 }, { lat: 45, lng: 120 }, { lat: 30, lng: 110 }, { lat: 35, lng: 80 },
        // Africa
        { lat: 20, lng: 20 }, { lat: 0, lng: 25 }, { lat: -20, lng: 30 }, { lat: -30, lng: 25 },
        // South America
        { lat: 10, lng: -60 }, { lat: -10, lng: -55 }, { lat: -30, lng: -60 }, { lat: -40, lng: -70 },
        // Australia
        { lat: -25, lng: 135 }, { lat: -30, lng: 140 }, { lat: -35, lng: 145 }
      ];

      return continents.map(coord => {
        const pos3d = latLngTo3D(coord.lat, coord.lng);
        return { ...coord, ...pos3d };
      });
    };

    const continentPoints = generateContinentPoints();

    // Generate grid lines for the globe
    const generateGridLines = () => {
      const lines = [];
      
      // Latitude lines
      for (let lat = -80; lat <= 80; lat += 20) {
        const line = [];
        for (let lng = -180; lng <= 180; lng += 10) {
          const pos3d = latLngTo3D(lat, lng);
          line.push({ lat, lng, ...pos3d });
        }
        lines.push(line);
      }
      
      // Longitude lines
      for (let lng = -180; lng <= 180; lng += 30) {
        const line = [];
        for (let lat = -80; lat <= 80; lat += 5) {
          const pos3d = latLngTo3D(lat, lng);
          line.push({ lat, lng, ...pos3d });
        }
        lines.push(line);
      }
      
      return lines;
    };

    const gridLines = generateGridLines();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Create gradient for globe
      const gradient = ctx.createRadialGradient(centerX - 50, centerY - 50, 50, centerX, centerY, radius);
      gradient.addColorStop(0, '#4a90e2');
      gradient.addColorStop(0.7, '#2c5aa0');
      gradient.addColorStop(1, '#1e3a5f');

      // Draw ocean (main globe)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#2c5282';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      gridLines.forEach(line => {
        ctx.beginPath();
        let first = true;
        line.forEach(point => {
          const projected = project3D(point.x, point.y, point.z, rotation.x, rotation.y);
          if (projected.z > -radius * 0.5) { // Only draw visible parts
            if (first) {
              ctx.moveTo(projected.x, projected.y);
              first = false;
            } else {
              ctx.lineTo(projected.x, projected.y);
            }
          }
        });
        ctx.stroke();
      });

      // Draw continents
      ctx.fillStyle = 'rgba(60, 120, 60, 0.8)';
      continentPoints.forEach(point => {
        const projected = project3D(point.x, point.y, point.z, rotation.x, rotation.y);
        if (projected.z > -radius * 0.3) { // Only draw visible continents
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, 8 * projected.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw fraud transaction dots
      transactions.forEach((transaction, index) => {
        const pos3d = latLngTo3D(transaction.lat, transaction.lng);
        const projected = project3D(pos3d.x, pos3d.y, pos3d.z, rotation.x, rotation.y);
        
        if (projected.z > -radius * 0.2) { // Only draw visible dots
          const dotRadius = Math.max(4, Math.min(12, Math.log(parseFloat(transaction.amount)) * 2)) * projected.scale;
          
          // Add glow effect
          const glowGradient = ctx.createRadialGradient(
            projected.x, projected.y, 0,
            projected.x, projected.y, dotRadius * 2
          );
          glowGradient.addColorStop(0, 'rgba(239, 68, 68, 1)');
          glowGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.6)');
          glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          
          // Draw glow
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, dotRadius * 2, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
          
          // Draw main dot
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Store click area for interaction
          transaction._screenPos = { 
            x: projected.x, 
            y: projected.y, 
            radius: dotRadius,
            visible: true
          };
        } else {
          if (transaction._screenPos) {
            transaction._screenPos.visible = false;
          }
        }
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [transactions, rotation]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastMouse({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentMouse = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    };
    
    const deltaX = currentMouse.x - lastMouse.x;
    const deltaY = currentMouse.y - lastMouse.y;
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01
    }));
    
    setLastMouse(currentMouse);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    if (isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Find clicked transaction
    const clickedTransaction = transactions.find(t => {
      if (!t._screenPos || !t._screenPos.visible) return false;
      const distance = Math.sqrt(
        Math.pow(clickX - t._screenPos.x, 2) + 
        Math.pow(clickY - t._screenPos.y, 2)
      );
      return distance <= t._screenPos.radius;
    });
    
    setSelectedTransaction(clickedTransaction || null);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Auto-rotate when not interacting
  useEffect(() => {
    if (isDragging) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        ...prev,
        y: prev.y + 0.005
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [isDragging]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading fraud data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="bg-red-900 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-300 text-xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-center">Global Fraud Detection</h1>
          <p className="text-gray-300 text-center mt-2">
            Interactive 3D globe showing {transactions.length} fraud transactions. 
            Drag to rotate • Click dots for details
          </p>
          
          {/* Data Controls */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => generateData(500)}
                disabled={isGenerating || isClearing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    Generate 500 Transactions
                  </>
                )}
              </button>
              
              <button
                onClick={() => generateData(2000)}
                disabled={isGenerating || isClearing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>📈</span>
                    Generate 2000 Transactions
                  </>
                )}
              </button>
            </div>
            
            <button
              onClick={clearData}
              disabled={isGenerating || isClearing}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isClearing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Clearing...
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  Clear All Data
                </>
              )}
            </button>
          </div>
          
          {/* Status Messages */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mt-4 mx-auto max-w-md">
              <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}
          
          {(isGenerating || isClearing) && (
            <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-3 mt-4 mx-auto max-w-md">
              <p className="text-blue-200 text-sm text-center">
                {isGenerating ? 'Generating synthetic transaction data...' : 'Clearing transaction data...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Globe Container */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex justify-center">
                <div className="border-2 border-gray-600 rounded-lg p-4 bg-gray-900">
                  <canvas 
                    ref={canvasRef}
                    className="cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleClick}
                    style={{ display: 'block' }}
                  />
                </div>
              </div>
              
              {/* Controls */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-4 text-sm text-gray-300 flex-wrap justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span>Fraud Transaction</span>
                  </div>
                  <span>•</span>
                  <span>🖱️ Drag to rotate</span>
                  <span>•</span>
                  <span>👆 Click dots for details</span>
                  <span>•</span>
                  <span>🔄 Auto-rotates when idle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details Panel */}
          <div className="xl:w-96 w-full">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl h-full">
              <h2 className="text-xl font-bold mb-4 text-center">Transaction Details</h2>
              
              {selectedTransaction ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900 text-red-300 border border-red-500 animate-pulse">
                      🚨 FRAUD DETECTED
                    </span>
                  </div>

                  {/* Transaction Info */}
                  <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID:</span>
                      <span className="font-mono text-sm text-right">{selectedTransaction.transactionId}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="font-bold text-red-400 text-lg">
                        {formatAmount(selectedTransaction.amount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span>{formatDate(selectedTransaction.timestamp)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Merchant:</span>
                      <span className="text-right max-w-[60%] truncate">{selectedTransaction.merchantName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span>{selectedTransaction.merchantCategory}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment:</span>
                      <span>{selectedTransaction.paymentMethod}</span>
                    </div>
                    
                    {selectedTransaction.cardLastFour && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Card:</span>
                        <span className="font-mono">****{selectedTransaction.cardLastFour}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-right text-sm max-w-[60%]">
                        {selectedTransaction.locationCity}, {selectedTransaction.locationCountry}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Score:</span>
                      <span className="font-bold text-orange-400">
                        {selectedTransaction.riskScore ? (selectedTransaction.riskScore * 100).toFixed(1) + '%' : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Fraud Reason */}
                  {selectedTransaction.fraudReason && (
                    <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3">
                      <h4 className="text-red-300 font-semibold mb-2">Fraud Reason:</h4>
                      <p className="text-red-200 text-sm">{selectedTransaction.fraudReason}</p>
                    </div>
                  )}

                  {/* User Info */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <h4 className="text-gray-300 font-semibold mb-2">User Information:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">User ID:</span>
                        <span className="font-mono">{selectedTransaction.userId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Device:</span>
                        <span>{selectedTransaction.deviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">IP Address:</span>
                        <span className="font-mono text-xs">{selectedTransaction.ipAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clear Selection Button */}
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-4">🌍</div>
                  {transactions.length === 0 ? (
                    <>
                      <p className="text-lg mb-2">No fraud data available</p>
                      <p className="text-sm mb-4">Generate some transactions to see the 3D globe in action</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => generateData(500)}
                          disabled={isGenerating}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors block mx-auto"
                        >
                          {isGenerating ? 'Generating...' : 'Generate Sample Data'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-2">Click on a red dot</p>
                      <p className="text-sm">to view transaction details</p>
                      <div className="mt-4 text-xs text-gray-500">
                        {transactions.length} fraud transactions detected
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-gray-400">Total Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{stats.fraudulent}</div>
              <div className="text-gray-400">Fraud Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{stats.legitimate}</div>
              <div className="text-gray-400">Legitimate Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {stats.fraudRate ? stats.fraudRate.toFixed(2) + '%' : '0%'}
              </div>
              <div className="text-gray-400">Fraud Rate</div>
            </div>
          </div>
          
          {transactions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-xl font-bold text-yellow-400">
                    {formatAmount(transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0))}
                  </div>
                  <div className="text-gray-400">Total Fraud Amount</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-400">
                    {(transactions.reduce((sum, t) => sum + parseFloat(t.riskScore || 0), 0) / transactions.length * 100).toFixed(1) + '%'}
                  </div>
                  <div className="text-gray-400">Avg Risk Score</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FraudGlobe;