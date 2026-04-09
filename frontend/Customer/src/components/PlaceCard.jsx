import React from 'react';
import { MapPinIcon, ArrowTopRightOnSquareIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const PlaceCard = ({ place }) => {
  const handleJoinQueue = () => {
    alert("Successfully joined queue at " + place.name);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 mb-4 border border-gray-100 flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-bold text-gray-800">{place.name}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <MapPinIcon className="w-4 h-4" />
          {place.address}
        </p>
      </div>
      
      <div className="flex gap-3 mt-2">
        <button 
          onClick={handleJoinQueue}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ClipboardDocumentListIcon className="w-5 h-5" />
          Join Queue
        </button>
        <a 
          href={place.mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          title="View on Google Maps"
        >
          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};

export default PlaceCard;
