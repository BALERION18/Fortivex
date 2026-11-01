import React from 'react';
import {
  Star,
  GitFork,
  Eye,
  AlertCircle,
  ExternalLink,
  Code2,
  Scale,
  GitBranch,
  HardDrive,
  Calendar,
  Globe
} from 'lucide-react';
import { formatNumber, formatDate, formatRelativeTime } from '../utils/formatters.js';

export default function OverviewTab({ repository }) {
  if (!repository) return null;

  const {
    name,
    full_name,
    owner,
    description,
    html_url,
    homepage,
    stargazers_count,
    forks_count,
    watchers_count,
    open_issues_count,
    language,
    license,
    default_branch,
    size,
    archived,
    fork,
    topics = [],
    created_at,
    updated_at,
    pushed_at
  } = repository;

  // Approximate repository size in MB or KB
  const formattedSize =
    size >= 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#252526] border border-[#383838] rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <img
              src={owner?.avatar_url || 'https://github.com/github.png'}
              alt={owner?.login || 'Owner'}
              className="w-12 h-12 rounded border border-[#383838] shadow-sm flex-shrink-0"
            />
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-semibold text-white tracking-tight">{full_name}</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1e1e1e] text-[#b3b3b3] border border-[#383838]">
                  Public
                </span>
                {archived && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f24822]/10 text-[#f24822] border border-[#f24822]/30">
                    Archived
                  </span>
                )}
                {fork && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/30">
                    Forked
                  </span>
                )}
              </div>

              <p className="text-[#b3b3b3] text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
                {description || 'No description provided for this repository.'}
              </p>

              {homepage && (
                <a
                  href={homepage.startsWith('http') ? homepage : `https://${homepage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-[#0d99ff] hover:underline mt-1.5 font-medium"
                >
                  <Globe className="h-3.5 w-3.5 text-[#0d99ff]" />
                  <span>{homepage}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <a
              href={html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#383838] hover:bg-[#484848] text-white font-medium text-xs border border-[#484848]/60 transition"
            >
              <span>View on GitHub</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#8c8c8c]" />
            </a>
          </div>
        </div>

        {/* Topics */}
        {topics && topics.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-[#383838] flex items-center flex-wrap gap-1.5">
            <span className="text-xs text-[#8c8c8c] mr-1 font-medium">Topics:</span>
            {topics.map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 rounded bg-[#1e1e1e] text-[#b3b3b3] text-[11px] font-medium border border-[#383838]"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Vital Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded bg-[#252526] border border-[#383838] flex items-center space-x-3">
          <div className="p-2.5 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <Star className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8c8c8c] font-medium">Stars</p>
            <p className="text-lg font-semibold text-white mt-0.5">{formatNumber(stargazers_count)}</p>
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#252526] border border-[#383838] flex items-center space-x-3">
          <div className="p-2.5 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <GitFork className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8c8c8c] font-medium">Forks</p>
            <p className="text-lg font-semibold text-white mt-0.5">{formatNumber(forks_count)}</p>
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#252526] border border-[#383838] flex items-center space-x-3">
          <div className="p-2.5 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8c8c8c] font-medium">Watchers</p>
            <p className="text-lg font-semibold text-white mt-0.5">{formatNumber(watchers_count)}</p>
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#252526] border border-[#383838] flex items-center space-x-3">
          <div className="p-2.5 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8c8c8c] font-medium">Open Issues</p>
            <p className="text-lg font-semibold text-white mt-0.5">{formatNumber(open_issues_count)}</p>
          </div>
        </div>
      </div>

      {/* Metadata Detail Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded bg-[#252526] border border-[#383838] flex items-center space-x-2.5">
          <Code2 className="h-4 w-4 text-[#0d99ff] flex-shrink-0" />
          <div>
            <span className="text-[#8c8c8c] block text-[11px]">Primary Language</span>
            <span className="font-medium text-white text-xs">{language || 'Not specified'}</span>
          </div>
        </div>

        <div className="p-3 rounded bg-[#252526] border border-[#383838] flex items-center space-x-2.5">
          <Scale className="h-4 w-4 text-[#0d99ff] flex-shrink-0" />
          <div>
            <span className="text-[#8c8c8c] block text-[11px]">License</span>
            <span className="font-medium text-white text-xs">
              {license ? license.spdx_id || license.name : 'No License'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded bg-[#252526] border border-[#383838] flex items-center space-x-2.5">
          <GitBranch className="h-4 w-4 text-[#0d99ff] flex-shrink-0" />
          <div>
            <span className="text-[#8c8c8c] block text-[11px]">Default Branch</span>
            <span className="font-medium text-white text-xs font-mono">{default_branch || 'main'}</span>
          </div>
        </div>

        <div className="p-3 rounded bg-[#252526] border border-[#383838] flex items-center space-x-2.5">
          <HardDrive className="h-4 w-4 text-[#0d99ff] flex-shrink-0" />
          <div>
            <span className="text-[#8c8c8c] block text-[11px]">Repository Size</span>
            <span className="font-medium text-white text-xs font-mono">{formattedSize}</span>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-3 rounded bg-[#252526] border border-[#383838] flex flex-wrap items-center justify-between text-xs text-[#8c8c8c] gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-3.5 w-3.5 text-[#8c8c8c]" />
          <span>Created on <strong className="text-white">{formatDate(created_at)}</strong></span>
        </div>
        <div>
          <span>Metadata updated <strong className="text-white">{formatRelativeTime(updated_at)}</strong></span>
        </div>
        <div>
          <span>Last push: <strong className="text-white font-semibold">{formatRelativeTime(pushed_at)}</strong></span>
        </div>
      </div>
    </div>
  );
}
