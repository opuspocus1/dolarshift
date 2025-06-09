import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Charts from './pages/Charts';
import History from './pages/History';
import Converter from './pages/Converter';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/history" element={<History />} />
            <Route path="/converter" element={<Converter />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;