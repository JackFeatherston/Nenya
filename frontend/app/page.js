'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FraudVsLegitChart, MerchantFraudChart, FraudulentReasonsChart, AnalyticsCards } from './analytics.js';
import Navbar from './navbar.js';

const FraudGlobe = () => {
  const globeRef = useRef();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState({ total: 0, fraudulent: 0, legitimate: 0, fraudRate: 0 });
  const [worldData, setWorldData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState('all'); 
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load world atlas data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        // Use world atlas data from unpkg CDN (reliable source for TopoJSON data)
        const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
        if (!response.ok) throw new Error('Failed to load world data');
        
        const topojsonData = await response.json();
        
        // Convert TopoJSON to GeoJSON
        const { countries, land } = topojsonData.objects;
        
        const worldGeoData = {
          land: topojson.feature(topojsonData, land),
          countries: topojson.feature(topojsonData, countries),
          countryMesh: topojson.mesh(topojsonData, countries, (a, b) => a !== b)
        };
        
        setWorldData(worldGeoData);
      } catch (err) {
        console.error('Failed to load world data:', err);
        // Continue without world data - app should still work
        setWorldData(null);
      }
    };

    loadWorldData();
  }, []);

  // Fetch fraud transactions and stats from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL transactions, not just fraudulent ones
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const transactionsResponse = await fetch(`${apiUrl}/api/transactions`);
      if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
      const transactionsData = await transactionsResponse.json();
      
      const statsResponse = await fetch(`${apiUrl}/api/transactions/stats`);
      if (!statsResponse.ok) throw new Error('Failed to fetch transaction stats');
      const statsData = await statsResponse.json();
      
      // Process all transactions with coordinates
      const transactionsWithCoords = transactionsData.map((transaction) => {
        return {
          ...transaction,
          lat: parseFloat(transaction.latitude) || 0,
          lng: parseFloat(transaction.longitude) || 0
        };
      });
      
      // Set all transactions for the table
      setAllTransactions(transactionsWithCoords);
      
      // Set only fraudulent transactions for the globe
      const fraudTransactions = transactionsWithCoords.filter(t => t.isFraudulent);
      setTransactions(fraudTransactions);
      
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
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/generate-data?count=${count}`, {
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
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/transactions`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear data');
      }
      
      // Clear all transactions including the filtered onces in the data table
      setTransactions([]);
      setAllTransactions([]); 
      setFilteredTransactions([]); 
      setStats({ total: 0, fraudulent: 0, legitimate: 0, fraudRate: 0 });
      setSelectedTransaction(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsClearing(false);
    }
  };

  // Globe implementation 
  useEffect(() => {
    if (!globeRef.current || loading) return;
  
    // Clear previous globe
    d3.select(globeRef.current).selectAll("*").remove();
  
    // Make globe responsive to container size
    const containerRect = globeRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width || 800;
    const maxSize = Math.min(containerWidth, 800, window.innerHeight * 0.6);
    
    const width = maxSize;
    const height = maxSize;
    const sensitivity = 75;
  
    // Create SVG
    const svg = d3
      .select(globeRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto');
  
    // Create projection and path generator
    const projection = d3
      .geoOrthographic()
      .scale(width * 0.35) // Scale relative to width
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2]);
      
    const path = d3.geoPath().projection(projection);
  
    // Create globe sphere background
    svg
      .append('path')
      .datum({ type: 'Sphere' })
      .attr('class', 'sphere')
      .attr('d', path)
      .style('fill', '#87CEEB') // Light blue ocean
      .style('stroke', '#616771')
      .style('stroke-width', '2px');
  
    // Create graticule (grid lines)
    const graticule = d3.geoGraticule();
    
    svg
      .append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', path)
      .style('fill', 'none')
      .style('stroke', 'rgba(144, 148, 156, 0.3)')
      .style('stroke-width', '0.5px');
  
    // Draw high-resolution world data if available
    if (worldData) {
      // Draw land masses
      svg
        .selectAll('.land')
        .data(worldData.land.features)
        .enter()
        .append('path')
        .attr('class', 'land')
        .attr('d', path)
        .style('fill', '#90EE90') // Light green for land
        .style('stroke', 'none');
  
      // Draw country boundaries
      svg
        .append('path')
        .datum(worldData.countryMesh)
        .attr('class', 'country-borders')
        .attr('d', path)
        .style('fill', 'none')
        .style('stroke', '#616771') // Dark gray for borders
        .style('stroke-width', '0.5px')
        .style('opacity', 0.8);
    } 
  
    const dots = svg
        .selectAll('.fraud-dot')
        .data(transactions)
        .enter()
        .append('circle')
        .attr('class', 'fraud-dot')
        .attr('r', d => Math.max(3, Math.min(8, Math.log(parseFloat(d.amount)))))
        .attr('cx', d => {
          const coords = projection([d.lng, d.lat]);
          return coords ? coords[0] : -1000;
        })
        .attr('cy', d => {
          const coords = projection([d.lng, d.lat]);
          return coords ? coords[1] : -1000;
        })
        .style('fill', '#ef4444')
        .style('stroke', '#dc2626')
        .style('stroke-width', '2px')
        .style('cursor', 'pointer')
        .style('filter', 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))')
        .style('pointer-events', 'all') // Ensure pointer events are enabled
        .each(function(d) {
          // Store original radius for each dot
          d3.select(this).datum().originalRadius = Math.max(3, Math.min(8, Math.log(parseFloat(d.amount))));
        })
        .on('click', function(event, d) {
          // Prevent event bubbling to avoid triggering drag
          event.stopPropagation();
          event.preventDefault();
          setSelectedTransaction(d);
        })
        .on('mouseenter', function(event, d) {
          // Use mouseenter instead of mouseover to prevent rapid firing
          const currentDot = d3.select(this);
          const originalRadius = d.originalRadius || Math.max(3, Math.min(8, Math.log(parseFloat(d.amount))));
          
          // Stop any existing transitions
          currentDot.interrupt();
          
          // Scale up smoothly
          currentDot
            .transition()
            .duration(150)
            .ease(d3.easeQuadOut)
            .attr('r', originalRadius * 1.5)
            .style('stroke-width', '3px');
        })
        .on('mouseleave', function(event, d) {
          // Use mouseleave instead of mouseout to prevent rapid firing
          const currentDot = d3.select(this);
          const originalRadius = d.originalRadius || Math.max(3, Math.min(8, Math.log(parseFloat(d.amount))));
          
          // Stop any existing transitions
          currentDot.interrupt();
          
          // Scale back down smoothly
          currentDot
            .transition()
            .duration(150)
            .ease(d3.easeQuadOut)
            .attr('r', originalRadius)
            .style('stroke-width', '2px');
        });
  
    // Add pulsing animation to dots
    dots
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .style('opacity', 1);
  
    // Helper function to update all elements when rotation changes
    const updateElements = () => {
      // Update all world elements
      svg.selectAll('.land').attr('d', path);
      svg.selectAll('.continent').attr('d', path);
      svg.selectAll('.country-borders').attr('d', path);
      svg.selectAll('.sphere').attr('d', path);
      svg.selectAll('.graticule').attr('d', path);
      
      svg.selectAll('.fraud-dot')
        .attr('cx', d => {
          const coords = projection([d.lng, d.lat]);
          return coords ? coords[0] : -1000;
        })
        .attr('cy', d => {
          const coords = projection([d.lng, d.lat]);
          return coords ? coords[1] : -1000;
        })
        .style('opacity', d => {
          const coords = projection([d.lng, d.lat]);
          if (!coords) return 0;
          // Hide dots on the back of the globe using actual coordinates
          const distance = d3.geoDistance([d.lng, d.lat], projection.invert([width/2, height/2]));
          return distance > Math.PI/2 ? 0 : 1;
        })
        .each(function(d) {
          const currentRadius = d3.select(this).attr('r');
          const originalRadius = Math.max(3, Math.min(8, Math.log(parseFloat(d.amount))));
          
          // Only update if we're not in a hover state (radius hasn't been scaled)
          if (Math.abs(currentRadius - originalRadius) < 0.1) {
            d3.select(this).attr('r', originalRadius);
          }
          
          d.originalRadius = originalRadius;
        });
    };
  
    // Rotation functionality with transaction panel closure
    const drag = d3.drag()
      .on('start', function(event) {
        // Clear selected transaction when drag starts
        setSelectedTransaction(null);
      })
      .on('drag', function(event) {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        projection.rotate([
          rotate[0] + event.dx * k,
          rotate[1] - event.dy * k
        ]);
  
        updateElements();
      });
  
    svg.call(drag);
  
    return () => {
      d3.select(globeRef.current).selectAll("*").remove();
    };
  
  }, [transactions, loading, worldData]);

  const TransactionDetailsPanel = () => {
    // Only render the panel if a transaction is selected
    if (!selectedTransaction) {
      return null;
    }
  
    return (
      <div className="w-full xl:w-96 xl:flex-shrink-0">
        <div 
          className="rounded-lg p-4 sm:p-6 shadow-xl h-full relative"
          style={{ backgroundColor: '#F5F5F5', border: '1px solid #D1D5DB' }}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedTransaction(null)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:opacity-70"
            style={{ color: '#90949C' }}
            title="Close transaction details"
          >
            ×
          </button>
  
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-center pr-8" style={{ color: '#374151' }}>
            Transaction Details
          </h2>
          
          <div className="space-y-4">
            {/* Transaction Info */}
            <div 
              className="rounded-lg p-3 sm:p-4 space-y-3"
              style={{ backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }}
            >
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Transaction ID:</span>
                <span className="font-mono text-xs sm:text-sm text-right" style={{ color: '#374151' }}>
                  {selectedTransaction.transactionId}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Amount:</span>
                <span className="font-bold text-red-400 text-lg">
                  {formatAmount(selectedTransaction.amount)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Date:</span>
                <span style={{ color: '#374151' }}>{formatDate(selectedTransaction.timestamp)}</span>
              </div>
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Merchant:</span>
                <span className="text-right max-w-[60%] truncate" style={{ color: '#374151' }}>
                  {selectedTransaction.merchantName}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Category:</span>
                <span className='text-right' style={{ color: '#374151' }}>{selectedTransaction.merchantCategory}</span>
              </div>
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Payment:</span>
                <span style={{ color: '#374151' }}>{selectedTransaction.paymentMethod}</span>
              </div>
              
              {selectedTransaction.cardLastFour && (
                <div className="flex justify-between">
                  <span style={{ color: '#374151' }}>Card:</span>
                  <span className="font-mono" style={{ color: '#374151' }}>
                    ****{selectedTransaction.cardLastFour}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Location:</span>
                <span className="text-right text-sm max-w-[60%]" style={{ color: '#374151' }}>
                  {selectedTransaction.locationCity}, {selectedTransaction.locationCountry}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Coordinates:</span>
                <span className="font-mono text-xs text-right" style={{ color: '#374151' }}>
                  {selectedTransaction.lat.toFixed(4)}, {selectedTransaction.lng.toFixed(4)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span style={{ color: '#374151' }}>Risk Score:</span>
                <span className="font-bold text-orange-400">
                  {selectedTransaction.riskScore ? parseFloat(selectedTransaction.riskScore).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
            </div>
  
            {/* Fraud Reason */}
            {selectedTransaction.fraudReason && (
              <div className="bg-red-900 text-red-300 border border-red-500 rounded-lg p-3">
                <h4 className="text-red-300 font-semibold mb-2">Fraud Reason:</h4>
                <p className="text-red-200 text-sm">{formatFraudReason(selectedTransaction.fraudReason)}</p>
              </div>
            )}
  
            {/* User Info */}
            <div className="rounded-lg p-3" style={{ backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }}>
              <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>User Information:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#374151' }}>User ID:</span>
                  <span className="font-mono" style={{ color: '#374151' }}>
                    {selectedTransaction.userId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#374151' }}>Device:</span>
                  <span style={{ color: '#374151' }}>{selectedTransaction.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#374151' }}>IP Address:</span>
                  <span className="font-mono text-xs" style={{ color: '#374151' }}>
                    {selectedTransaction.ipAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter and sort transactions when dependencies change
  useEffect(() => {
    const filtered = filterTransactions(allTransactions, transactionFilter);
    const sorted = sortTransactions(filtered, sortConfig);
    setFilteredTransactions(sorted);
    // Reset to page 1 
    setCurrentPage(1); 
  }, [allTransactions, transactionFilter, sortConfig]);

  // Pages for data table
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to format fraud reason labels for display
  const formatFraudReason = (reason) => {
    if (!reason || reason.trim() === '') return 'Unknown';
    
    // Handle ml_detected format with comma-separated reasons
    if (reason.startsWith('ml_detected:')) {
      const subReasonsPart = reason.replace('ml_detected:', '').trim();
      if (subReasonsPart === '') return 'ML Detected';
      
      // Split by comma and take the first reason for the label
      const firstReason = subReasonsPart.split(',')[0].trim();
      return firstReason.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    
    // Handle other formats - convert snake_case to Title Case
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Transaction Table
  const TransactionTable = () => {
    const getSortIcon = (columnKey) => {
      if (sortConfig.key !== columnKey) {
        return '↕️';
      }
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    };
  
    const getFilterButtonStyle = (filterType) => {
      const baseStyle = "px-3 py-2 rounded-lg transition-colors text-sm font-medium";
      if (transactionFilter === filterType) {
        switch (filterType) {
          case 'fraud':
            return `${baseStyle} bg-red-600 text-white`;
          case 'legitimate':
            return `${baseStyle} bg-green-600 text-white`;
          default:
            return `${baseStyle} custom-button-primary`;
        }
      }
      return `${baseStyle} custom-card hover:opacity-80`;
    };
  
    return (
      <div className="custom-card rounded-lg p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#616771' }}>Transaction History</h2>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTransactionFilter('all')}
              className={getFilterButtonStyle('all')}
            >
              All 
            </button>
            <button
              onClick={() => setTransactionFilter('fraud')}
              className={getFilterButtonStyle('fraud')}
            >
              Fraud 
            </button>
            <button
              onClick={() => setTransactionFilter('legitimate')}
              className={getFilterButtonStyle('legitimate')}
            >
              Legitimate
            </button>
          </div>
        </div>
  
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#90949C' }}>
            <p>No transactions to display</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#90949C' }}>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('isFraudulent')}
                    >
                      Status 
                    </th>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('transactionId')}
                    >
                      Transaction ID 
                    </th>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('amount')}
                    >
                      Amount {getSortIcon('amount')}
                    </th>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('merchantName')}
                    >
                      Merchant {getSortIcon('merchantName')}
                    </th>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm hidden md:table-cell"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('merchantCategory')}
                    >
                      Category {getSortIcon('merchantCategory')}
                    </th>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm hidden lg:table-cell"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('timestamp')}
                    >
                      Date {getSortIcon('timestamp')}
                    </th>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm hidden lg:table-cell"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('locationCity')}
                    >
                      Location {getSortIcon('locationCity')}
                    </th>
                    <th 
                      className="text-left p-2 sm:p-3 cursor-pointer hover:opacity-70 rounded text-xs sm:text-sm"
                      style={{ color: '#616771' }}
                      onClick={() => handleSort('riskScore')}
                    >
                      Risk {getSortIcon('riskScore')}
                    </th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm" style={{ color: '#616771' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="border-b hover:opacity-80 transition-colors"
                      style={{ borderColor: '#90949C' }}
                    >
                      <td className="p-2 sm:p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          transaction.isFraudulent 
                            ? 'bg-red-900 text-red-300 border border-red-500' 
                            : 'bg-green-900 text-green-300 border border-green-500'
                        }`}>
                          {transaction.isFraudulent ? 'Fraud' : 'Legit'}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs" style={{ color: '#616771' }}>
                        {transaction.transactionId.slice(-8)}...
                      </td>
                      <td className="p-2 sm:p-3 font-semibold">
                        <span className={transaction.isFraudulent ? 'text-red-400' : 'text-green-400'}>
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 max-w-32 truncate text-xs sm:text-sm" style={{ color: '#616771' }} title={transaction.merchantName}>
                        {transaction.merchantName}
                      </td>
                      <td className="p-2 sm:p-3 text-xs hidden md:table-cell" style={{ color: '#90949C' }}>
                        {transaction.merchantCategory}
                      </td>
                      <td className="p-2 sm:p-3 text-xs hidden lg:table-cell" style={{ color: '#90949C' }}>
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="p-2 sm:p-3 text-xs hidden lg:table-cell" style={{ color: '#90949C' }}>
                        {transaction.locationCity}, {transaction.locationCountry}
                      </td>
                      <td className="p-2 sm:p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          parseFloat(transaction.riskScore || 0) > 70 
                            ? 'bg-red-900 text-red-300' 
                            : parseFloat(transaction.riskScore || 0) > 30 
                            ? 'bg-yellow-900 text-yellow-300' 
                            : 'bg-green-900 text-green-300'
                        }`}>
                          {transaction.riskScore ? parseFloat(transaction.riskScore).toFixed(0) + '%' : 'N/A'}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="custom-button-primary px-2 py-1 rounded text-xs transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
  
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-xs sm:text-sm" style={{ color: '#90949C' }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-2 custom-card hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs sm:text-sm transition-colors"
                    style={{ color: '#616771' }}
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded transition-colors ${
                              currentPage === page 
                                ? 'custom-button-primary' 
                                : 'custom-card hover:opacity-80'
                            }`}
                            style={currentPage !== page ? { color: '#616771' } : {}}
                          >
                            {page}
                          </button>
                        );
                      } else if ((page === currentPage - 2 && page > 1) || (page === currentPage + 2 && page < totalPages)) {
                        return <span key={page} className="px-2 py-2 text-xs sm:text-sm" style={{ color: '#90949C' }}>...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-2 custom-card hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs sm:text-sm transition-colors"
                    style={{ color: '#616771' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Sort by ascending/descending logic for data table
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    // Reset to first page when sorting
    setCurrentPage(1); 
  };

  // Filter transactions based on fraud/legit/all
  const filterTransactions = (transactions, filter) => {
    switch (filter) {
      case 'fraud':
        return transactions.filter(t => t.isFraudulent);
      case 'legitimate':
        return transactions.filter(t => !t.isFraudulent);
      default:
        return transactions;
    }
  };

  // Full sort transactions function
  const sortTransactions = (transactions, config) => {
    if (!config.key) return transactions;
    
    const sortedTransactions = [...transactions].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];
      
      // Handle different data types
      if (config.key === 'amount' || config.key === 'riskScore') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (config.key === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortedTransactions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#E9EBEE' }}>
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#4267B3' }}
          ></div>
          <p className="text-lg" style={{ color: '#616771' }}>Loading fraud data...</p>
          <p className="text-sm mt-2" style={{ color: '#90949C' }}>Fetching high-resolution world map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#E9EBEE' }}>
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
    <div id="dashboard" className="min-h-screen" style={{ backgroundColor: '#E9EBEE', color: '#616771' }}>
      <Navbar />
      
      {/* Main content wrapper with proper spacing */}
      <div className="ml-16 lg:ml-64 transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-8">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#616771' }}
            >
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full border-2"
                  style={{ borderColor: '#E9EBEE' }}
                />
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3"
                  style={{
                    background: '#E9EBEE',
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                  }}
                />
              </div>
            </div>
            
            {/* Title Text */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#616771' }}>
                Nenya
              </h1>
              <p className="text-base sm:text-lg" style={{ color: '#90949C' }}>
                Fraud Detection Engine
              </p>
            </div>
          </div>
          
          {/* Data Controls */}
          <div className="flex gap-4 mb-6">
            {/* Generate Button */}
            <button
              onClick={() => generateData(1000)}
              disabled={isGenerating || isClearing}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded disabled:opacity-50 disabled:cursor-not-allowed custom-card hover:opacity-80 transition-colors flex items-center justify-center"
              title="Generate 1000 Transactions"
            >
              {isGenerating ? (
                <div 
                  className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-t-transparent"
                  style={{ borderColor: '#616771' }}
                ></div>
              ) : (
                <svg 
                  width="16" 
                  height="16" 
                  className="sm:w-5 sm:h-5"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#616771" 
                  strokeWidth="2"
                >
                  <path d="M16 3h5v5"/>
                  <path d="M4 20L21 3"/>
                  <path d="M21 16v5h-5"/>
                  <path d="M15 15l6 6"/>
                  <path d="M4 4l5 5"/>
                </svg>
              )}
            </button>
            
            {/* Clear Button */}
            <button
              onClick={clearData}
              disabled={isGenerating || isClearing}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded disabled:opacity-50 disabled:cursor-not-allowed custom-card hover:opacity-80 transition-colors flex items-center justify-center"
              title="Clear All Data"
            >
              {isClearing ? (
                <div 
                  className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-t-transparent"
                  style={{ borderColor: '#616771' }}
                ></div>
              ) : (
                <svg 
                  width="16" 
                  height="16" 
                  className="sm:w-5 sm:h-5"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#616771" 
                  strokeWidth="2"
                >
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
            {/* Globe Container */}
            <div className="flex-1 min-w-0">
              <div className="fraud-globe-container p-4 sm:p-6">
                <div className="flex justify-center">
                  <div 
                    className="border-2 rounded-lg p-2 sm:p-4 max-w-full overflow-hidden"
                    style={{ borderColor: '#90949C', backgroundColor: '#F8F9FA' }}
                  >
                    <div ref={globeRef} className="cursor-move"></div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-4 text-xs sm:text-sm flex-wrap justify-center" style={{ color: '#90949C' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Fraud Transaction (Accurate Location)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details Panel */}
            <TransactionDetailsPanel/>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <TransactionTable />
        </div>

        {/* Insights Section Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#616771' }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#E9EBEE" 
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#616771' }}>
                Insights
              </h2>
              <p className="text-base sm:text-lg" style={{ color: '#90949C' }}>
                Analytics & Fraud Detection Metrics
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div id="insights" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Row - Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <FraudVsLegitChart transactions={allTransactions} />
            <MerchantFraudChart transactions={allTransactions} />
            <FraudulentReasonsChart transactions={allTransactions} />
          </div>
          
          {/* Analytics Cards */}
          <AnalyticsCards transactions={allTransactions} />
        </div>
      </div>
    </div>
  );
};

export default FraudGlobe;