import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Search, MessageSquare, CheckCircle } from 'lucide-react';
import { formatRelativeTime, formatDate } from '../utils/formatters.js';

export default function IssuesTab({ issues = [] }) {
  const [stateFilter, setStateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Safeguard: exclude any item that has pull_request field
  const pureIssues = issues.filter((i) => !i.pull_request);

  const filteredIssues = pureIssues.filter((issue) => {
    if (stateFilter !== 'all' && issue.state !== stateFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const title = issue.title?.toLowerCase() || '';
      const author = issue.user?.login?.toLowerCase() || '';
      const number = String(issue.number);
      return title.includes(term) || author.includes(term) || number.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#252526] p-3 rounded-lg border border-[#383838]">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#0d99ff]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter issues by title, author, or #number..."
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
            All ({pureIssues.length})
          </button>
          <button
            onClick={() => setStateFilter('open')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              stateFilter === 'open'
                ? 'bg-[#ffcd29] text-black font-semibold'
                : 'text-[#8c8c8c] hover:text-white'
            }`}
          >
            Open ({pureIssues.filter((i) => i.state === 'open').length})
          </button>
          <button
            onClick={() => setStateFilter('closed')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              stateFilter === 'closed'
                ? 'bg-[#383838] text-white font-semibold'
                : 'text-[#8c8c8c] hover:text-white'
            }`}
          >
            Closed ({pureIssues.filter((i) => i.state === 'closed').length})
          </button>
        </div>
      </div>

      {/* Issues list */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-12 bg-[#252526] rounded-lg border border-[#383838] text-[#8c8c8c] text-sm">
          No issues found matching current filters.
        </div>
      ) : (
        <div className="bg-[#252526] border border-[#383838] rounded-lg divide-y divide-[#383838] overflow-hidden shadow-sm">
          {filteredIssues.map((issue) => {
            const isOpen = issue.state === 'open';
            const author = issue.user?.login || 'ghost';
            const authorAvatar = issue.user?.avatar_url;
            const commentsCount = issue.comments || 0;

            return (
              <div
                key={issue.id || issue.number}
                className="p-3.5 hover:bg-[#2c2c2c] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded flex-shrink-0 mt-0.5 border ${
                      isOpen
                        ? 'bg-[#ffcd29]/10 text-[#ffcd29] border-[#ffcd29]/30'
                        : 'bg-[#14ae5c]/10 text-[#14ae5c] border-[#14ae5c]/30'
                    }`}
                  >
                    {isOpen ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-semibold text-white">{issue.title}</span>
                      <span className="text-xs font-mono text-[#8c8c8c]">#{issue.number}</span>
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
                      <span title={formatDate(issue.created_at)}>opened {formatRelativeTime(issue.created_at)}</span>
                      {issue.closed_at && (
                        <>
                          <span>•</span>
                          <span className="text-[#8c8c8c]">closed {formatRelativeTime(issue.closed_at)}</span>
                        </>
                      )}
                    </div>

                    {/* Labels */}
                    {issue.labels && issue.labels.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1.5 mt-2">
                        {issue.labels.map((label) => (
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
                  {commentsCount > 0 && (
                    <span className="flex items-center space-x-1 text-xs text-[#8c8c8c]">
                      <MessageSquare className="h-3.5 w-3.5 text-[#0d99ff]" />
                      <span>{commentsCount}</span>
                    </span>
                  )}

                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      isOpen
                        ? 'bg-[#ffcd29]/10 text-[#ffcd29] border-[#ffcd29]/30'
                        : 'bg-[#14ae5c]/10 text-emerald-300 border-[#14ae5c]/30'
                    }`}
                  >
                    {isOpen ? 'Open' : 'Closed'}
                  </span>

                  {issue.html_url && (
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#383838] hover:bg-[#484848] text-[#8c8c8c] hover:text-white border border-[#484848]/60 transition"
                      title="View issue on GitHub"
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
