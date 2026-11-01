import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse font-sans text-xs">
      {/* Top Banner Skeleton */}
      <div className="bg-[#252526] border border-[#383838] rounded-md p-5 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded bg-[#1e1e1e] border border-[#383838]"></div>
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-[#1e1e1e] border border-[#383838] rounded w-1/3"></div>
            <div className="h-3.5 bg-[#1e1e1e] border border-[#383838] rounded w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Health Card Skeleton */}
      <div className="bg-[#252526] border border-[#383838] rounded-md p-5 shadow-sm">
        <div className="h-4 bg-[#1e1e1e] border border-[#383838] rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="h-16 bg-[#1e1e1e] border border-[#383838] rounded"></div>
          <div className="h-16 bg-[#1e1e1e] border border-[#383838] rounded"></div>
          <div className="h-16 bg-[#1e1e1e] border border-[#383838] rounded"></div>
          <div className="h-16 bg-[#1e1e1e] border border-[#383838] rounded"></div>
        </div>
      </div>

      {/* Content List Skeleton */}
      <div className="bg-[#252526] border border-[#383838] rounded-md p-4 space-y-2.5 shadow-sm">
        <div className="h-10 bg-[#1e1e1e] border border-[#383838] rounded"></div>
        <div className="h-10 bg-[#1e1e1e] border border-[#383838] rounded"></div>
        <div className="h-10 bg-[#1e1e1e] border border-[#383838] rounded"></div>
        <div className="h-10 bg-[#1e1e1e] border border-[#383838] rounded"></div>
      </div>
    </div>
  );
}
