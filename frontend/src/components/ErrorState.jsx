import React from 'react';
import { AlertOctagon, Lock, Clock, RotateCcw, Search } from 'lucide-react';

export default function ErrorState({ error, onRetry, onReset }) {
  if (!error) return null;

  const isRateLimit = error.isRateLimit || error.status === 403 || error.status === 429;
  const isInaccessible = error.isInaccessible || error.status === 404;

  return (
    <div className="max-w-xl mx-auto my-12 p-6 rounded-md bg-[#252526] border border-[#383838] text-center shadow-sm">
      <div className="inline-flex p-3 rounded mb-4">
        {isInaccessible ? (
          <div className="p-3 bg-[#ffcd29]/10 text-[#ffcd29] rounded border border-[#ffcd29]/30">
            <Lock className="h-7 w-7" />
          </div>
        ) : isRateLimit ? (
          <div className="p-3 bg-[#f24822]/10 text-[#f24822] rounded border border-[#f24822]/30">
            <Clock className="h-7 w-7" />
          </div>
        ) : (
          <div className="p-3 bg-[#f24822]/10 text-[#f24822] rounded border border-[#f24822]/30">
            <AlertOctagon className="h-7 w-7" />
          </div>
        )}
      </div>

      <h3 className="text-base font-semibold text-white">
        {isInaccessible
          ? 'Repository Inaccessible or Not Found'
          : isRateLimit
          ? 'GitHub API Rate Limit Reached'
          : 'Unable to Retrieve Repository'}
      </h3>

      <p className="mt-2 text-xs text-[#8c8c8c] leading-relaxed px-4">
        {error.message || 'An unexpected error occurred while communicating with GitHub.'}
      </p>

      {isRateLimit && (
        <div className="mt-4 p-3 bg-[#1e1e1e] rounded border border-[#383838] text-xs text-[#d4d4d4] text-left">
          <p className="font-semibold text-white">How to increase rate limits:</p>
          <p className="mt-1 text-[#8c8c8c]">
            GitHub provides 60 requests/hour for unauthenticated access. Adding a personal access token (<code className="text-white font-mono">GITHUB_TOKEN</code>) to your backend <code className="text-white font-mono">.env</code> elevates the limit to <strong>5,000 requests/hour</strong>.
          </p>
        </div>
      )}

      {isInaccessible && (
        <p className="mt-3 text-[11px] text-[#8c8c8c]">
          Note: FORTIVEX operates on public repositories. Private repositories require explicit token access.
        </p>
      )}

      <div className="mt-6 flex items-center justify-center space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#383838] hover:bg-[#484848] text-white text-xs font-medium border border-[#484848]/60 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-[#0d99ff] hover:bg-[#007be5] text-white text-xs font-medium transition shadow-sm"
          >
            <Search className="h-3.5 w-3.5 text-white" />
            <span>Explore Other Repo</span>
          </button>
        )}
      </div>
    </div>
  );
}
