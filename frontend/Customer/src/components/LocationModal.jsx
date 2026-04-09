import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const METRO_CITIES = [
  { name: 'Chennai',   state: 'Tamil Nadu',   icon: '🏛️',  desc: '6 queues available' },
  { name: 'Mumbai',    state: 'Maharashtra',  icon: '🚕',  desc: '4 queues available' },
  { name: 'Bangalore', state: 'Karnataka',    icon: '💻',  desc: '4 queues available' },
  { name: 'Delhi',     state: 'NCR',          icon: '🏰',  desc: '4 queues available' },
  { name: 'Hyderabad', state: 'Telangana',    icon: '🕌',  desc: '4 queues available' },
  { name: 'Kochi',     state: 'Kerala',       icon: '🌴',  desc: '4 queues available' },
];

const LocationModal = ({ currentLocation, onSelect, onClose }) => {
  const selectedCity = METRO_CITIES.find(c => currentLocation.startsWith(c.name))?.name;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col animate-slide-up">

        {/* HEADER */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Select Your City</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Showing queues for the selected metro</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* CITY GRID */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {METRO_CITIES.map((city) => {
            const isSelected = selectedCity === city.name;
            return (
              <div
                key={city.name}
                onClick={() => { onSelect(`${city.name}, ${city.state}`); onClose(); }}
                className={`
                  relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl cursor-pointer
                  border-2 transition-all duration-200 hover:scale-105
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                  }
                `}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                )}
                <span className="text-4xl">{city.icon}</span>
                <div className="text-center">
                  <p className={`font-bold text-sm ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'}`}>
                    {city.name}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{city.state}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                  {city.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
