import React from 'react';

export const ErrorMessage: React.FC<{ error: string }> = ({ error }) => {
  return (
    <div className="w-1/1 mt-4 rounded-md border border-red-600 bg-red-800 bg-opacity-30 p-8 text-white shadow-lg backdrop-blur-lg backdrop-filter">
      <p className="text-white">Error: {error}</p>
    </div>
  );
};

export const SuccessMessage: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="w-1/1 mt-4 rounded-md border border-green-600 bg-green-800 bg-opacity-30 p-8 text-white shadow-lg backdrop-blur-lg backdrop-filter">
      <p className="text-white">{message}</p>
    </div>
  );
};
