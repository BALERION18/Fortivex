/**
 * Advanced Repository Analytics Service
 *
 * Implements evidence-based, transparent repository analytics:
 * 1. Commit velocity & history cadence (defined window, neutral interpretation)
 * 2. Evidence-based change-impact estimation (structural risk tiers with full rationale)
 * 3. Contributor distribution & attributable shares (consistent percentages, explicit heuristics)
 * 4. Documentation drift detection (cross-checking README with active tree & scripts)
 * 5. Setup Doctor (language-aware configuration and hygiene diagnostics)
 *
 * SAFETY GUARANTEE: Never executes repository code or scripts.
 */

const BUS_FACTOR_CAUTION =
  'CAUTIONARY HEURISTIC NOTICE: This contributor distribution metric is calculated strictly from attributable Git commits in available history. Commit frequency does not measure architectural leadership, code review diligence, incident triage, or organizational knowledge distribution. Do not use as an absolute team performance or staffing metric.';

/**
 * 1. Analyzes commit history velocity, churn, and timeline comparison.
 * Clearly defines commit velocity as cadence over a sample window without judging code quality.
 */
export function analyzeHistoryComparison(commits = []) {
  if (!Array.isArray(commits) || commits.length === 0) {
    return {
      totalCommitsSampled: 0,
      velocity: 'Insufficient data (No commit data available in sample)',
      avgCommitsPerActiveDay: 0,
      recentWindowCount: 0,
      olderWindowCount: 0,
      authorCount: 0,
      authors: [],
      activeDaysCount: 0,
      summary: 'Insufficient commit history available to calculate activity cadence.'
    };
  }

  const sampleSize = commits.length;
  const authorMap = {};
  const dailyMap = {};

  commits.forEach((c) => {
    const authorName = c.author?.login || c.commit?.author?.name || 'Unknown';
    authorMap[authorName] = (authorMap[authorName] || 0) + 1;

    const dateStr = (c.commit?.author?.date || c.commit?.committer?.date || '').split('T')[0];
    if (dateStr) {
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
    }
  });

  const uniqueAuthors = Object.keys(authorMap).length;
  const activeDays = Object.keys(dailyMap).length;
  const avgCommitsPerDay = activeDays > 0 ? (sampleSize / activeDays).toFixed(1) : '1.0';

  let velocityRating = 'Moderate Pace';
  if (parseFloat(avgCommitsPerDay) >= 4.0) velocityRating = 'Active Daily Cadence';
  else if (parseFloat(avgCommitsPerDay) < 1.0) velocityRating = 'Intermittent / Low Cadence';

  return {
    totalCommitsSampled: sampleSize,
    velocity: velocityRating,
    avgCommitsPerActiveDay: parseFloat(avgCommitsPerDay),
    authorCount: uniqueAuthors,
    authors: Object.entries(authorMap)
      .map(([name, count]) => ({
        name,
        count,
        share: Math.round((count / sampleSize) * 100)
      }))
      .sort((a, b) => b.count - a.count),
    activeDaysCount: activeDays,
    dailyActivity: dailyMap,
    summary: `Analyzed ${sampleSize} commits across ${activeDays} active days, averaging ${avgCommitsPerDay} commits per active day. This metric reflects recent commit cadence over the sampled window, not overall software quality.`
  };
}

/**
 * 2. Evidence-based change-impact estimation.
 * Evaluates repository structural sensitivity without defaulting to 100/100.
 */
