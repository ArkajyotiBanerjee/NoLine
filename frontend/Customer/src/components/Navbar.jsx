import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  ArrowLeftIcon,
  HomeIcon,
  SunIcon,
  MoonIcon,
  ListBulletIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const Navbar = ({ viewMode, toggleView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifCount, setNotifCount] = useState(0);

  const updateCount = () => {
    const data = localStorage.getItem('notifications');
    setNotifCount(data ? JSON.parse(data).length : 0);
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('focus', updateCount);
    window.addEventListener('notificationsUpdated', updateCount);
    return () => {
      window.removeEventListener('focus', updateCount);
      window.removeEventListener('notificationsUpdated', updateCount);
    };
  }, [location]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 px-4 py-3 rounded-b-xl shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="flex justify-between items-center">

        {/* ── Left ── */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <>
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Go home"
              >
                <HomeIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            </>
          )}

          {isHome ? (
            /* Brand block on home */
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-blue-600 dark:text-blue-400 leading-none tracking-tight">
                NoLine
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-tight mt-0.5">
                Skip the line. Stay in control.
              </span>
            </div>
          ) : (
            <span className="font-bold text-lg text-gray-800 dark:text-gray-100 tracking-tight">
              NoLine
            </span>
          )}
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-1">

          {/* View toggle */}
          <button
            onClick={toggleView}
            title={viewMode === 'mobile' ? 'Switch to Desktop view' : 'Switch to Mobile view'}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            {viewMode === 'mobile' ? (
              <ComputerDesktopIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <DevicePhoneMobileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>

          {/* My Queues */}
          <Link
            to="/my-queues"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="My Queues"
          >
            <ListBulletIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>

          {/* Notifications bell with count badge */}
          <Link
            to="/notifications"
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Notifications"
          >
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Toggle dark mode"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <SunIcon className="w-5 h-5 text-yellow-400" />
            )}
          </button>

          {/* Profile avatar */}
          <Link to="/profile" title="Profile">
            <div className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors cursor-pointer ml-1">
              <UserCircleIcon className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
