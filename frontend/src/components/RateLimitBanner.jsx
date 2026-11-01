import React from 'react';
import { AlertTriangle, Clock, Key } from 'lucide-react';

export default function RateLimitBanner({ rateLimit }) {
  if (!rateLimit) return null;

  const { remaining, limit, reset, hasToken } = rateLimit;

  // Only display if remaining is 0 or less than 10
  if (remaining > 10) return null;

  const resetDate = reset ? new Date(reset * 1000).toLocaleTimeString() : 'soon';
  const isExhausted = remaining === 0;

  return (
    <div
      className={`max-w-7xl mx-auto mb-4 p-3 rounded-md border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
        isExhausted
          ? 'bg-[#252526] border-[#f24822]/40 text-[#f24822]'
          : 'bg-[#252526] border-[#ffcd29]/40 text-[#ffcd29]'
      }`}
    >
      <div className="flex items-start space-x-2.5">
        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isExhausted ? 'text-[#f24822]' : 'text-[#ffcd29]'}`} />
        <div>
          <p className="font-semibold text-white">
            {isExhausted
              ? 'GitHub API rate limit exhausted'
              : `Low GitHub API quota: only ${remaining} requests remaining`}
          </p>
          <p className="text-[11px] text-[#8c8c8c] mt-0.5">
            GitHub provides {limit} requests/hour for unauthenticated clients. Quota resets at{' '}
            <span className="font-mono font-medium underline text-white">{resetDate}</span>.
          </p>
        </div>
      </div>

      {!hasToken && (
        <div className="flex items-center space-x-2 text-[11px] bg-[#1e1e1e] px-2.5 py-1.5 rounded border border-[#383838] text-[#8c8c8c]">
          <Key className="h-3.5 w-3.5 text-[#0d99ff] flex-shrink-0" />
          <span>Add <code className="text-white font-mono">GITHUB_TOKEN</code> to backend <code className="text-white font-mono">.env</code> for 5,000 req/hr.</span>
        </div>
      )}
    </div>
  );
}
