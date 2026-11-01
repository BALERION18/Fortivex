import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  ShieldCheck,
  Compass,
  GitCommit,
  UploadCloud,
  GitPullRequest,
  AlertCircle,
  Users,
  GitBranch,
  PlayCircle,
  PanelLeftClose,
  PanelLeft,
  Zap,
  FolderGit2
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  repoData,
  rateLimit,
  isCollapsed,
  onToggleCollapse
}) {
  const remaining = rateLimit?.remaining ?? '—';
  const limit = rateLimit?.limit ?? '—';
  const hasToken = rateLimit?.hasToken;
  const percentLeft = typeof remaining === 'number' && typeof limit === 'number' && limit > 0
    ? Math.round((remaining / limit) * 100)
    : 100;

  const repo = repoData?.repository;

  const navSections = [
    {
      title: 'CORE INTELLIGENCE',
      items: [
        { id: 'overview', label: 'Overview & Telemetry', icon: LayoutDashboard },
        { id: 'intelligence', label: 'AI Architecture & Living Docs', icon: BrainCircuit },
        {
          id: 'security',
          label: 'Security & Protection',
          icon: ShieldCheck,
          badge: repoData?.securityScore ? `${repoData.securityScore}/100` : null
        },
        { id: 'insights', label: 'Advanced Insights & Doctor', icon: Compass }
      ]
    },
    {
      title: 'GIT VERSION CONTROL',
      items: [
        {
          id: 'commits',
          label: 'Commits',
          icon: GitCommit,
          count: repoData?.commits?.length
        },
        {
          id: 'pushEvents',
          label: 'Push Events',
          icon: UploadCloud,
          count: repoData?.pushEvents?.length
        },
        {
          id: 'pulls',
          label: 'Pull Requests',
          icon: GitPullRequest,
          count: repoData?.pullRequests?.length
        },
        {
          id: 'issues',
          label: 'Issues',
          icon: AlertCircle,
          count: repoData?.issues?.length
        }
      ]
    },
    {
      title: 'COLLABORATION & CI',
      items: [
        {
          id: 'contributors',
          label: 'Contributors',
          icon: Users,
          count: repoData?.contributors?.length
        },
        {
          id: 'branches',
          label: 'Branches & Releases',
          icon: GitBranch,
          count: (repoData?.branches?.length || 0) + (repoData?.releases?.length || 0)
        },
        {
          id: 'workflows',
          label: 'Actions CI',
          icon: PlayCircle,
          count: repoData?.workflowRuns?.length
        }
      ]
    }
  ];

  return (
    <aside
      className={`h-full border-r border-[#383838] bg-[#2c2c2c] flex flex-col justify-between transition-all duration-150 select-none ${
        isCollapsed ? 'w-14' : 'w-60'
      } flex-shrink-0 z-30`}
    >
      {/* Sidebar Header */}
      <div className="p-2.5 border-b border-[#383838] flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2 overflow-hidden">
            <img
              src="/logo.png"
              alt="FORTIVEX"
              className="h-6 w-6 object-contain rounded flex-shrink-0"
            />
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold text-white tracking-tight truncate">
                {repo ? repo.name : 'FORTIVEX Studio'}
              </h2>
              <p className="text-[10px] text-[#8c8c8c] truncate">
                {repo ? `${repo.owner?.login || ''} (Active)` : 'Workspace'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-6 w-6 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="FORTIVEX"
              className="h-6 w-6 object-contain rounded"
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-[#8c8c8c] hover:text-white hover:bg-[#383838] transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-2 text-[10px] font-semibold text-[#808080] tracking-wider block uppercase">
                {section.title}
              </span>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-2 py-1.5'
                    } rounded text-xs font-medium transition ${
                      isActive
                        ? 'bg-[#383838] text-white border-l-2 border-white font-semibold'
                        : 'text-[#b3b3b3] hover:text-white hover:bg-[#383838]/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#8c8c8c]'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/20 font-semibold">
                            {item.badge}
                          </span>
                        )}
                        {typeof item.count === 'number' && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              isActive ? 'bg-[#1e1e1e] text-white border border-[#484848]' : 'bg-[#1e1e1e] text-[#8c8c8c] border border-[#383838]'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Rate Limit & System Status */}
      <div className="p-2.5 border-t border-[#383838] bg-[#242424] font-sans text-xs space-y-1.5">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between text-[11px] text-[#8c8c8c]">
              <span className="flex items-center space-x-1">
                {hasToken ? (
                  <ShieldCheck className="h-3 w-3 text-white" />
                ) : (
                  <Zap className="h-3 w-3 text-[#ffcd29]" />
                )}
                <span>Rate Limit</span>
              </span>
              <span
                className={`font-semibold font-mono ${
                  remaining === 0 ? 'text-[#f24822]' : remaining < 10 ? 'text-[#ffcd29]' : 'text-white'
                }`}
              >
                {remaining} / {limit}
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-[#1e1e1e] border border-[#383838] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  percentLeft < 20 ? 'bg-[#f24822]' : percentLeft < 50 ? 'bg-[#ffcd29]' : 'bg-white'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, percentLeft))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8c8c8c] pt-0.5">
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14ae5c] animate-pulse" />
                <span>API Online</span>
              </span>
              <span>MIT License</span>
            </div>
          </>
        ) : (
          <div className="text-center py-1">
            <span
              className={`text-[10px] font-bold font-mono ${
                remaining < 10 ? 'text-[#ffcd29]' : 'text-white'
              }`}
              title={`Rate Limit: ${remaining}/${limit}`}
            >
              {remaining}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
