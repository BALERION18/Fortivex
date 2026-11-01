import React from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  AlertCircle,
  CheckSquare,
  Award,
  Clock
} from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters.js';

export default function HealthIndicatorCard({ health }) {
  if (!health) return null;

  const { overallRating, activity, issues, pullRequests, ci, standards } = health;

  const ratingColors = {
    Thriving: 'bg-[#14ae5c]/10 text-emerald-300 border-[#14ae5c]/30',
    Healthy: 'bg-white/10 text-white border-white/20',
    Moderate: 'bg-white/10 text-[#d4d4d4] border-white/20',
    'Needs Attention': 'bg-[#ffcd29]/10 text-[#ffcd29] border-[#ffcd29]/30',
    Dormant: 'bg-[#1e1e1e] text-[#8c8c8c] border-[#383838]',
    Archived: 'bg-[#f24822]/10 text-[#f24822] border-[#f24822]/30'
  };

  return (
    <div className="bg-[#252526] border border-[#383838] rounded-lg p-5 mb-6 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#383838] gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">Repository Health & Maintenance</h3>
            <p className="text-xs text-[#8c8c8c]">
              Measurable indicators computed from verifiable GitHub activity and repository standards.
            </p>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium border ${
              ratingColors[overallRating] || 'bg-[#1e1e1e] text-[#b3b3b3] border-[#383838]'
            }`}
          >
            Status: {overallRating}
          </span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-4">
        {/* Activity Recency */}
        <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838]">
          <div className="flex items-center justify-between text-[#8c8c8c] text-xs mb-1">
            <span className="flex items-center space-x-1.5">
              <Activity className="h-3.5 w-3.5 text-[#0d99ff]" />
              <span>Activity Recency</span>
            </span>
            <span className="font-medium text-white">{activity.activityStatus}</span>
          </div>
          <p className="text-base font-semibold text-white mt-1">
            {activity.daysSinceLastPush !== null
              ? activity.daysSinceLastPush === 0
                ? 'Pushed today'
                : `${activity.daysSinceLastPush}d ago`
              : 'No pushes'}
          </p>
          <p className="text-[11px] text-[#8c8c8c] mt-1 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Last push: {formatRelativeTime(activity.lastPushedAt)}</span>
          </p>
        </div>

        {/* Issue Resolution */}
        <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838]">
          <div className="flex items-center justify-between text-[#8c8c8c] text-xs mb-1">
            <span className="flex items-center space-x-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-[#0d99ff]" />
              <span>Issue Closure Rate</span>
            </span>
            <span className="font-medium text-white">
              {issues.sampledResolutionRate !== null ? `${issues.sampledResolutionRate}%` : 'N/A'}
            </span>
          </div>
          <p className="text-base font-semibold text-white mt-1">
            {issues.sampledClosed} / {issues.sampledOpen + issues.sampledClosed} resolved
          </p>
          <p className="text-[11px] text-[#8c8c8c] mt-1">
            {issues.totalOpenCount} open issue{issues.totalOpenCount !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* PR Resolution */}
        <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838]">
          <div className="flex items-center justify-between text-[#8c8c8c] text-xs mb-1">
            <span className="flex items-center space-x-1.5">
              <GitPullRequest className="h-3.5 w-3.5 text-[#7b61ff]" />
              <span>PR Resolution Rate</span>
            </span>
            <span className="font-medium text-white">
              {pullRequests.sampledResolutionRate !== null ? `${pullRequests.sampledResolutionRate}%` : 'N/A'}
            </span>
          </div>
          <p className="text-base font-semibold text-white mt-1">
            {pullRequests.sampledClosed} / {pullRequests.sampledOpen + pullRequests.sampledClosed} closed/merged
          </p>
          <p className="text-[11px] text-[#8c8c8c] mt-1">
            {pullRequests.sampledOpen} active open PR{pullRequests.sampledOpen !== 1 ? 's' : ''}
          </p>
        </div>

        {/* CI Stability */}
        <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838]">
          <div className="flex items-center justify-between text-[#8c8c8c] text-xs mb-1">
            <span className="flex items-center space-x-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-[#0d99ff]" />
              <span>Actions CI Stability</span>
            </span>
            <span className="font-medium text-white">{ci.ciStatus}</span>
          </div>
          <p className="text-base font-semibold text-white mt-1">
            {ci.successPercentage !== null ? `${ci.successPercentage}% success` : 'No runs'}
          </p>
          <p className="text-[11px] text-[#8c8c8c] mt-1">
            {ci.successfulRuns} passed of {ci.completedRuns} recent completed runs
          </p>
        </div>
      </div>

      {/* Standards & Best Practices Checklist */}
      <div className="mt-2 pt-4 border-t border-[#383838]">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">
            Repository Standards Checklist ({standards.passed}/{standards.total} Passed)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {standards.checklist.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded border text-xs flex items-start space-x-2 ${
                item.passed
                  ? 'bg-[#14ae5c]/10 border-[#14ae5c]/30 text-emerald-200'
                  : 'bg-[#1e1e1e] border-[#383838] text-[#8c8c8c]'
              }`}
            >
              {item.passed ? (
                <CheckCircle2 className="h-4 w-4 text-[#14ae5c] flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-[#666666] flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-[11px] text-[#8c8c8c] mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