export function estimateChangeImpact(commits = [], treeFiles = []) {
  const filePaths = Array.isArray(treeFiles) ? treeFiles.map((f) => (typeof f === 'string' ? f : f.path || '')) : [];

  if (filePaths.length === 0 && commits.length === 0) {
    return {
      riskTier: 'LOW',
      blastRadiusScore: 20,
      impactFactors: [],
      disclaimer: 'Insufficient file tree data available to compute change impact.'
    };
  }

  // Identify structural touch points
  const criticalManifests = filePaths.filter((p) =>
    /(?:^|\/)(?:package\.json|requirements\.txt|pom\.xml|go\.mod|Cargo\.toml)$/i.test(p)
  );

  const infraConfigFiles = filePaths.filter((p) =>
    /(?:^|\/)(?:docker-compose\.ya?ml|Dockerfile|\.github\/workflows\/.*\.ya?ml|nginx\.conf|\.env\.example)$/i.test(p)
  );

  const entryPointFiles = filePaths.filter((p) =>
    /(?:^|\/)(?:main\.py|server\.js|app\.js|index\.js|main\.go)$/i.test(p)
  );

  const databaseFiles = filePaths.filter((p) =>
    /(?:^|\/)(?:schema\.prisma|migrations?\/.*|models?\/.*|config\.py|database\.py)$/i.test(p)
  );

  // Baseline starts at moderate 25
  let blastRadiusScore = 25;
  const impactFactors = [];

  if (criticalManifests.length > 0) {
    blastRadiusScore += 15;
    impactFactors.push({
      factor: 'Dependency Manifests Present',
      level: 'MEDIUM',
      evidence: criticalManifests.slice(0, 3).join(', ')
    });
  }

  if (infraConfigFiles.length > 0) {
    blastRadiusScore += 15;
    impactFactors.push({
      factor: 'Infrastructure & Containerization Configs',
      level: 'MEDIUM',
      evidence: infraConfigFiles.slice(0, 3).join(', ')
    });
  }

  if (entryPointFiles.length > 0) {
    blastRadiusScore += 10;
    impactFactors.push({
      factor: 'Core Application Entrypoints',
      level: 'ELEVATED',
      evidence: entryPointFiles.slice(0, 3).join(', ')
    });
  }

  if (databaseFiles.length > 0) {
    blastRadiusScore += 10;
    impactFactors.push({
      factor: 'Database Models & Connection Configs',
      level: 'MEDIUM',
      evidence: databaseFiles.slice(0, 3).join(', ')
    });
  }

  // Inspect recent commit messages for breaking changes or major refactors
  const recentMessages = commits.slice(0, 10).map((c) => c.commit?.message?.toLowerCase() || '');
  const hasBreaking = recentMessages.some((m) => m.includes('breaking') || m.includes('major refactor'));
  if (hasBreaking) {
    blastRadiusScore += 15;
    impactFactors.push({
      factor: 'Recent Breaking / Refactoring Changes',
      level: 'HIGH',
      evidence: 'Commit messages flag breaking changes'
    });
  }

  // Clamp blast radius score between 15 and 85 under ordinary conditions
  blastRadiusScore = Math.min(85, Math.max(15, blastRadiusScore));

  let riskTier = 'LOW';
  if (blastRadiusScore >= 50) riskTier = 'HIGH';
  else if (blastRadiusScore >= 35) riskTier = 'MEDIUM';
  else riskTier = 'LOW';

  return {
    riskTier,
    blastRadiusScore,
    criticalManifestsCount: criticalManifests.length,
    infraConfigsCount: infraConfigFiles.length,
    entryPointsCount: entryPointFiles.length,
    impactFactors,
    explanation: `Calculated from ${filePaths.length} structural files and ${commits.length} recent commits. Identified ${criticalManifests.length} manifests and ${infraConfigFiles.length} deployment configs.`
  };
}

/**
 * 3. Contributor distribution and attributable shares.
 * Calculates exact percentages from attributable commits or GitHub contributors API,
 * ensuring shares sum to ~100% and labeling bus-factor with cautionary disclaimers.
 */
export function analyzeContributorOwnership(contributors = [], commits = []) {
  let authorCounts = [];

  // If contributors array is provided and populated, use it
  if (Array.isArray(contributors) && contributors.length > 0) {
    authorCounts = contributors.map((c) => ({
      name: c.login || 'Unknown',
      count: c.contributions || 1,
      avatarUrl: c.avatar_url
    }));
  } else if (Array.isArray(commits) && commits.length > 0) {
    // Fallback: extract directly from attributable commits
    const map = {};
    commits.forEach((c) => {
      const name = c.author?.login || c.commit?.author?.name || 'Unknown';
      map[name] = (map[name] || 0) + 1;
    });
    authorCounts = Object.entries(map).map(([name, count]) => ({
      name,
      count
    }));
  }

  if (authorCounts.length === 0) {
    return {
      totalContributors: 0,
      totalContributions: 0,
      top1Percentage: 0,
      top3Percentage: 0,
      top5Percentage: 0,
      concentrationLevel: 'Insufficient Data',
      heuristicBusFactor: 'Insufficient Data',
      topContributors: [],
      cautionaryDisclaimer: BUS_FACTOR_CAUTION
    };
  }

  // Sort descending
  authorCounts.sort((a, b) => b.count - a.count);
  const totalCommits = authorCounts.reduce((sum, a) => sum + a.count, 0);

  // Compute exact percentages with 1 decimal place precision
  const topContributors = authorCounts.map((a) => {
    const pct = totalCommits > 0 ? Math.round((a.count / totalCommits) * 1000) / 10 : 0;
    return {
      name: a.name,
      count: a.count,
      percentage: pct,
      avatarUrl: a.avatarUrl
    };
  });

  const top1 = topContributors[0]?.count || 0;
  const top3 = topContributors.slice(0, 3).reduce((sum, a) => sum + a.count, 0);
  const top5 = topContributors.slice(0, 5).reduce((sum, a) => sum + a.count, 0);

  const top1Percentage = totalCommits > 0 ? Math.round((top1 / totalCommits) * 100) : 0;
  const top3Percentage = totalCommits > 0 ? Math.round((top3 / totalCommits) * 100) : 0;
  const top5Percentage = totalCommits > 0 ? Math.round((top5 / totalCommits) * 100) : 0;

  let concentrationLevel = 'Diversified';
  let heuristicBusFactor = '>= 4 Maintainers (Broad Team Distribution)';

  if (top1Percentage >= 70) {
    concentrationLevel = 'Critical Concentration';
    heuristicBusFactor = '1 (Primary Lead Maintainer Focus)';
  } else if (top3Percentage >= 80 && topContributors.length > 2) {
    concentrationLevel = 'Moderate Concentration';
    heuristicBusFactor = '2-3 (Core Group Focus)';
  }

  return {
    totalContributors: topContributors.length,
    totalContributions: totalCommits,
    top1Percentage,
    top3Percentage,
    top5Percentage,
    concentrationLevel,
    heuristicBusFactor,
    topContributors: topContributors.slice(0, 5),
    cautionaryDisclaimer: BUS_FACTOR_CAUTION
  };
}

