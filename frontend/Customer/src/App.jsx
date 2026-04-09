import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Category from './pages/Category';
import MyQueues from './pages/MyQueues';
import Profile from './pages/Profile';
import QueueDetail from './pages/QueueDetail';
import QueueTracker from './pages/QueueTracker';
import Notifications from './pages/Notifications';

function App() {
  const [viewMode, setViewMode] = useState(
    localStorage.getItem('viewMode') || 'mobile'
  );

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleView = () => {
    const next = viewMode === 'mobile' ? 'desktop' : 'mobile';
    setViewMode(next);
    localStorage.setItem('viewMode', next);
  };

  const containerCls = viewMode === 'mobile' ? 'max-w-md' : 'max-w-6xl';

  return (
    <Router>
      <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-300">
        <div className={`mx-auto w-full ${containerCls} transition-all duration-300`}>
          <Navbar viewMode={viewMode} toggleView={toggleView} />
          <div className="pb-10 min-h-[calc(100vh-64px)]">
            <Routes>
              <Route path="/" element={<Home viewMode={viewMode} />} />
              <Route path="/category/:type" element={<Category viewMode={viewMode} />} />
              <Route path="/my-queues" element={<MyQueues viewMode={viewMode} />} />
              <Route path="/my-queues/:id" element={<QueueTracker />} />
              <Route path="/queue/:id" element={<QueueDetail viewMode={viewMode} />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile viewMode={viewMode} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
