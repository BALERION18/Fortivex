/**
 * Calculates factual, measurable health indicators for a repository.
 * Zero speculative or fake metrics.
 *
 * @param {object} repo - GitHub repository metadata object
 * @param {Array} pulls - Sampled pull requests array
 * @param {Array} issues - Sampled issues array (excluding PRs)
 * @param {Array} workflowRuns - Sampled GitHub Actions workflow runs
 * @returns {object} Measurable health assessment
 */
export function calculateHealthMetrics(repo, pulls = [], issues = [], workflowRuns = []) {
  if (!repo) {
    return null;
  }

  // 1. Activity Recency
  const lastPushedDate = repo.pushed_at ? new Date(repo.pushed_at) : null;
  const now = new Date();
  const daysSinceLastPush = lastPushedDate
    ? Math.max(0, Math.floor((now.getTime() - lastPushedDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  let activityStatus = 'Unknown';
  if (daysSinceLastPush !== null) {
    if (daysSinceLastPush <= 7) activityStatus = 'Very Active';
    else if (daysSinceLastPush <= 30) activityStatus = 'Active';
    else if (daysSinceLastPush <= 90) activityStatus = 'Moderate';
    else activityStatus = 'Low / Stale';
  }

  // 2. Issue Resolution Rate (Sampled)
  const openIssuesSampled = issues.filter((i) => i.state === 'open').length;
  const closedIssuesSampled = issues.filter((i) => i.state === 'closed').length;
  const totalIssuesSampled = openIssuesSampled + closedIssuesSampled;
  const issueResolutionPercentage =
    totalIssuesSampled > 0 ? Math.round((closedIssuesSampled / totalIssuesSampled) * 100) : null;

  // 3. PR Resolution Rate (Sampled)
  const openPullsSampled = pulls.filter((p) => p.state === 'open').length;
  const closedOrMergedPullsSampled = pulls.filter((p) => p.state === 'closed').length;
  const totalPullsSampled = openPullsSampled + closedOrMergedPullsSampled;
  const prResolutionPercentage =
    totalPullsSampled > 0 ? Math.round((closedOrMergedPullsSampled / totalPullsSampled) * 100) : null;

  // 4. CI Workflow Stability
  const completedRuns = workflowRuns.filter((r) => r.status === 'completed');
  const successfulRuns = completedRuns.filter((r) => r.conclusion === 'success');
  const failedRuns = completedRuns.filter((r) => r.conclusion === 'failure');
  const ciSuccessPercentage =
    completedRuns.length > 0 ? Math.round((successfulRuns.length / completedRuns.length) * 100) : null;

  let ciStatus = 'No CI Runs';
  if (completedRuns.length > 0) {
    if (ciSuccessPercentage >= 90) ciStatus = 'Passing';
    else if (ciSuccessPercentage >= 60) ciStatus = 'Partially Passing';
    else ciStatus = 'Failing';
  }

  // 5. Documentation & Standard Best Practices Checklist
  const checklist = [
    {
      id: 'license',
      label: 'Open Source License',
      passed: Boolean(repo.license && repo.license.key !== 'other'),
      detail: repo.license ? repo.license.spdx_id || repo.license.name : 'Missing license'
    },
    {
      id: 'description',
      label: 'Repository Description',
      passed: Boolean(repo.description && repo.description.trim().length > 0),
      detail: repo.description ? 'Description provided' : 'No description provided'
    },
    {
      id: 'not_archived',
      label: 'Active Maintenance',
      passed: !repo.archived,
      detail: repo.archived ? 'Repository is archived (read-only)' : 'Active (not archived)'
    },
    {
      id: 'topics',
      label: 'Discoverability Topics',
      passed: Array.isArray(repo.topics) && repo.topics.length > 0,
      detail:
        Array.isArray(repo.topics) && repo.topics.length > 0
          ? `${repo.topics.length} topic tags configured`
          : 'No topics assigned'
    },
    {
      id: 'ci_workflows',
      label: 'Automated CI Workflows',
      passed: workflowRuns.length > 0,
      detail: workflowRuns.length > 0 ? `${workflowRuns.length} recent runs tracked` : 'No workflow runs detected'
    }
  ];

  const standardsPassedCount = checklist.filter((item) => item.passed).length;
  const standardsTotalCount = checklist.length;

  // 6. Overall Assessment
  let overallRating = 'Healthy';
  if (repo.archived) {
    overallRating = 'Archived';
  } else if (daysSinceLastPush !== null && daysSinceLastPush > 180) {
    overallRating = 'Dormant';
  } else if (standardsPassedCount < 2 || (daysSinceLastPush !== null && daysSinceLastPush > 90)) {
    overallRating = 'Needs Attention';
  } else if (standardsPassedCount >= 4 && daysSinceLastPush !== null && daysSinceLastPush <= 30) {
    overallRating = 'Thriving';
  }

  return {
    overallRating,
    activity: {
      daysSinceLastPush,
      activityStatus,
      lastPushedAt: repo.pushed_at
    },
    issues: {
      totalOpenCount: repo.open_issues_count,
      sampledOpen: openIssuesSampled,
      sampledClosed: closedIssuesSampled,
      sampledResolutionRate: issueResolutionPercentage
    },
    pullRequests: {
      sampledOpen: openPullsSampled,
      sampledClosed: closedOrMergedPullsSampled,
      sampledResolutionRate: prResolutionPercentage
    },
    ci: {
      ciStatus,
      totalRuns: workflowRuns.length,
      completedRuns: completedRuns.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      successPercentage: ciSuccessPercentage
    },
    standards: {
      passed: standardsPassedCount,
      total: standardsTotalCount,
      checklist
    }
  };
}
