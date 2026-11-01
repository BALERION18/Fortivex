import React, { useState } from 'react';
import { GitCommit, ExternalLink, Search, User } from 'lucide-react';
import { formatRelativeTime, formatDate } from '../utils/formatters.js';

export default function CommitsTab({ commits = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(15);

  const filteredCommits = commits.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const message = c.commit?.message?.toLowerCase() || '';
    const author = c.commit?.author?.name?.toLowerCase() || '';
    const login = c.author?.login?.toLowerCase() || '';
    return message.includes(term) || author.includes(term) || login.includes(term);
  });

  const visibleCommits = filteredCommits.slice(0, displayCount);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#252526] p-3 rounded-lg border border-[#383838]">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#7b61ff]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter commits by message or author..."
            className="w-full pl-8 pr-4 py-1.5 bg-[#1e1e1e] border border-[#383838] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
          />
        </div>
        <div className="text-xs text-[#8c8c8c] self-center">
          Showing {visibleCommits.length} of {filteredCommits.length} commits
        </div>
      </div>

      {/* Commits List */}
      {visibleCommits.length === 0 ? (
        <div className="text-center py-12 bg-[#252526] rounded-lg border border-[#383838] text-[#8c8c8c] text-sm">
          No commits found matching &ldquo;{searchTerm}&rdquo;.
        </div>
      ) : (
        <div className="bg-[#252526] border border-[#383838] rounded-lg divide-y divide-[#383838] overflow-hidden shadow-sm">
          {visibleCommits.map((item) => {
            const commitMessage = item.commit?.message || 'No commit message';
            const firstLine = commitMessage.split('\n')[0];
            const authorName = item.commit?.author?.name || item.author?.login || 'Unknown author';
            const authorAvatar = item.author?.avatar_url;
            const commitDate = item.commit?.author?.date;
            const shortSha = item.sha ? item.sha.substring(0, 7) : '';

            return (
              <div
                key={item.sha}
                className="p-3.5 hover:bg-[#2c2c2c] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="p-2 rounded bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/30 flex-shrink-0 mt-0.5">
                    <GitCommit className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate pr-2" title={commitMessage}>
                      {firstLine}
                    </p>
                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-[#8c8c8c] flex-wrap gap-y-1">
                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="w-4 h-4 rounded-full inline-block border border-[#383838]"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5 text-[#7b61ff] inline-block" />
                      )}
                      <span className="font-medium text-[#d4d4d4]">{authorName}</span>
                      <span>•</span>
                      <span title={formatDate(commitDate)}>committed {formatRelativeTime(commitDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                  <span className="font-mono text-[11px] px-2 py-0.5 bg-[#7b61ff]/10 border border-[#7b61ff]/30 rounded text-[#7b61ff]">
                    {shortSha}
                  </span>
                  {item.html_url && (
                    <a
                      href={item.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#383838] hover:bg-[#484848] text-[#7b61ff] hover:text-white border border-[#484848]/60 transition"
                      title="View commit on GitHub"
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

      {/* Pagination / Load more button */}
      {visibleCommits.length < filteredCommits.length && (
        <div className="text-center pt-2">
          <button
            onClick={() => setDisplayCount((prev) => prev + 15)}
            className="px-4 py-2 rounded bg-[#383838] hover:bg-[#484848] text-white text-xs font-medium border border-[#484848]/60 transition"
          >
            Load More Commits ({filteredCommits.length - visibleCommits.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