/**
 * 4. Documentation drift checks.
 * Compares README text against active tree files and package.json scripts.
 */
export function checkDocumentationDrift(readmeText = '', treeFiles = [], packageJson = null) {
  if (!readmeText || typeof readmeText !== 'string') {
    return {
      status: 'No Documentation Found',
      driftScore: 50,
      discrepanciesCount: 1,
      discrepancies: [
        {
          type: 'MISSING_README',
          severity: 'HIGH',
          detail: 'No README.md documentation file was found in the repository root.'
        }
      ]
    };
  }

  const filePaths = Array.isArray(treeFiles) ? treeFiles.map((f) => (typeof f === 'string' ? f : f.path || '')) : [];
  const registeredScripts = packageJson?.scripts || {};
  const discrepancies = [];

  // Check for referenced scripts in README (e.g. `npm run build`, `npm test`)
  const npmRunMatches = readmeText.matchAll(/npm (?:run )?([a-zA-Z0-9_:-]+)/g);
  const standardCommands = new Set(['install', 'ci', 'init', 'start', 'test', 'audit', 'dev', 'build']);

  for (const match of npmRunMatches) {
    const scriptName = match[1];
    if (!standardCommands.has(scriptName) && !registeredScripts[scriptName]) {
      discrepancies.push({
        type: 'UNRESOLVED_SCRIPT',
        severity: 'MEDIUM',
        detail: `README references command 'npm run ${scriptName}', but '${scriptName}' is not defined in package.json.`
      });
    }
  }

  // Check for referenced file paths
  const pathMatches = readmeText.matchAll(/(?:`|\]\()((?:src\/|config\/|\.github\/|\.env)[a-zA-Z0-9_.-]+)(?:`|\))/g);
  for (const match of pathMatches) {
    const candidatePath = match[1];
    const exists = filePaths.some((p) => p === candidatePath || p.endsWith(candidatePath));
    if (!exists) {
      discrepancies.push({
        type: 'STALE_PATH_REFERENCE',
        severity: 'LOW',
        detail: `README references '${candidatePath}', which was not found in the active repository tree.`
      });
    }
  }

  const uniqueDiscrepancies = discrepancies.filter(
    (item, index, self) => index === self.findIndex((t) => t.detail === item.detail)
  );

  let driftScore = Math.max(20, 100 - uniqueDiscrepancies.length * 15);
  let status = 'Synchronized (Low Drift)';
  if (uniqueDiscrepancies.length >= 3) status = 'Significant Drift Detected';
  else if (uniqueDiscrepancies.length >= 1) status = 'Minor Drift Observed';

  return {
    status,
    driftScore,
    discrepanciesCount: uniqueDiscrepancies.length,
    discrepancies: uniqueDiscrepancies,
    disclaimer: 'Drift checks inspect README text syntax against active tree file paths and package manifest scripts without executing repository code.'
  };
}

/**
 * 5. Setup Doctor: Language-aware repository configuration diagnostics.
 */
