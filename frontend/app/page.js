'use client'

import React, { useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { geoOrthographic, geoPath, geoGraticule } from 'd3-geo';
import { drag } from 'd3-drag';
import { zoom } from 'd3-zoom';

const FraudGlobe = () => {
  const svgRef = useRef();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch fraud transactions from API
  useEffect(() => {
    const fetchFraudTransactions = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/transactions/fraudulent');
        if (!response.ok) throw new Error('Failed to fetch fraud transactions');
        const data = await response.json();
        
        // Add random coordinates for visualization
        const transactionsWithCoords = data.map(transaction => ({
          ...transaction,
          lat: (Math.random() - 0.5) * 160,
          lng: (Math.random() - 0.5) * 360
        }));
        
        setTransactions(transactionsWithCoords);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFraudTransactions();
  }, []);

  useEffect(() => {
    if (loading || transactions.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 500;
    const sensitivity = 75;

    svg.attr("width", width).attr("height", height);

    const projection = geoOrthographic()
      .scale(200)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2]);

    const initialScale = projection.scale();
    const path = geoPath().projection(projection);
    const globe = { type: "Sphere" };

    // Add gradient
    const defs = svg.append("defs");
    const gradient = defs.append("radialGradient")
      .attr("id", "globeGradient")
      .attr("cx", "30%")
      .attr("cy", "30%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4a90e2");
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#1e3a5f");

    // Draw globe
    svg.append("path")
      .datum(globe)
      .attr("d", path)
      .style("fill", "url(#globeGradient)")
      .style("stroke", "#2c5282")
      .style("stroke-width", "2px");

    // Add graticule
    const graticule = geoGraticule();
    svg.append("path")
      .datum(graticule)
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", "rgba(255,255,255,0.1)")
      .style("stroke-width", "1px");

    // Add fraud dots
    const fraudDots = svg.selectAll(".fraud-dot")
      .data(transactions)
      .enter()
      .append("circle")
      .attr("class", "fraud-dot")
      .attr("r", d => Math.max(4, Math.log(parseFloat(d.amount)) * 1.5))
      .style("fill", "#ef4444")
      .style("stroke", "#dc2626")
      .style("stroke-width", "2px")
      .style("cursor", "pointer")
      .style("opacity", 0.9)
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedTransaction(d);
      })
      .on("mouseover", function(event, d) {
        select(this)
          .transition()
          .duration(200)
          .attr("r", Math.max(6, Math.log(parseFloat(d.amount)) * 2))
          .style("opacity", 1)
          .style("fill", "#ff6b6b");
      })
      .on("mouseout", function(event, d) {
        select(this)
          .transition()
          .duration(200)
          .attr("r", Math.max(4, Math.log(parseFloat(d.amount)) * 1.5))
          .style("opacity", 0.9)
          .style("fill", "#ef4444");
      });

    function positionDots() {
      fraudDots
        .attr("cx", d => {
          const coords = projection([d.lng, d.lat]);
          return coords ? coords[0] : -1000;
        })
        .attr("cy", d => {
          const coords = projection([d.lng, d.lat]);
          return coords ? coords[1] : -1000;
        })
        .style("display", d => {
          const coords = projection([d.lng, d.lat]);
          if (!coords) return "none";
          
          const lambda = d.lng * Math.PI / 180;
          const phi = d.lat * Math.PI / 180;
          const rotate = projection.rotate();
          const rotLambda = rotate[0] * Math.PI / 180;
          const rotPhi = rotate[1] * Math.PI / 180;
          
          const cosc = Math.sin(phi) * Math.sin(rotPhi) + Math.cos(phi) * Math.cos(rotPhi) * Math.cos(lambda - rotLambda);
          return cosc > 0 ? "block" : "none";
        });
    }

    positionDots();

    // Drag behavior
    const dragBehavior = drag()
      .subject(function() {
        const r = projection.rotate();
        return { x: r[0] / sensitivity, y: -r[1] / sensitivity };
      })
      .on("drag", function(event) {
        const rotate = projection.rotate();
        projection.rotate([
          event.x * sensitivity,
          -event.y * sensitivity,
          rotate[2]
        ]);
        
        svg.selectAll("path").attr("d", path);
        positionDots();
      });

    svg.call(dragBehavior);

    // Zoom behavior
    const zoomBehavior = zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", function(event) {
        const { transform } = event;
        projection.scale(initialScale * transform.k);
        svg.selectAll("path").attr("d", path);
        positionDots();
      });

    svg.call(zoomBehavior);

  }, [transactions, loading]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

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
            Interactive globe showing {transactions.length} fraud transactions. 
            Drag to rotate • Scroll to zoom • Click dots for details
          </p>
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
                  <svg ref={svgRef} className="drop-shadow-2xl"></svg>
                </div>
              </div>
              
              {/* Controls */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-4 text-sm text-gray-300 flex-wrap justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Fraud Transaction</span>
                  </div>
                  <span>•</span>
                  <span>Drag to rotate</span>
                  <span>•</span>
                  <span>Scroll to zoom</span>
                  <span>•</span>
                  <span>Click for details</span>
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
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900 text-red-300 border border-red-500">
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
                  <p className="text-lg mb-2">Click on a red dot</p>
                  <p className="text-sm">to view transaction details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">{transactions.length}</div>
              <div className="text-gray-400">Fraud Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {transactions.length > 0 ? 
                  formatAmount(transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)) 
                  : '$0'
                }
              </div>
              <div className="text-gray-400">Total Fraud Amount</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {transactions.length > 0 ? 
                  (transactions.reduce((sum, t) => sum + parseFloat(t.riskScore || 0), 0) / transactions.length * 100).toFixed(1) + '%'
                  : '0%'
                }
              </div>
              <div className="text-gray-400">Avg Risk Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudGlobe;