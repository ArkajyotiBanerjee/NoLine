import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import CategoryCard from '../components/CategoryCard';
import QueueCard from '../components/QueueCard';
import {
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
  BuildingLibraryIcon,
  MapIcon,
  EllipsisHorizontalCircleIcon,
  MapPinIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import LocationModal from '../components/LocationModal';
import { queues } from '../data/mockData';

const categories = [
  { id: 1, title: 'Restaurants', icon: BuildingStorefrontIcon, route: '/category/Restaurants' },
  { id: 2, title: 'Hospitals',   icon: BuildingOffice2Icon,    route: '/category/Hospitals' },
  { id: 3, title: 'Government',  icon: BuildingLibraryIcon,    route: '/category/Government' },
  { id: 4, title: 'Public',      icon: MapIcon,                route: '/category/Public' },
  { id: 5, title: 'Misc',        icon: EllipsisHorizontalCircleIcon, route: '/category/Misc' },
];

const FILTERS = ['All', 'Open', 'Closed'];

const Home = ({ viewMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showLocation, setShowLocation] = useState(false);
  const [location, setLocation] = useState(localStorage.getItem('userLocation') || 'Chennai, Tamil Nadu');
  const isDesktop = viewMode === 'desktop';

  const handleLocationSelect = (newLoc) => {
    setLocation(newLoc);
    localStorage.setItem('userLocation', newLoc);
  };

  // Extract city name from "City, State" string
  const selectedCity = location.split(',')[0].trim();

  // Search + filter + city together
  const visibleQueues = queues.filter((q) => {
    const matchesCity    = q.city === selectedCity;
    const matchesSearch  =
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter  =
      activeFilter === 'All' ||
      (activeFilter === 'Open'   && q.isOpen) ||
      (activeFilter === 'Closed' && !q.isOpen);

    return matchesCity && matchesSearch && matchesFilter;
  });

  const isSearching = searchQuery.trim() !== '';


  return (
    <div className="p-4 flex flex-col gap-5">

      {/* ── Location Trigger ── */}
      <div 
        onClick={() => setShowLocation(true)}
        className="flex items-center justify-start gap-1.5 cursor-pointer hover:opacity-80 transition"
      >
        <MapPinIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">{location}</h1>
        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
      </div>
      
      {showLocation && (
        <LocationModal 
          currentLocation={location} 
          onSelect={handleLocationSelect} 
          onClose={() => setShowLocation(false)} 
        />
      )}

      {/* ── Search ── */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* ── Filter pills ── */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeFilter === f
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Categories (only when not actively searching) ── */}
      {!isSearching && activeFilter === 'All' && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Categories</h2>
          <div className={`grid gap-3 ${isDesktop ? 'grid-cols-5' : 'grid-cols-2'}`}>
            {categories.map((cat) => (
              <CategoryCard key={cat.id} title={cat.title} icon={cat.icon} route={cat.route} />
            ))}
          </div>
        </section>
      )}

      {/* ── Queue list ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {isSearching ? (
              <>
                Search Results
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({visibleQueues.length} found)
                </span>
              </>
            ) : activeFilter === 'All' ? 'Popular Queues' : `${activeFilter} Queues`}
          </h2>
          {/* Count pill */}
          {!isSearching && (
            <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
              {visibleQueues.length} total
            </span>
          )}
        </div>

        {visibleQueues.length > 0 ? (
          <div className={`grid gap-4 ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {visibleQueues.map((queue) => (
              <QueueCard key={queue.id} queue={queue} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 py-14 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {isSearching ? `No queues found for "${searchQuery}"` : `No ${activeFilter.toLowerCase()} queues in ${selectedCity} right now`}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different filter or search term.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