export function runSetupDoctor(treeFiles = [], packageJson = null) {
  const filePaths = Array.isArray(treeFiles) ? treeFiles.map((f) => (typeof f === 'string' ? f : f.path || '')) : [];
  const checks = [];

  const isPython = filePaths.some((p) => /(?:requirements\.txt|pyproject\.toml|\.py)$/i.test(p));
  const isNode = Boolean(packageJson) || filePaths.some((p) => /(?:package\.json|package-lock\.json|\.jsx?|\.tsx?)$/i.test(p));

  // Check 1: Environment Template
  const hasEnvExample = filePaths.some((p) => /(?:^|\/)\.env\.example$/i.test(p));
  const hasEnvCommitted = filePaths.some((p) => /(?:^|\/)\.env$/i.test(p));
  checks.push({
    id: 'env-template',
    label: 'Environment Secret Template (.env.example)',
    passed: hasEnvExample && !hasEnvCommitted,
    status: hasEnvExample ? (hasEnvCommitted ? 'WARNING' : 'PASS') : 'WARNING',
    remediation: hasEnvCommitted
      ? 'A .env file is committed in source control! Remove it and provide a sanitized .env.example instead.'
      : hasEnvExample
      ? 'Clean .env.example template is present.'
      : 'Provide a .env.example file to document required environment variables.'
  });

  // Check 2: Dependency Specification / Lockfile
  const hasLockfile = filePaths.some((p) =>
    /(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Pipfile\.lock|Cargo\.lock|go\.sum|requirements\.txt)$/i.test(p)
  );
  checks.push({
    id: 'lockfile-check',
    label: 'Dependency Manifest & Lockfile',
    passed: hasLockfile,
    status: hasLockfile ? 'PASS' : 'WARNING',
    remediation: hasLockfile
      ? 'Dependency manifest / lockfile committed for reproducible builds.'
      : 'Commit package-lock.json, requirements.txt, or equivalent to ensure reproducible dependencies.'
  });

  // Check 3: Automated Test Harness (Language-Aware)
  let hasTests = false;
  let testDetail = '';

  if (isPython) {
    hasTests = filePaths.some((p) => /(?:conftest\.py|test_.*\.py|\/tests?\/)/i.test(p));
    testDetail = hasTests ? 'Pytest / unittest suite detected in repository tree.' : 'No automated Python test files detected.';
  } else if (isNode) {
    const testScript = packageJson?.scripts?.test;
    hasTests = Boolean(testScript && !testScript.includes('no test specified'));
    testDetail = hasTests ? `Configured npm test script: '${testScript}'` : 'Define a valid test script in package.json.';
  } else {
    hasTests = filePaths.some((p) => /(?:test|spec)/i.test(p));
    testDetail = hasTests ? 'Test files detected in tree.' : 'No test files detected.';
  }

  checks.push({
    id: 'test-script',
    label: 'Automated Test Harness',
    passed: hasTests,
    status: hasTests ? 'PASS' : 'WARNING',
    remediation: testDetail
  });

  // Check 4: CI Workflows
  const hasCI = filePaths.some((p) => /(?:^|\/)\.github\/workflows\/.*\.ya?ml$/i.test(p));
  checks.push({
    id: 'ci-workflow',
    label: 'GitHub Actions CI Automation',
    passed: hasCI,
    status: hasCI ? 'PASS' : 'WARNING',
    remediation: hasCI
      ? 'Automated GitHub Actions CI workflows found.'
      : 'Set up an automated GitHub Actions CI workflow to run test suites on pull requests.'
  });

  // Check 5: .gitignore
  const hasGitignore = filePaths.some((p) => /(?:^|\/)\.gitignore$/i.test(p));
  checks.push({
    id: 'gitignore',
    label: 'Git Exclusion Rules (.gitignore)',
    passed: hasGitignore,
    status: hasGitignore ? 'PASS' : 'WARNING',
    remediation: hasGitignore
      ? '.gitignore exclusion rules are present.'
      : 'Add a .gitignore file to exclude build artifacts, virtual environments, and secrets.'
  });

  // Check 6: Open Source License
  const hasLicense = filePaths.some((p) => /(?:^|\/)(?:LICENSE|LICENSE\.md|COPYING)$/i.test(p));
  checks.push({
    id: 'license-file',
    label: 'Repository License',
    passed: hasLicense,
    status: hasLicense ? 'PASS' : 'WARNING',
    remediation: hasLicense
      ? 'Open source license file present in root.'
      : 'Add an open-source LICENSE file (e.g. MIT, Apache 2.0) to clarify terms of use.'
  });

  const passedCount = checks.filter((c) => c.status === 'PASS').length;
  const totalCount = checks.length;
  const hygieneScore = Math.round((passedCount / totalCount) * 100);

  let overallRating = 'Good';
  if (hygieneScore >= 95) overallRating = 'Excellent';
  else if (hygieneScore >= 80) overallRating = 'Strong';
  else if (hygieneScore < 60) overallRating = 'Needs Attention';

  return {
    hygieneScore,
    overallRating,
    passedCount,
    totalCount,
    checks,
    disclaimer: 'Setup Doctor performs diagnostic static checks on repository manifests and structural files without executing commands.'
  };
}
