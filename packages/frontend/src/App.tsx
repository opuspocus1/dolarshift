import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import ApiStatus from './components/ApiStatus';
import Dashboard from './pages/Dashboard';
import Charts from './pages/Charts';
import Converter from './pages/Converter';
import DollarTicker from './components/DollarTicker';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <DollarTicker />
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/converter" element={<Converter />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;