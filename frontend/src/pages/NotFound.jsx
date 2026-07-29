import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center space-y-4">
      <span className="text-6xl">🔍</span>
      <h1 className="text-4xl font-extrabold text-white">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md">The page you are looking for does not exist or has been moved. Check the URL or click below to return home.</p>
      <Link
        to="/"
        className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-550/15"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
