import React from 'react';
import { useParams } from 'react-router-dom';
import QueueCard from '../components/QueueCard';
import { queues } from '../data/mockData';

const Category = ({ viewMode }) => {
  const { type } = useParams();
  const isDesktop = viewMode === 'desktop';

  const categoryQueues = queues.filter(
    (q) => q.category.toLowerCase() === type.toLowerCase()
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4 capitalize">{type}</h1>

      {categoryQueues.length > 0 ? (
        <div className={`grid gap-4 ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {categoryQueues.map((queue) => (
            <QueueCard key={queue.id} queue={queue} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 py-14 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No queues in this category yet.</p>
        </div>
      )}
    </div>
  );
};

export default Category;
