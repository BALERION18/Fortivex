import { describe, it, expect } from 'vitest';
import { calculateHealthMetrics } from '../src/services/metricsService.js';

describe('calculateHealthMetrics', () => {
  it('returns null if repo is undefined', () => {
    expect(calculateHealthMetrics(null)).toBeNull();
  });

  it('correctly calculates metrics for an active healthy repository', () => {
    const mockRepo = {
      pushed_at: new Date().toISOString(), // pushed today
      open_issues_count: 5,
      license: { key: 'mit', spdx_id: 'MIT', name: 'MIT License' },
      description: 'A great open-source project',
      archived: false,
      topics: ['javascript', 'react', 'dashboard']
    };

    const mockPulls = [
      { state: 'open' },
      { state: 'closed' },
      { state: 'closed' }
    ];

    const mockIssues = [
      { state: 'open' },
      { state: 'closed' },
      { state: 'closed' },
      { state: 'closed' }
    ];

    const mockWorkflows = [
      { status: 'completed', conclusion: 'success' },
      { status: 'completed', conclusion: 'success' },
      { status: 'completed', conclusion: 'failure' }
    ];

    const metrics = calculateHealthMetrics(mockRepo, mockPulls, mockIssues, mockWorkflows);

    expect(metrics).toBeDefined();
    expect(metrics.activity.activityStatus).toBe('Very Active');
    expect(metrics.activity.daysSinceLastPush).toBeLessThanOrEqual(1);

    // Issues: 3 closed out of 4 total = 75%
    expect(metrics.issues.sampledResolutionRate).toBe(75);

    // Pull Requests: 2 closed out of 3 total = 67%
    expect(metrics.pullRequests.sampledResolutionRate).toBe(67);

    // CI: 2 success out of 3 completed = 67%
    expect(metrics.ci.successPercentage).toBe(67);
    expect(metrics.ci.ciStatus).toBe('Partially Passing');

    // Standards: License, Description, Active, Topics, CI = 5/5
    expect(metrics.standards.passed).toBe(5);
    expect(metrics.overallRating).toBe('Thriving');
  });

  it('marks archived repositories as Archived', () => {
    const mockRepo = {
      pushed_at: '2020-01-01T00:00:00Z',
      open_issues_count: 10,
      license: null,
      description: 'Old repo',
      archived: true,
      topics: []
    };

    const metrics = calculateHealthMetrics(mockRepo, [], [], []);
    expect(metrics.overallRating).toBe('Archived');
    expect(metrics.standards.checklist.find((c) => c.id === 'not_archived').passed).toBe(false);
  });
});
