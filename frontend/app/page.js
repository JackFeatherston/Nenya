'use client'

import React, { useEffect, useRef, useState } from 'react';

const FraudGlobe = () => {
  const canvasRef = useRef();
  const frameRef = useRef();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [rotation, setRotation] = useState({ x: 0.2, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Sample fraud transactions for demo
  const sampleTransactions = [
    { id: 1, transactionId: "TXN-123456789", amount: 2500.00, merchantName: "Suspicious Shop Inc", 
      lat: 40.7128, lng: -74.0060, locationCity: "New York", locationCountry: "USA", 
      fraudReason: "Unusual spending pattern", riskScore: 0.95 },
    { id: 2, transactionId: "TXN-987654321", amount: 5000.00, merchantName: "Fake Electronics", 
      lat: 51.5074, lng: -0.1278, locationCity: "London", locationCountry: "UK", 
      fraudReason: "High-risk location", riskScore: 0.88 },
    { id: 3, transactionId: "TXN-456789123", amount: 750.00, merchantName: "Scammer Store", 
      lat: 35.6762, lng: 139.6503, locationCity: "Tokyo", locationCountry: "Japan", 
      fraudReason: "Compromised card", riskScore: 0.92 },
    { id: 4, transactionId: "TXN-789123456", amount: 3200.00, merchantName: "Dodgy Goods Co", 
      lat: -33.8688, lng: 151.2093, locationCity: "Sydney", locationCountry: "Australia", 
      fraudReason: "Identity theft", riskScore: 0.89 },
    { id: 5, transactionId: "TXN-321654987", amount: 1850.00, merchantName: "Fraud Mart", 
      lat: 19.0760, lng: 72.8777, locationCity: "Mumbai", locationCountry: "India", 
      fraudReason: "Account takeover", riskScore: 0.94 },
    { id: 6, transactionId: "TXN-654987321", amount: 4500.00, merchantName: "Criminal Corp", 
      lat: -23.5505, lng: -46.6333, locationCity: "São Paulo", locationCountry: "Brazil", 
      fraudReason: "Multiple rapid transactions", riskScore: 0.91 },
  ];

  useEffect(() => {
    setTransactions(sampleTransactions);
  }, []);

  // Detailed continent data - simplified but more accurate coastlines
  const continentData = {
    // North America
    northAmerica: [
      // Canada
      [60, -140], [70, -120], [75, -100], [70, -80], [65, -70], [60, -65], [55, -60],
      [50, -55], [45, -60], [40, -70], [45, -75], [50, -80], [55, -85], [60, -90],
      [65, -95], [70, -100], [75, -110], [70, -130], [65, -140], [60, -140],
      // USA lower 48
      [48, -125], [45, -120], [40, -115], [35, -110], [30, -105], [25, -100], [25, -95],
      [30, -90], [35, -85], [40, -80], [45, -75], [48, -70], [45, -70], [40, -75],
      [35, -80], [30, -85], [25, -90], [25, -95], [30, -100], [35, -105], [40, -110],
      [45, -115], [48, -120], [48, -125],
      // Mexico
      [25, -110], [20, -105], [15, -100], [18, -95], [20, -90], [25, -95], [25, -110],
    ],
    
    // South America
    southAmerica: [
      [12, -70], [10, -75], [5, -80], [0, -75], [-5, -70], [-10, -65], [-15, -60],
      [-20, -55], [-25, -50], [-30, -45], [-35, -50], [-40, -55], [-45, -60], [-50, -65],
      [-55, -70], [-50, -75], [-45, -70], [-40, -65], [-35, -60], [-30, -55], [-25, -60],
      [-20, -65], [-15, -70], [-10, -75], [-5, -80], [0, -85], [5, -80], [10, -75], [12, -70],
    ],
    
    // Europe
    europe: [
      [70, -10], [75, 0], [70, 10], [65, 20], [60, 30], [55, 35], [50, 30], [45, 25],
      [40, 20], [35, 15], [40, 10], [45, 5], [50, 0], [55, -5], [60, -10], [65, -15],
      [70, -10],
    ],
    
    // Africa
    africa: [
      [35, -10], [30, -15], [25, -20], [20, -15], [15, -10], [10, -5], [5, 0], [0, 5],
      [-5, 10], [-10, 15], [-15, 20], [-20, 25], [-25, 30], [-30, 35], [-35, 30],
      [-30, 25], [-25, 20], [-20, 15], [-15, 10], [-10, 5], [-5, 0], [0, -5], [5, -10],
      [10, -15], [15, -20], [20, -25], [25, -20], [30, -15], [35, -10],
    ],
    
    // Asia
    asia: [
      [75, 60], [70, 80], [65, 100], [60, 120], [55, 140], [50, 150], [45, 140], [40, 130],
      [35, 120], [30, 110], [25, 100], [30, 90], [35, 80], [40, 70], [45, 60], [50, 50],
      [55, 40], [60, 50], [65, 60], [70, 70], [75, 60],
      // India subcontinent
      [35, 70], [30, 75], [25, 80], [20, 85], [15, 90], [10, 85], [15, 80], [20, 75],
      [25, 70], [30, 65], [35, 70],
      // Southeast Asia
      [20, 95], [15, 100], [10, 105], [5, 110], [0, 115], [-5, 120], [-10, 115], [-5, 110],
      [0, 105], [5, 100], [10, 95], [15, 90], [20, 95],
    ],
    
    // Australia
    australia: [
      [-10, 110], [-15, 115], [-20, 120], [-25, 125], [-30, 130], [-35, 135], [-40, 140],
      [-35, 145], [-30, 150], [-25, 155], [-20, 150], [-15, 145], [-10, 140], [-5, 135],
      [-10, 130], [-10, 125], [-10, 120], [-10, 115], [-10, 110],
    ],
    
    // Antarctica (simplified)
    antarctica: [
      [-60, -180], [-65, -120], [-70, -60], [-75, 0], [-70, 60], [-65, 120], [-60, 180],
      [-65, 150], [-70, 100], [-75, 50], [-70, 0], [-65, -50], [-60, -100], [-60, -180],
    ]
  };

  // Convert lat/lng to 3D coordinates
  const latLngTo3D = (lat, lng, r = 200) => {
    const phi = (lat * Math.PI) / 180;
    const theta = ((lng - 90) * Math.PI) / 180;

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.sin(phi);
    const z = r * Math.cos(phi) * Math.sin(theta);

    return { x, y, z };
  };

  // Project 3D to 2D with rotation
  const project3D = (x, y, z, rotX, rotY) => {
    const centerX = 300;
    const centerY = 300;
    
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
      scale: Math.max(0.1, scale),
      z: z2
    };
  };

  // Enhanced 3D Globe rendering
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

    // Generate enhanced grid lines
    const generateGridLines = () => {
      const lines = [];
      
      // Latitude lines (parallels)
      for (let lat = -80; lat <= 80; lat += 20) {
        const line = [];
        for (let lng = -180; lng <= 180; lng += 5) {
          const pos3d = latLngTo3D(lat, lng, radius);
          line.push({ lat, lng, ...pos3d });
        }
        lines.push(line);
      }
      
      // Longitude lines (meridians)
      for (let lng = -180; lng <= 180; lng += 30) {
        const line = [];
        for (let lat = -80; lat <= 80; lat += 3) {
          const pos3d = latLngTo3D(lat, lng, radius);
          line.push({ lat, lng, ...pos3d });
        }
        lines.push(line);
      }
      
      return lines;
    };

    const gridLines = generateGridLines();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Create realistic ocean gradient
      const oceanGradient = ctx.createRadialGradient(
        centerX - 80, centerY - 80, 50, 
        centerX, centerY, radius + 50
      );
      oceanGradient.addColorStop(0, '#6eb5ff');
      oceanGradient.addColorStop(0.3, '#4a9eff');
      oceanGradient.addColorStop(0.7, '#2c5aa0');
      oceanGradient.addColorStop(1, '#1a365d');

      // Draw ocean sphere with enhanced shading
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGradient;
      ctx.fill();
      
      // Add subtle outer glow
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, radius - 10,
        centerX, centerY, radius + 20
      );
      glowGradient.addColorStop(0, 'rgba(74, 158, 255, 0)');
      glowGradient.addColorStop(1, 'rgba(74, 158, 255, 0.3)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      gridLines.forEach(line => {
        ctx.beginPath();
        let first = true;
        line.forEach(point => {
          const projected = project3D(point.x, point.y, point.z, rotation.x, rotation.y);
          if (projected.z > -radius * 0.8) {
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

      // Draw continents with realistic colors and shading
      Object.entries(continentData).forEach(([continentName, coords]) => {
        // Convert coordinates to 3D points
        const points3D = coords.map(([lat, lng]) => {
          const pos3d = latLngTo3D(lat, lng, radius + 2); // Slightly raised above ocean
          return { lat, lng, ...pos3d };
        });

        // Filter visible points and project to 2D
        const visiblePoints = points3D
          .map(point => ({
            ...point,
            projected: project3D(point.x, point.y, point.z, rotation.x, rotation.y)
          }))
          .filter(point => point.projected.z > -radius * 0.5);

        if (visiblePoints.length < 3) return;

        // Create continent-specific colors
        let continentColor;
        switch(continentName) {
          case 'northAmerica':
            continentColor = 'rgba(76, 175, 80, 0.9)';
            break;
          case 'southAmerica':
            continentColor = 'rgba(139, 195, 74, 0.9)';
            break;
          case 'europe':
            continentColor = 'rgba(66, 165, 245, 0.7)';
            break;
          case 'africa':
            continentColor = 'rgba(255, 193, 7, 0.8)';
            break;
          case 'asia':
            continentColor = 'rgba(255, 138, 101, 0.8)';
            break;
          case 'australia':
            continentColor = 'rgba(156, 39, 176, 0.8)';
            break;
          default:
            continentColor = 'rgba(96, 125, 139, 0.7)';
        }

        // Draw filled continent
        ctx.beginPath();
        ctx.fillStyle = continentColor;
        
        visiblePoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.projected.x, point.projected.y);
          } else {
            ctx.lineTo(point.projected.x, point.projected.y);
          }
        });
        
        ctx.closePath();
        ctx.fill();

        // Add continent borders
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add terrain texture with small dots
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < visiblePoints.length; i += 3) {
          const point = visiblePoints[i];
          if (Math.random() > 0.7) {
            ctx.beginPath();
            ctx.arc(point.projected.x + (Math.random() - 0.5) * 20, 
                   point.projected.y + (Math.random() - 0.5) * 20, 
                   0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw equator line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let firstEquatorPoint = true;
      for (let lng = -180; lng <= 180; lng += 5) {
        const pos3d = latLngTo3D(0, lng, radius);
        const projected = project3D(pos3d.x, pos3d.y, pos3d.z, rotation.x, rotation.y);
        if (projected.z > -radius * 0.5) {
          if (firstEquatorPoint) {
            ctx.moveTo(projected.x, projected.y);
            firstEquatorPoint = false;
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
      }
      ctx.stroke();

      // Draw fraud transaction dots with enhanced effects
      transactions.forEach((transaction) => {
        const pos3d = latLngTo3D(transaction.lat, transaction.lng, radius + 5);
        const projected = project3D(pos3d.x, pos3d.y, pos3d.z, rotation.x, rotation.y);
        
        if (projected.z > -radius * 0.3) {
          const baseRadius = Math.max(4, Math.min(12, Math.log(transaction.amount) * 1.5));
          const dotRadius = baseRadius * projected.scale;
          
          // Pulsing effect
          const pulseScale = 1 + 0.3 * Math.sin(Date.now() * 0.008);
          
          // Create multi-layer glow effect
          const outerGlow = ctx.createRadialGradient(
            projected.x, projected.y, 0,
            projected.x, projected.y, dotRadius * 3 * pulseScale
          );
          outerGlow.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
          outerGlow.addColorStop(0.3, 'rgba(239, 68, 68, 0.4)');
          outerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
          
          // Draw outer glow
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, dotRadius * 3 * pulseScale, 0, Math.PI * 2);
          ctx.fillStyle = outerGlow;
          ctx.fill();
          
          // Inner glow
          const innerGlow = ctx.createRadialGradient(
            projected.x, projected.y, 0,
            projected.x, projected.y, dotRadius * 1.5
          );
          innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          innerGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.9)');
          innerGlow.addColorStop(1, 'rgba(220, 38, 38, 0.7)');
          
          // Draw main dot
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, dotRadius * pulseScale, 0, Math.PI * 2);
          ctx.fillStyle = innerGlow;
          ctx.fill();
          
          // Add bright center
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, dotRadius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();

          // Store click area
          transaction._screenPos = { 
            x: projected.x, 
            y: projected.y, 
            radius: dotRadius * pulseScale,
            visible: true
          };
        } else {
          if (transaction._screenPos) {
            transaction._screenPos.visible = false;
          }
        }
      });

      // Add atmosphere glow around the entire globe
      const atmosphereGradient = ctx.createRadialGradient(
        centerX, centerY, radius,
        centerX, centerY, radius + 30
      );
      atmosphereGradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)');
      atmosphereGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 30, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGradient;
      ctx.fill();

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
      x: Math.max(-Math.PI/2, Math.min(Math.PI/2, prev.x + deltaY * 0.01)),
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

  // Auto-rotate
  useEffect(() => {
    if (isDragging) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        ...prev,
        y: prev.y + 0.003
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [isDragging]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Enhanced Global Fraud Detection
          </h1>
          <p className="text-gray-300 text-lg">
            Interactive 3D globe with realistic continents showing {transactions.length} fraud transactions
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Globe Container */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
              <div className="flex justify-center">
                <div className="relative">
                  <canvas 
                    ref={canvasRef}
                    className="cursor-move rounded-lg shadow-lg"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleClick}
                    style={{ display: 'block' }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-lg p-2 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Fraud Alert</span>
                    </div>
                    <div className="text-gray-300">Drag to rotate • Click dots for details</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details Panel */}
          <div className="xl:w-96 w-full">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 h-full">
              <h2 className="text-2xl font-bold mb-6 text-center">Transaction Details</h2>
              
              {selectedTransaction ? (
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="text-center">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-900 text-red-300 border-2 border-red-500 animate-pulse">
                      🚨 FRAUD DETECTED
                    </span>
                  </div>

                  {/* Transaction Info */}
                  <div className="bg-gray-700 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Transaction ID:</span>
                      <span className="font-mono text-sm bg-gray-600 px-2 py-1 rounded">
                        {selectedTransaction.transactionId}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Amount:</span>
                      <span className="font-bold text-red-400 text-xl">
                        {formatAmount(selectedTransaction.amount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Merchant:</span>
                      <span className="text-right max-w-[60%] truncate font-medium">
                        {selectedTransaction.merchantName}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-right text-sm">
                        📍 {selectedTransaction.locationCity}, {selectedTransaction.locationCountry}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Risk Score:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 transition-all duration-500"
                            style={{ width: `${(selectedTransaction.riskScore * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-orange-400 text-sm">
                          {(selectedTransaction.riskScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fraud Reason */}
                  <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-4">
                    <h4 className="text-red-300 font-bold mb-2 flex items-center gap-2">
                      ⚠️ Fraud Reason:
                    </h4>
                    <p className="text-red-200">{selectedTransaction.fraudReason}</p>
                  </div>

                  {/* Clear Selection Button */}
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg"
                  >
                    Clear Selection
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-6xl mb-6">🌍</div>
                  <p className="text-xl mb-3">Enhanced Globe View</p>
                  <p className="text-sm mb-6">
                    Click on the pulsing red dots to view fraud transaction details
                  </p>
                  <div className="bg-gray-700 rounded-lg p-4 text-xs space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <span>Ocean with depth and atmosphere</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Fraud transactions with glow effects</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-12 bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-red-400">{transactions.length}</div>
              <div className="text-gray-400">Active Fraud Alerts</div>
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-yellow-400">
                {formatAmount(transactions.reduce((sum, t) => sum + t.amount, 0))}
              </div>
              <div className="text-gray-400">Total Fraud Amount</div>
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 w-3/4"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-400">
                {transactions.length > 0 ? 
                  ((transactions.reduce((sum, t) => sum + t.riskScore, 0) / transactions.length) * 100).toFixed(1) + '%' : 
                  '0%'
                }
              </div>
              <div className="text-gray-400">Average Risk Score</div>
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-4/5"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center text-gray-400 text-sm">
              <p className="mb-2">🌎 Global Fraud Monitoring System - Enhanced 3D Visualization</p>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  North America
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-lime-400"></div>
                  South America
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  Europe
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  Africa
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  Asia
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  Australia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudGlobe;