import React, { useState } from 'react';
import { GitPullRequest, ExternalLink, Search, CheckCircle, Clock } from 'lucide-react';
import { formatRelativeTime, formatDate } from '../utils/formatters.js';

export default function PullRequestsTab({ pullRequests = [] }) {
  const [stateFilter, setStateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPulls = pullRequests.filter((pr) => {
    if (stateFilter !== 'all' && pr.state !== stateFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const title = pr.title?.toLowerCase() || '';
      const author = pr.user?.login?.toLowerCase() || '';
      const number = String(pr.number);
      return title.includes(term) || author.includes(term) || number.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#252526] p-3 rounded-lg border border-[#383838]">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#7b61ff]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter pull requests by title, author, or #number..."
            className="w-full pl-8 pr-4 py-1.5 bg-[#1e1e1e] border border-[#383838] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
          />
        </div>

        {/* State filter buttons */}
        <div className="flex items-center space-x-1 bg-[#1e1e1e] p-1 rounded border border-[#383838] text-xs self-start sm:self-center">
          <button
            onClick={() => setStateFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              stateFilter === 'all'
                ? 'bg-[#383838] text-white'
                : 'text-[#8c8c8c] hover:text-white'
            }`}
          >
            All ({pullRequests.length})
          </button>
          <button
            onClick={() => setStateFilter('open')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              stateFilter === 'open'
                ? 'bg-[#14ae5c] text-white font-semibold'
                : 'text-[#8c8c8c] hover:text-white'
            }`}
          >
            Open ({pullRequests.filter((p) => p.state === 'open').length})
          </button>
          <button
            onClick={() => setStateFilter('closed')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              stateFilter === 'closed'
                ? 'bg-[#7b61ff] text-white font-semibold'
                : 'text-[#8c8c8c] hover:text-white'
            }`}
          >
            Closed ({pullRequests.filter((p) => p.state === 'closed').length})
          </button>
        </div>
      </div>

      {/* PRs list */}
      {filteredPulls.length === 0 ? (
        <div className="text-center py-12 bg-[#252526] rounded-lg border border-[#383838] text-[#8c8c8c] text-sm">
          No pull requests found matching current filters.
        </div>
      ) : (
        <div className="bg-[#252526] border border-[#383838] rounded-lg divide-y divide-[#383838] overflow-hidden shadow-sm">
          {filteredPulls.map((pr) => {
            const isOpen = pr.state === 'open';
            const author = pr.user?.login || 'ghost';
            const authorAvatar = pr.user?.avatar_url;

            return (
              <div
                key={pr.id || pr.number}
                className="p-3.5 hover:bg-[#2c2c2c] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="p-2 rounded bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/30 flex-shrink-0 mt-0.5">
                    <GitPullRequest className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-semibold text-white">{pr.title}</span>
                      <span className="text-xs font-mono text-[#7b61ff] font-semibold">#{pr.number}</span>
                      {pr.draft && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#1e1e1e] text-[#8c8c8c] border border-[#383838]">
                          Draft
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-[#8c8c8c] flex-wrap gap-y-1">
                      {authorAvatar && (
                        <img
                          src={authorAvatar}
                          alt={author}
                          className="w-4 h-4 rounded-full inline-block"
                        />
                      )}
                      <span className="font-medium text-[#d4d4d4]">{author}</span>
                      <span>•</span>
                      <span title={formatDate(pr.created_at)}>opened {formatRelativeTime(pr.created_at)}</span>
                      {pr.closed_at && (
                        <>
                          <span>•</span>
                          <span className="text-[#7b61ff]">closed {formatRelativeTime(pr.closed_at)}</span>
                        </>
                      )}
                    </div>

                    {/* Labels */}
                    {pr.labels && pr.labels.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1.5 mt-2">
                        {pr.labels.map((label) => (
                          <span
                            key={label.id || label.name}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e1e1e] text-[#b3b3b3] border border-[#383838]"
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      isOpen
                        ? 'bg-[#14ae5c]/10 text-emerald-300 border-[#14ae5c]/30'
                        : 'bg-[#7b61ff]/10 text-[#7b61ff] border-[#7b61ff]/30'
                    }`}
                  >
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                  {pr.html_url && (
                    <a
                      href={pr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#383838] hover:bg-[#484848] text-[#7b61ff] hover:text-white border border-[#484848]/60 transition"
                      title="View pull request on GitHub"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
