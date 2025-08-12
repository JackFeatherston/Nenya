'use client'

import { useState, useEffect } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://localhost:8080/api/hello')
      .then(response => response.text())
      .then(data => setMessage(data))
      .catch(error => {
        console.error('Error:', error);
        setMessage('Hello World');
      });
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>{message}</h1>
    </div>
  );
}