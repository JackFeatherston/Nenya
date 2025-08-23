'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

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
        console.warn('Could not load world atlas data:', err);
        // Fallback to basic shapes if world data fails to load
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
      const transactionsResponse = await fetch('http://localhost:8080/api/transactions');
      if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
      const transactionsData = await transactionsResponse.json();
      
      const statsResponse = await fetch('http://localhost:8080/api/transactions/stats');
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

  // D3.js Globe implementation with high-resolution world data
  useEffect(() => {
    if (!globeRef.current || loading) return;

    // Clear previous globe
    d3.select(globeRef.current).selectAll("*").remove();

    const width = 600;
    const height = 600;
    const sensitivity = 75;

    // Create SVG
    const svg = d3
      .select(globeRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create projection and path generator
    const projection = d3
      .geoOrthographic()
      .scale(250)
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
      .style('fill', '#0f172a') // Dark blue ocean
      .style('stroke', '#1e293b')
      .style('stroke-width', '2px');

    // Create graticule (grid lines)
    const graticule = d3.geoGraticule();
    
    svg
      .append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', path)
      .style('fill', 'none')
      .style('stroke', 'rgba(148, 163, 184, 0.1)')
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
        .style('fill', '#1e40af') // Nice blue for land
        .style('stroke', 'none');

      // Draw country boundaries
      svg
        .append('path')
        .datum(worldData.countryMesh)
        .attr('class', 'country-borders')
        .attr('d', path)
        .style('fill', 'none')
        .style('stroke', '#3b82f6') // Lighter blue for borders
        .style('stroke-width', '0.5px')
        .style('opacity', 0.6);
    } else {
      // Fallback: Create simple continent shapes if world data fails to load
      console.warn('Using fallback continent shapes');
      const fallbackWorld = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-160, 70], [-100, 70], [-80, 50], [-100, 40], 
                  [-120, 30], [-140, 45], [-160, 60], [-160, 70]
                ]
              ]
            },
            properties: { name: "North America" }
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-80, 10], [-40, 10], [-30, -20], [-60, -40], 
                  [-80, -20], [-80, 10]
                ]
              ]
            },
            properties: { name: "South America" }
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-20, 70], [40, 70], [50, 40], [30, 30], 
                  [-10, 35], [-20, 50], [-20, 70]
                ]
              ]
            },
            properties: { name: "Europe" }
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-20, 35], [50, 35], [50, -35], [10, -35], 
                  [-20, -10], [-20, 35]
                ]
              ]
            },
            properties: { name: "Africa" }
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [50, 70], [180, 70], [180, 10], [120, 10], 
                  [70, 30], [50, 50], [50, 70]
                ]
              ]
            },
            properties: { name: "Asia" }
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [110, -10], [160, -10], [160, -45], [110, -45], [110, -10]
                ]
              ]
            },
            properties: { name: "Australia" }
          }
        ]
      };

      svg
        .selectAll('.continent')
        .data(fallbackWorld.features)
        .enter()
        .append('path')
        .attr('class', 'continent')
        .attr('d', path)
        .style('fill', '#1e40af')
        .style('stroke', '#3b82f6')
        .style('stroke-width', '1px')
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
      .on('click', function(event, d) {
        setSelectedTransaction(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.max(5, Math.min(12, Math.log(parseFloat(d.amount)) + 2)));
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.max(3, Math.min(8, Math.log(parseFloat(d.amount)))));
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
        });
    };

    // Rotation functionality
    const drag = d3.drag()
    .on('start', function(event) {})
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

  // Transaction Table
  const TransactionTable = () => {
    const getSortIcon = (columnKey) => {
      if (sortConfig.key !== columnKey) {
        return '↕️';
      }
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    };
  
    const getFilterButtonStyle = (filterType) => {
      const baseStyle = "px-4 py-2 rounded-lg transition-colors text-sm font-medium";
      if (transactionFilter === filterType) {
        switch (filterType) {
          case 'fraud':
            return `${baseStyle} bg-red-600 text-white`;
          case 'legitimate':
            return `${baseStyle} bg-green-600 text-white`;
          default:
            return `${baseStyle} bg-blue-600 text-white`;
        }
      }
      return `${baseStyle} bg-gray-600 hover:bg-gray-500 text-gray-200`;
    };
  
    return (
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">Transaction History</h2>
          
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
          <div className="text-center text-gray-400 py-8">
            <p>No transactions to display</p>
            {allTransactions.length === 0 && (
              <button
                onClick={() => generateData(1000)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Generate Sample Data
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('isFraudulent')}
                    >
                      Status 
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('transactionId')}
                    >
                      Transaction ID 
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('amount')}
                    >
                      Amount {getSortIcon('amount')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('merchantName')}
                    >
                      Merchant {getSortIcon('merchantName')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('merchantCategory')}
                    >
                      Category {getSortIcon('merchantCategory')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('timestamp')}
                    >
                      Date {getSortIcon('timestamp')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('locationCity')}
                    >
                      Location {getSortIcon('locationCity')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => handleSort('riskScore')}
                    >
                      Risk Score {getSortIcon('riskScore')}
                    </th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                    >
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          transaction.isFraudulent 
                            ? 'bg-red-900 text-red-300 border border-red-500' 
                            : 'bg-green-900 text-green-300 border border-green-500'
                        }`}>
                          {transaction.isFraudulent ? 'Fraudulent' : 'Legitimate'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {transaction.transactionId.slice(-8)}...
                      </td>
                      <td className="p-3 font-semibold">
                        <span className={transaction.isFraudulent ? 'text-red-400' : 'text-green-400'}>
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="p-3 max-w-32 truncate" title={transaction.merchantName}>
                        {transaction.merchantName}
                      </td>
                      <td className="p-3 text-xs">
                        {transaction.merchantCategory}
                      </td>
                      <td className="p-3 text-xs">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="p-3 text-xs">
                        {transaction.locationCity}, {transaction.locationCountry}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          parseFloat(transaction.riskScore || 0) > 0.7 
                            ? 'bg-red-900 text-red-300' 
                            : parseFloat(transaction.riskScore || 0) > 0.3 
                            ? 'bg-yellow-900 text-yellow-300' 
                            : 'bg-green-900 text-green-300'
                        }`}>
                          {transaction.riskScore ? (parseFloat(transaction.riskScore) * 100).toFixed(0) + '%' : 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
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
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
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
                            className={`px-3 py-2 text-sm rounded transition-colors ${
                              currentPage === page 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-600 hover:bg-gray-500 text-white'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if ((page === currentPage - 2 && page > 1) || (page === currentPage + 2 && page < totalPages)) {
                        return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading fraud data...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching high-resolution world map...</p>
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
          
          {/* Data Controls */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => generateData(1000)}
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
                    Generate 1000 Transactions
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
                {isGenerating ? 'Generating synthetic transaction data with accurate locations...' : 'Clearing transaction data...'}
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
                  <div ref={globeRef} className="cursor-move"></div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-4 text-sm text-gray-300 flex-wrap justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Fraud Transaction (Accurate Location)</span>
                  </div>
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
                      <span className="text-gray-400">Coordinates:</span>
                      <span className="font-mono text-xs text-right">
                        {selectedTransaction.lat.toFixed(4)}, {selectedTransaction.lng.toFixed(4)}
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
                      <p className="text-sm mb-4">Generate some transactions to see the 3D globe with accurate locations</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-2">Click on a red dot</p>
                      <p className="text-sm">to view transaction details</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="mt-8">
        <TransactionTable />
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