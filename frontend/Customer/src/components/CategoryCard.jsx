import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ title, icon: IconComponent, route }) => {
  return (
    <Link
      to={route}
      className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border border-gray-100 dark:border-gray-700"
    >
      <div className="text-blue-600 dark:text-blue-400">
        <IconComponent className="w-9 h-9" />
      </div>
      <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 text-center tracking-wide">
        {title}
      </h3>
    </Link>
  );
};

export default CategoryCard;
