import React, { useState } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  GitBranch,
  Search,
  RotateCw
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/formatters.js';

export default function WorkflowsTab({ workflowRuns = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRuns = workflowRuns.filter((run) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = run.name?.toLowerCase() || '';
    const branch = run.head_branch?.toLowerCase() || '';
    const event = run.event?.toLowerCase() || '';
    return name.includes(term) || branch.includes(term) || event.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#252526] p-3 rounded-lg border border-[#383838]">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#0d99ff]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter workflow runs by name, branch, or event..."
            className="w-full pl-8 pr-4 py-1.5 bg-[#1e1e1e] border border-[#383838] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
          />
        </div>
        <div className="text-xs text-[#8c8c8c] self-center">
          {filteredRuns.length} workflow run{filteredRuns.length !== 1 ? 's' : ''} listed
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <div className="text-center py-12 bg-[#252526] rounded-lg border border-[#383838] text-[#8c8c8c] text-sm">
          No workflow runs recorded for this repository.
        </div>
      ) : (
        <div className="bg-[#252526] border border-[#383838] rounded-lg divide-y divide-[#383838] overflow-hidden shadow-sm">
          {filteredRuns.map((run) => {
            const isCompleted = run.status === 'completed';
            const isSuccess = run.conclusion === 'success';
            const isFailure = run.conclusion === 'failure';
            const isInProgress = run.status === 'in_progress' || run.status === 'queued';

            return (
              <div
                key={run.id}
                className="p-3.5 hover:bg-[#2c2c2c] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="mt-0.5 flex-shrink-0">
                    {isSuccess && <CheckCircle2 className="h-4 w-4 text-[#14ae5c]" />}
                    {isFailure && <XCircle className="h-4 w-4 text-[#f24822]" />}
                    {isInProgress && <RotateCw className="h-4 w-4 text-white animate-spin" />}
                    {!isSuccess && !isFailure && !isInProgress && (
                      <Clock className="h-4 w-4 text-[#8c8c8c]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-semibold text-white">{run.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1e1e1e] text-[#8c8c8c] border border-[#383838]">
                        {run.event}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-[#8c8c8c] flex-wrap gap-y-1">
                      <span className="inline-flex items-center space-x-1 font-mono text-white">
                        <GitBranch className="h-3 w-3 text-[#0d99ff]" />
                        <span>{run.head_branch || 'HEAD'}</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[#8c8c8c]">
                        commit {run.head_sha ? run.head_sha.substring(0, 7) : '—'}
                      </span>
                      <span>•</span>
                      <span title={formatDate(run.created_at)}>
                        triggered {formatRelativeTime(run.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      isSuccess
                        ? 'bg-[#14ae5c]/10 text-emerald-300 border-[#14ae5c]/30'
                        : isFailure
                        ? 'bg-[#f24822]/10 text-[#f24822] border-[#f24822]/30'
                        : isInProgress
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-[#1e1e1e] text-[#8c8c8c] border-[#383838]'
                    }`}
                  >
                    {run.conclusion || run.status}
                  </span>

                  {run.html_url && (
                    <a
                      href={run.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#383838] hover:bg-[#484848] text-[#8c8c8c] hover:text-white border border-[#484848]/60 transition"
                      title="View workflow run on GitHub"
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
