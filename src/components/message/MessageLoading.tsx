
import React from "react";

const MessageLoading = () => {
  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-pulse space-y-6">
      <div className="flex justify-center items-center h-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
      <div className="h-32 bg-gray-200 rounded w-full"></div>
    </div>
  );
};

export default MessageLoading;
