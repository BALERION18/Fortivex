import React, { useState } from 'react';
import { GitBranch, Tag, ShieldCheck, ExternalLink, Calendar, Package } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/formatters.js';

export default function BranchesReleasesTab({ branches = [], releases = [], defaultBranch = 'main', htmlUrl }) {
  const [activeSubTab, setActiveSubTab] = useState('branches');

  return (
    <div className="space-y-4">
      {/* Sub-tab Selector */}
      <div className="flex items-center space-x-2 border-b border-[#383838] pb-3">
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeSubTab === 'branches'
              ? 'bg-[#252526] text-white border border-[#383838] shadow-sm'
              : 'text-[#8c8c8c] hover:text-white hover:bg-[#252526]'
          }`}
        >
          <GitBranch className="h-3.5 w-3.5 text-[#0d99ff]" />
          <span>Branches ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('releases')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeSubTab === 'releases'
              ? 'bg-[#252526] text-white border border-[#383838] shadow-sm'
              : 'text-[#8c8c8c] hover:text-white hover:bg-[#252526]'
          }`}
        >
          <Tag className="h-3.5 w-3.5 text-[#7b61ff]" />
          <span>Releases ({releases.length})</span>
        </button>
      </div>

      {/* Branches View */}
      {activeSubTab === 'branches' && (
        <div>
          {branches.length === 0 ? (
            <div className="text-center py-12 bg-[#252526] rounded-md border border-[#383838] text-[#8c8c8c] text-xs">
              No branch data available.
            </div>
          ) : (
            <div className="bg-[#252526] border border-[#383838] rounded-md divide-y divide-[#383838] overflow-hidden shadow-sm">
              {branches.map((b) => {
                const isDefault = b.name === defaultBranch;
                const branchUrl = htmlUrl ? `${htmlUrl}/tree/${b.name}` : null;

                return (
                  <div
                    key={b.name}
                    className="p-3.5 hover:bg-[#1e1e1e] transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30 flex-shrink-0">
                        <GitBranch className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-medium text-white">{b.name}</span>
                          {isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#14ae5c]/10 text-emerald-300 border border-[#14ae5c]/30">
                              default
                            </span>
                          )}
                          {b.protected && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#7b61ff]/10 text-indigo-300 border border-[#7b61ff]/30">
                              <ShieldCheck className="h-3 w-3 text-[#7b61ff]" />
                              <span>Protected</span>
                            </span>
                          )}
                        </div>
                        {b.commit?.sha && (
                          <span className="font-mono text-[11px] text-[#8c8c8c] mt-0.5 block">
                            latest commit: {b.commit.sha.substring(0, 7)}
                          </span>
                        )}
                      </div>
                    </div>

                    {branchUrl && (
                      <a
                        href={branchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded bg-[#1e1e1e] hover:bg-[#383838] text-[#8c8c8c] hover:text-white border border-[#383838] transition"
                        title="View branch on GitHub"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Releases View */}
      {activeSubTab === 'releases' && (
        <div>
          {releases.length === 0 ? (
            <div className="text-center py-12 bg-[#252526] rounded-md border border-[#383838] text-[#8c8c8c] text-xs">
              No formal releases published for this repository.
            </div>
          ) : (
            <div className="space-y-3">
              {releases.map((rel) => (
                <div
                  key={rel.id || rel.tag_name}
                  className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm hover:border-[#484848] transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#383838] gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/30 flex-shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white text-xs sm:text-sm">{rel.name || rel.tag_name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#383838] font-mono text-[11px] text-white">
                            {rel.tag_name}
                          </span>
                          {rel.prerelease && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#ffcd29]/10 text-[#ffcd29] border border-[#ffcd29]/30">
                              Pre-release
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-[#8c8c8c]">
                          <Calendar className="h-3 w-3 text-[#7b61ff]" />
                          <span>Published {formatRelativeTime(rel.published_at)} ({formatDate(rel.published_at)})</span>
                        </div>
                      </div>
                    </div>

                    {rel.html_url && (
                      <a
                        href={rel.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#383838] text-[#d4d4d4] hover:text-white text-xs font-medium border border-[#383838] transition self-start sm:self-center"
                      >
                        <span>Release Page</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {rel.body && (
                    <p className="mt-3 text-xs text-[#d4d4d4] line-clamp-3 whitespace-pre-line leading-relaxed">
                      {rel.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
