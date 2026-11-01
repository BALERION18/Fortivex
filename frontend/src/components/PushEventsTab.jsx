import React from 'react';
import { UploadCloud, Info, GitBranch, GitCommit, User } from 'lucide-react';
import { formatRelativeTime, formatDate } from '../utils/formatters.js';

export default function PushEventsTab({ pushEvents = [], notice }) {
  return (
    <div className="space-y-4">
      {/* Informational Callout regarding Events API Limits vs Commit Log */}
      <div className="p-3.5 rounded-lg bg-[#252526] border border-[#383838] flex items-start space-x-3 text-xs text-[#b3b3b3]">
        <Info className="h-4 w-4 text-[#7b61ff] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Push Events vs. Git Commit History
          </p>
          <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
            Push events capture remote push operations performed by developers, grouping commits pushed together to specific branches.
            Notice: By design, the GitHub Events API retains only public events from the{' '}
            <strong className="text-white underline">past 90 days or up to 300 total events</strong>. For the comprehensive history across all time, consult the Commits tab.
          </p>
          {notice && <p className="text-[11px] text-[#8c8c8c] italic">{notice}</p>}
        </div>
      </div>

      {/* Events List */}
      {pushEvents.length === 0 ? (
        <div className="text-center py-12 bg-[#252526] rounded-lg border border-[#383838] text-[#8c8c8c] text-sm">
          No recent public push events recorded within the 90-day GitHub Events API window.
        </div>
      ) : (
        <div className="space-y-3">
          {pushEvents.map((event) => {
            const actorLogin = event.actor?.login || 'Unknown pusher';
            const actorAvatar = event.actor?.avatar_url;
            const branchName = event.ref ? event.ref.replace('refs/heads/', '') : 'unknown branch';
            const commits = event.commits || [];

            return (
              <div
                key={event.id}
                className="bg-[#252526] border border-[#383838] rounded-lg p-3.5 shadow-sm hover:border-[#484848] transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#383838] gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    {actorAvatar ? (
                      <img
                        src={actorAvatar}
                        alt={actorLogin}
                        className="w-4 h-4 rounded-full border border-[#383838]"
                      />
                    ) : (
                      <User className="h-3.5 w-3.5 text-[#7b61ff]" />
                    )}
                    <span className="font-semibold text-white">{actorLogin}</span>
                    <span className="text-[#8c8c8c]">pushed {commits.length} commit{commits.length !== 1 ? 's' : ''} to</span>
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#7b61ff]/10 border border-[#7b61ff]/30 font-mono text-[#7b61ff] text-[11px]">
                      <GitBranch className="h-3 w-3 text-[#7b61ff]" />
                      <span>{branchName}</span>
                    </span>
                  </div>

                  <div className="text-[#8c8c8c] flex items-center space-x-1 text-[11px]" title={formatDate(event.created_at)}>
                    <UploadCloud className="h-3.5 w-3.5 text-[#7b61ff]" />
                    <span>{formatRelativeTime(event.created_at)}</span>
                  </div>
                </div>

                {/* Commits inside this push event */}
                {commits.length > 0 && (
                  <div className="mt-2.5 pl-2 border-l-2 border-[#383838] space-y-1 text-xs">
                    {commits.map((c) => (
                      <div key={c.sha} className="flex items-center space-x-2 text-[#d4d4d4]">
                        <GitCommit className="h-3.5 w-3.5 text-[#7b61ff] flex-shrink-0" />
                        <span className="font-mono text-[#7b61ff] text-[11px]">{c.sha.substring(0, 7)}</span>
                        <span className="truncate text-[#b3b3b3]">{c.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
