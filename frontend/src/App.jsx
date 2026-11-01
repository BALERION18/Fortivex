import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import RepoSearchBar from './components/RepoSearchBar.jsx';
import RateLimitBanner from './components/RateLimitBanner.jsx';
import HealthIndicatorCard from './components/HealthIndicatorCard.jsx';
import OverviewTab from './components/OverviewTab.jsx';
import CommitsTab from './components/CommitsTab.jsx';
import PushEventsTab from './components/PushEventsTab.jsx';
import PullRequestsTab from './components/PullRequestsTab.jsx';
import IssuesTab from './components/IssuesTab.jsx';
import ContributorsTab from './components/ContributorsTab.jsx';
import BranchesReleasesTab from './components/BranchesReleasesTab.jsx';
import WorkflowsTab from './components/WorkflowsTab.jsx';
import LoadingSkeleton from './components/LoadingSkeleton.jsx';
import EmptyState from './components/EmptyState.jsx';
import ErrorState from './components/ErrorState.jsx';
import AnalyticsCharts from './components/AnalyticsCharts.jsx';
import SecurityScannerTab from './components/SecurityScannerTab.jsx';
import CodeIntelligenceTab from './components/CodeIntelligenceTab.jsx';
import AdvancedInsightsTab from './components/AdvancedInsightsTab.jsx';
import AuthPage from './components/AuthPage.jsx';

import {
  fetchRepoOverview,
  fetchRateLimit,
  fetchCurrentUser
} from './api/client.js';

export default function App() {
  const [currentRepo, setCurrentRepo] = useState(null);
  const [repoData, setRepoData] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthView, setIsAuthView] = useState(false);

  // Initial load of rate limit info and user session
  useEffect(() => {
    fetchRateLimit()
      .then((data) => setRateLimit(data))
      .catch(() => {});

    fetchCurrentUser()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem('fortivex_auth_token');
    localStorage.removeItem('fortivex_user');
    setCurrentUser(null);
  }

  async function loadRepository(owner, repo) {
    if (!owner || !repo) return;
    setIsLoading(true);
    setError(null);
    setCurrentRepo({ owner, repo });

    try {
      const data = await fetchRepoOverview(owner, repo);
      setRepoData(data);
      if (data.rateLimit) {
        setRateLimit(data.rateLimit);
      }
    } catch (err) {
      setError(err);
      if (err.rateLimit) {
        setRateLimit(err.rateLimit);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleRefresh() {
    if (currentRepo) {
      loadRepository(currentRepo.owner, currentRepo.repo);
    } else {
      fetchRateLimit().then((data) => setRateLimit(data)).catch(() => {});
    }
  }

  function handleReset() {
    setRepoData(null);
    setError(null);
    setCurrentRepo(null);
    setActiveTab('overview');
  }

  if (isAuthView) {
    return (
      <AuthPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthView(false);
        }}
        onContinueGuest={() => setIsAuthView(false)}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#1e1e1e] text-[#f5f5f5] font-sans">
      {/* Figma-Style Top Toolbar */}
      <Navbar
        rateLimit={rateLimit}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        currentRepo={currentRepo}
        repoData={repoData}
        onSearch={(owner, repo) => loadRepository(owner, repo)}
        onReset={handleReset}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthView(true)}
        onLogout={handleLogout}
      />

      {/* Main Studio Viewport: Left Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Figma-Style Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          repoData={repoData}
          rateLimit={rateLimit}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Working Canvas (Beside Left Sidebar) */}
        <main className="flex-1 h-full overflow-y-auto bg-[#1e1e1e] p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-[#383838]">
          {/* Mobile search bar if top bar search is hidden on small screens */}
          <div className="block sm:hidden mb-4">
            <RepoSearchBar
              onSearch={(owner, repo) => loadRepository(owner, repo)}
              isLoading={isLoading}
              initialValue={currentRepo ? `${currentRepo.owner}/${currentRepo.repo}` : ''}
            />
          </div>

          {/* Rate limit banner warning if quota is low */}
          <RateLimitBanner rateLimit={rateLimit} />

          {/* Loading Skeleton */}
          {isLoading && <LoadingSkeleton />}

          {/* Error State */}
          {!isLoading && error && (
            <ErrorState
              error={error}
              onRetry={handleRefresh}
              onReset={handleReset}
            />
          )}

          {/* Empty / Welcome State (Zero presets!) */}
          {!isLoading && !error && !repoData && (
            <EmptyState onOpenAuth={() => setIsAuthView(true)} />
          )}

          {/* Active Canvas: Working View Beside Left Sidebar */}
          {!isLoading && !error && repoData && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Dynamic Working Tab Canvas */}
              <div className="transition-all duration-150">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <HealthIndicatorCard health={repoData.health} />
                    <OverviewTab repository={repoData.repository} />
                    <AnalyticsCharts
                      commits={repoData.commits}
                      issues={repoData.issues}
                      pulls={repoData.pullRequests}
                      contributors={repoData.contributors}
                      languages={repoData.languages}
                      workflowRuns={repoData.workflowRuns}
                      primaryLanguage={repoData.repository?.language}
                    />
                  </div>
                )}

                {activeTab === 'intelligence' && (
                  <CodeIntelligenceTab
                    owner={currentRepo?.owner}
                    repo={currentRepo?.repo}
                    commitSha={repoData.repository?.default_branch || 'HEAD'}
                  />
                )}

                {activeTab === 'security' && (
                  <SecurityScannerTab
                    owner={currentRepo?.owner}
                    repo={currentRepo?.repo}
                  />
                )}

                {activeTab === 'insights' && (
                  <AdvancedInsightsTab
                    owner={currentRepo?.owner}
                    repo={currentRepo?.repo}
                    commitSha={repoData.repository?.default_branch || 'HEAD'}
                  />
                )}

                {activeTab === 'commits' && (
                  <CommitsTab commits={repoData.commits} />
                )}

                {activeTab === 'pushEvents' && (
                  <PushEventsTab
                    pushEvents={repoData.pushEvents}
                    notice={repoData.pushEventsNotice}
                  />
                )}

                {activeTab === 'pulls' && (
                  <PullRequestsTab pullRequests={repoData.pullRequests} />
                )}

                {activeTab === 'issues' && (
                  <IssuesTab issues={repoData.issues} />
                )}

                {activeTab === 'contributors' && (
                  <ContributorsTab contributors={repoData.contributors} />
                )}

                {activeTab === 'branches' && (
                  <BranchesReleasesTab
                    branches={repoData.branches}
                    releases={repoData.releases}
                    defaultBranch={repoData.repository?.default_branch}
                    htmlUrl={repoData.repository?.html_url}
                  />
                )}

                {activeTab === 'workflows' && (
                  <WorkflowsTab workflowRuns={repoData.workflowRuns} />
                )}
              </div>

              {/* Repository Canvas Footer */}
              <footer className="mt-12 pt-4 border-t border-[#383838] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8c8c8c] gap-2 pb-6">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">FORTIVEX</span>
                  <span>•</span>
                  <span>Released under the MIT License</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Zero-execution static audit & live GitHub telemetry</span>
                </div>
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
