'use client';

import React, { useState } from 'react';

const Navbar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <>
      {/* Navbar */}
      <div 
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        style={{ backgroundColor: '#4267B3' }}
      >
        {/* Toggle Button */}
        <div className="p-4">
          <button
            onClick={toggleNavbar}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-200"
            style={{ backgroundColor: '#616771' }}
          >
            <div className="flex flex-col gap-1">
              <div 
                className="w-4 h-0.5 transition-all duration-200"
                style={{ backgroundColor: '#E9EBEE' }}
              />
              <div 
                className="w-4 h-0.5 transition-all duration-200"
                style={{ backgroundColor: '#E9EBEE' }}
              />
              <div 
                className="w-4 h-0.5 transition-all duration-200"
                style={{ backgroundColor: '#E9EBEE' }}
              />
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-8">
          {/* Dashboard */}
          <button
            onClick={() => scrollToSection('dashboard')}
            className={`w-full flex items-center px-4 py-3 transition-colors duration-200 hover:bg-opacity-20 hover:bg-white group ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <div className="flex items-center">
              {/* Dashboard Icon */}
              <svg 
                className="w-6 h-6 flex-shrink-0" 
                fill="none" 
                stroke="#E9EBEE" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 5v4M16 5v4" 
                />
              </svg>
              
              {/* Dashboard Text */}
              {!isCollapsed && (
                <span 
                  className="ml-3 text-sm font-medium transition-opacity duration-200"
                  style={{ color: '#E9EBEE' }}
                >
                  Dashboard
                </span>
              )}
            </div>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-16 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                   style={{ backgroundColor: '#616771', color: '#E9EBEE' }}>
                Dashboard
              </div>
            )}
          </button>

          {/* Insights */}
          <button
            onClick={() => scrollToSection('insights')}
            className={`w-full flex items-center px-4 py-3 transition-colors duration-200 hover:bg-opacity-20 hover:bg-white group ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <div className="flex items-center">
              {/* Insights Icon */}
              <svg 
                className="w-6 h-6 flex-shrink-0" 
                fill="none" 
                stroke="#E9EBEE" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
              
              {/* Insights Text */}
              {!isCollapsed && (
                <span 
                  className="ml-3 text-sm font-medium transition-opacity duration-200"
                  style={{ color: '#E9EBEE' }}
                >
                  Insights
                </span>
              )}
            </div>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-16 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                   style={{ backgroundColor: '#616771', color: '#E9EBEE' }}>
                Insights
              </div>
            )}
          </button>
        </nav>

        {/* Brand/Logo Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {!isCollapsed && (
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{ color: '#E9EBEE' }}
              >
                Nenya
              </div>
              <div 
                className="text-xs opacity-75"
                style={{ color: '#90949C' }}
              >
                Fraud Detection
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="text-center">
              <div 
                className="text-xl font-bold"
                style={{ color: '#E9EBEE' }}
              >
                N
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spacer to push content right when navbar is expanded */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      />
    </>
  );
};

export default Navbar;