import React, { useState } from 'react';
import { Users, ExternalLink, Search, Award } from 'lucide-react';
import { formatNumber } from '../utils/formatters.js';

export default function ContributorsTab({ contributors = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContributors = contributors.filter((c) => {
    if (!searchTerm.trim()) return true;
    return c.login?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#252526] p-3 rounded-lg border border-[#383838]">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#0d99ff]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contributor by GitHub username..."
            className="w-full pl-8 pr-4 py-1.5 bg-[#1e1e1e] border border-[#383838] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
          />
        </div>
        <div className="text-xs text-[#8c8c8c] self-center">
          {filteredContributors.length} contributor{filteredContributors.length !== 1 ? 's' : ''} listed
        </div>
      </div>

      {filteredContributors.length === 0 ? (
        <div className="text-center py-12 bg-[#252526] rounded-lg border border-[#383838] text-[#8c8c8c] text-sm">
          No contributors found matching &ldquo;{searchTerm}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredContributors.map((contributor, index) => {
            const isTop3 = index < 3;
            return (
              <div
                key={contributor.id || contributor.login}
                className="bg-[#252526] border border-[#383838] hover:border-[#484848] rounded-lg p-3.5 transition shadow-sm flex items-center space-x-3 relative overflow-hidden group"
              >
                {isTop3 && (
                  <div className="absolute -top-1 -right-1 p-1 bg-[#ffcd29]/15 text-[#ffcd29] rounded-bl">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                )}

                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  className="w-10 h-10 rounded-full border border-[#383838] flex-shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <a
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-white hover:underline text-xs truncate block transition"
                  >
                    {contributor.login}
                  </a>
                  <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                    <strong className="text-white font-semibold">{formatNumber(contributor.contributions)}</strong> commits
                  </p>
                </div>

                <a
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded text-[#8c8c8c] hover:text-white hover:bg-[#383838] opacity-0 group-hover:opacity-100 transition"
                  title="View GitHub profile"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
