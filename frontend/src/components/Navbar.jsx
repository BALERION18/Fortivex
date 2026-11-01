import React, { useState } from 'react';
import {
  Compass,
  RefreshCw,
  ShieldCheck,
  Zap,
  Download,
  GitBranch,
  X,
  ExternalLink,
  User,
  LogOut
} from 'lucide-react';
import RepoSearchBar from './RepoSearchBar.jsx';
import { downloadPdfReport } from '../api/client.js';

export default function Navbar({
  rateLimit,
  onRefresh,
  isLoading,
  currentRepo,
  repoData,
  onSearch,
  onReset,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const remaining = rateLimit?.remaining ?? '—';
  const limit = rateLimit?.limit ?? '—';
  const hasToken = rateLimit?.hasToken;

  const repo = repoData?.repository;
  const defaultBranch = repo?.default_branch || 'main';

  async function handleExportPdf() {
    if (!currentRepo) return;
    setIsDownloadingPdf(true);
    try {
      await downloadPdfReport(currentRepo.owner, currentRepo.repo, defaultBranch);
    } catch (err) {
      alert(`PDF Export failed: ${err.message}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return (
    <header className="h-12 border-b border-[#383838] bg-[#2c2c2c] flex items-center justify-between px-3 sm:px-4 flex-shrink-0 z-40 select-none">
      {/* Left: Brand + Active Breadcrumbs */}
      <div className="flex items-center space-x-3 overflow-hidden flex-shrink-0 max-w-xs sm:max-w-md">
        <div className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="FORTIVEX Logo"
            className="h-6 w-6 object-contain rounded flex-shrink-0"
          />
          <span className="font-bold text-xs tracking-wider text-white hidden md:inline">
            FORTIVEX
          </span>
        </div>

        {/* Breadcrumbs for Active Repo */}
        {currentRepo && (
          <div className="flex items-center space-x-1.5 text-xs text-[#8c8c8c] pl-2.5 border-l border-[#383838] truncate">
            <span className="text-[#8c8c8c] truncate">{currentRepo.owner}</span>
            <span className="text-[#555555]">/</span>
            <span className="text-white font-medium truncate">{currentRepo.repo}</span>

            {repoData?.repository && (
              <a
                href={repoData.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8c8c8c] hover:text-white transition"
                title="Open repository in GitHub"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <div className="hidden lg:flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#b3b3b3] border border-[#383838] text-[10px]">
              <GitBranch className="h-3 w-3 text-[#0d99ff]" />
              <span>{defaultBranch}</span>
            </div>
          </div>
        )}
      </div>

      {/* Center: Sleek Figma-Style Global Search (No presets!) */}
      <div className="flex-1 max-w-lg mx-3 hidden sm:block">
        <RepoSearchBar
          onSearch={onSearch}
          isLoading={isLoading}
          initialValue={currentRepo ? `${currentRepo.owner}/${currentRepo.repo}` : ''}
          isCompact={true}
        />
      </div>

      {/* Right Controls: PDF Export, Refresh, Close */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Hidden screen-reader / test hook for rate limit - removed from top bar visually per request */}
        <span className="sr-only" aria-label="API Rate Limit">
          {remaining}/{limit}
        </span>

        {/* PDF Export Button (Figma Blue primary action) */}
        {currentRepo && repoData && (
          <button
            onClick={handleExportPdf}
            disabled={isDownloadingPdf || isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#0d99ff] hover:bg-[#007be5] text-white text-xs font-medium shadow-sm transition disabled:opacity-50"
            title="Download Executive PDF Audit Report"
          >
            <Download className={`h-3.5 w-3.5 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
            <span className="hidden md:inline">{isDownloadingPdf ? 'Exporting...' : 'Audit PDF'}</span>
          </button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded bg-[#383838] hover:bg-[#484848] text-[#d4d4d4] hover:text-white border border-[#484848]/60 transition disabled:opacity-50"
            title="Refresh repository telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
          </button>
        )}

        {/* Reset / Close repo */}
        {currentRepo && onReset && (
          <button
            onClick={onReset}
            className="p-1.5 rounded bg-[#383838] hover:bg-rose-500/20 text-[#8c8c8c] hover:text-rose-300 border border-[#484848]/60 hover:border-rose-500/40 transition"
            title="Close workspace"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="w-[1px] h-4 bg-[#383838] mx-0.5"></div>

        {/* User Account / Sign In Action */}
        {currentUser ? (
          <div className="flex items-center space-x-1.5 pl-1">
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#1e1e1e] border border-[#383838] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#14ae5c]"></span>
              <span className="text-white font-medium max-w-[90px] truncate">{currentUser.username}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded bg-[#383838] hover:bg-rose-500/20 text-[#8c8c8c] hover:text-rose-300 border border-[#484848]/60 transition"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-[#252526] hover:bg-[#383838] text-[#d4d4d4] hover:text-white border border-[#383838] hover:border-[#0d99ff]/50 text-xs font-medium transition"
              title="Sign in or register an account"
            >
              <User className="h-3.5 w-3.5 text-[#0d99ff]" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}
