import { scanRepositoryFiles } from './secretScanner.js';

/**
 * High-Risk Code Safety Anti-Pattern Catalog.
 * Scans candidate source code files for dangerous shell executions, dynamic evaluation,
 * disabled certificate verification, and overly permissive network rules.
 */
const CODE_SAFETY_RULES = [
  {
    id: 'cmd-injection-node',
    title: 'Direct Terminal Command Execution (Node.js)',
    category: 'Code Safety',
    languages: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    regex: /(?:child_process|cp)\s*\.\s*(?:exec|execSync)\s*\(/g,
    severity: 'HIGH',
    simpleDescription: 'System terminal commands are executed directly in code. If user input reaches this command without strict validation, attackers could execute arbitrary commands on your server.',
    simpleFix: 'Use parameterized execution (like execFile) with an arguments array instead of running raw shell strings. Never concatenate user input into terminal commands.'
  },
  {
    id: 'cmd-injection-python',
    title: 'Direct Terminal Command Execution (Python)',
    languages: ['.py'],
    category: 'Code Safety',
    regex: /(?:\bos\s*\.\s*(?:system|popen)|subprocess\s*\.\s*(?:Popen|call|run|check_output|check_call)\s*\([^)]*shell\s*=\s*True)/g,
    severity: 'HIGH',
    simpleDescription: 'Commands are executed through the operating system shell. If untrusted input is included, an attacker can append extra shell commands to compromise the host.',
    simpleFix: 'Avoid shell=True in subprocess calls. Pass commands as a list of arguments (e.g., subprocess.run(["command", arg1, arg2])) and avoid os.system().'
  },
  {
    id: 'unsafe-eval-js',
    title: 'Dynamic Code Evaluation (eval / new Function)',
    category: 'Code Safety',
    languages: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    regex: /\b(?:eval|new\s+Function)\s*\(/g,
    severity: 'HIGH',
    simpleDescription: 'Running code dynamically from strings allows attackers to inject and run malicious scripts if untrusted data reaches the function.',
    simpleFix: 'Avoid eval() and new Function(). For reading structured data, use JSON.parse() or dedicated parser libraries.'
  },
  {
    id: 'unsafe-eval-python',
    title: 'Dynamic Code Evaluation / Unsafe Deserialization (Python)',
    languages: ['.py'],
    regex: /(?:\b(?:eval|exec)\s*\(|\bpickle\s*\.\s*loads\s*\(|\byaml\s*\.\s*load\s*\([^)]*(?!Loader\s*=\s*(?:yaml\.)?SafeLoader))/g,
    severity: 'HIGH',
    simpleDescription: 'Using eval(), exec(), or unpickling data from untrusted sources allows arbitrary code execution on the server.',
    simpleFix: 'Avoid eval/exec. Never load pickle data from external users. Use yaml.safe_load() instead of yaml.load().'
  },
  {
    id: 'disabled-tls-node',
    title: 'Disabled SSL/TLS Certificate Verification (Node.js)',
    category: 'Code Safety',
    languages: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.env'],
    regex: /(?:rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?)/gi,
    severity: 'HIGH',
    simpleDescription: 'SSL/TLS certificate checking is turned off. This allows attackers on the same network to intercept or tamper with encrypted API requests (Man-in-the-Middle attack).',
    simpleFix: 'Remove rejectUnauthorized: false and ensure all external services use valid, trusted SSL/TLS certificates.'
  },
  {
    id: 'disabled-tls-python',
    title: 'Disabled SSL/TLS Certificate Verification (Python)',
    category: 'Code Safety',
    languages: ['.py', '.env'],
    regex: /\bverify\s*=\s*False\b/g,
    severity: 'HIGH',
    simpleDescription: 'HTTP requests are set to skip HTTPS certificate validation. Anyone between your server and the target can inspect or modify the traffic.',
    simpleFix: 'Remove verify=False from requests and httpx calls, and install valid trusted CA certificates.'
  },
  {
    id: 'cors-wildcard',
    title: 'Overly Permissive Cross-Origin Access (CORS: *)',
    category: 'Code Safety',
    languages: ['.js', '.ts', '.py'],
    regex: /(?:['"]?Access-Control-Allow-Origin['"]?\s*:\s*['"]\*['"]|origin\s*:\s*['"]\*['"])/gi,
    severity: 'MEDIUM',
    simpleDescription: 'Allowing all origins (*) permits any external website visited by your users to make requests to your API.',
    simpleFix: 'Restrict allowed origins to your specific trusted frontend domains rather than using wildcard "*".'
  },
  {
    id: 'debug-mode-active',
    title: 'Debug Mode Enabled in Configuration',
    category: 'Code Safety',
    languages: ['.py', '.js', '.json', '.env', '.toml'],
    regex: /(?:\bDEBUG\s*=\s*True\b|\bdebug\s*:\s*true\b)/g,
    severity: 'LOW',
    simpleDescription: 'Debug mode displays detailed stack traces, environment variables, and internal code paths when errors occur, helping attackers probe your system.',
    simpleFix: 'Ensure DEBUG is set to False (or NODE_ENV=production) in production configurations.'
  }
];

/**
 * Inspects source code candidate files for high-risk code safety anti-patterns.
 */
function scanCodeSafety(candidateFiles = []) {
  const findings = [];

  for (const fileObj of candidateFiles) {
    if (!fileObj || !fileObj.content || !fileObj.path) continue;
    const path = fileObj.path;
    const lowerPath = path.toLowerCase();

    // Skip test fixtures or test directories for certain warnings to avoid false positives
    const isTestFile = lowerPath.includes('test') || lowerPath.includes('spec') || lowerPath.includes('fixture');

    for (const rule of CODE_SAFETY_RULES) {
      if (rule.id === 'debug-mode-active' && isTestFile) continue;

      const matchesExt = rule.languages.some((ext) => lowerPath.endsWith(ext));
      if (!matchesExt) continue;

      const lines = fileObj.content.split(/\r?\n/);
      lines.forEach((lineText, lineIdx) => {
        // Reset regex state
        rule.regex.lastIndex = 0;
        if (rule.regex.test(lineText)) {
          findings.push({
            ruleId: rule.id,
            title: rule.title,
            category: rule.category,
            severity: rule.severity,
            file: path,
            line: lineIdx + 1,
            codeSnippet: lineText.trim().substring(0, 120),
            simpleDescription: rule.simpleDescription,
            simpleFix: rule.simpleFix
          });
        }
      });
    }
  }

  return findings;
}

/**
 * Inspects GitHub Actions CI/CD workflows for dangerous triggers, unpinned actions, and broad permissions.
 */
function scanCiCdHardening(tree = [], candidateFiles = []) {
  const findings = [];
  const workflowBlobs = tree.filter((t) => t.path.toLowerCase().startsWith('.github/workflows/') && (t.path.endsWith('.yml') || t.path.endsWith('.yaml')));

  let hasWorkflows = workflowBlobs.length > 0;
  let hasSastAction = false;

  for (const fileObj of candidateFiles) {
    if (!fileObj || !fileObj.path) continue;
    const path = fileObj.path;
    if (!path.toLowerCase().startsWith('.github/workflows/')) continue;

    const content = fileObj.content || '';

    // 1. Check for automated SAST / security tool actions
    if (
      content.includes('codeql-action') ||
      content.includes('snyk') ||
      content.includes('trivy') ||
      content.includes('sonarqube') ||
      content.includes('semgrep') ||
      content.includes('gitleaks')
    ) {
      hasSastAction = true;
    }

    // 2. Check for dangerous pull_request_target PWN request trigger
    if (content.includes('pull_request_target')) {
      findings.push({
        ruleId: 'cicd-pull-request-target',
        title: 'Dangerous CI Trigger: pull_request_target',
        category: 'CI/CD Pipeline',
        severity: 'CRITICAL',
        file: path,
        simpleDescription: 'Using pull_request_target grants repository write tokens and secrets to pull request events. If an external pull request code checkout is executed, an attacker can steal your repository secrets.',
        simpleFix: 'Use the standard pull_request trigger instead, or do not checkout untrusted pull request code with write permissions.'
      });
    }

    // 3. Check for unpinned moving branch actions (@master or @main)
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const match = line.match(/uses:\s*([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+)@(master|main|latest)\b/i);
      if (match) {
        findings.push({
          ruleId: 'cicd-unpinned-action',
          title: `Unpinned 3rd-Party GitHub Action: ${match[1]}@${match[2]}`,
          category: 'CI/CD Pipeline',
          severity: 'MEDIUM',
          file: path,
          line: idx + 1,
          codeSnippet: line.trim(),
          simpleDescription: `This action references a moving branch (@${match[2]}). If the author's account or repo is compromised, attacker code will immediately run in your CI pipeline.`,
          simpleFix: 'Pin the action to an immutable commit SHA (e.g. uses: action/name@4b2...8a) or a specific release tag (e.g. @v4).'
        });
      }
    });

    // 4. Check for overprivileged write-all permissions
    if (/permissions:\s*write-all/i.test(content)) {
      findings.push({
        ruleId: 'cicd-write-all-permissions',
        title: 'Excessive Workflow Permissions: write-all',
        category: 'CI/CD Pipeline',
        severity: 'MEDIUM',
        file: path,
        simpleDescription: 'The workflow requests full write access to all repository resources. If a build step is compromised, the attacker can alter code, releases, and repository settings.',
        simpleFix: 'Use the principle of least privilege. Grant only needed permissions (e.g., permissions: contents: read).'
      });
    }
  }

  // Checklist item: Automated SAST in CI
  const sastCheck = {
    ruleId: 'cicd-sast-workflow',
    title: 'Automated Security Scanner in CI/CD',
    category: 'CI/CD Pipeline',
    status: hasSastAction ? 'PASS' : 'WARN',
    severity: hasSastAction ? 'LOW' : 'LOW',
    simpleDescription: hasSastAction
      ? 'Automated security/SAST workflows (CodeQL, Semgrep, Trivy, or Snyk) were detected in .github/workflows/.'
      : 'No automated security scanner (like GitHub CodeQL or Semgrep) is configured to inspect code on pull requests.',
    simpleFix: 'Add GitHub CodeQL (.github/workflows/codeql.yml) to automatically catch vulnerabilities before merging.'
  };

  return { findings, sastCheck, hasWorkflows };
}

/**
 * Inspects Supply Chain Defense: Lockfile integrity, Dependabot, and floating dependency wildcards.
 */
function scanSupplyChain(tree = [], candidateFiles = []) {
  const treePaths = tree.map((t) => t.path.toLowerCase());
  const findings = [];

  // 1. Lockfile Check
  const hasNpmPkg = treePaths.some((p) => p.endsWith('package.json'));
  const hasNpmLock = treePaths.some((p) => p.endsWith('package-lock.json') || p.endsWith('yarn.lock') || p.endsWith('pnpm-lock.yaml'));

  const hasPythonManifest = treePaths.some((p) => p.endsWith('requirements.txt') || p.endsWith('pyproject.toml'));
  const hasPythonLock = treePaths.some((p) => p.endsWith('poetry.lock') || p.endsWith('pipfile.lock'));

  const hasCargoManifest = treePaths.some((p) => p.endsWith('cargo.toml'));
  const hasCargoLock = treePaths.some((p) => p.endsWith('cargo.lock'));

  let lockfileOk = true;
  let lockfileMissingDesc = '';

  if (hasNpmPkg && !hasNpmLock) {
    lockfileOk = false;
    lockfileMissingDesc = 'Node.js package.json is present, but package-lock.json / yarn.lock is not committed.';
  } else if (hasCargoManifest && !hasCargoLock) {
    lockfileOk = false;
    lockfileMissingDesc = 'Rust Cargo.toml is present, but Cargo.lock is not committed.';
  }

  const lockfileCheck = {
    ruleId: 'supply-chain-lockfile',
    title: 'Lockfile for Reproducible Builds',
    category: 'Supply Chain',
    status: lockfileOk ? 'PASS' : 'WARN',
    severity: lockfileOk ? 'LOW' : 'MEDIUM',
    simpleDescription: lockfileOk
      ? 'Committed dependency lockfiles ensure exact package versions are installed across all machines, preventing dependency hijacking.'
      : lockfileMissingDesc || 'No lockfile committed. Builds might download newer, untested or compromised dependencies.',
    simpleFix: 'Commit your project lockfile (package-lock.json, poetry.lock, Cargo.lock, etc.) to version control.'
  };

  // 2. Dependabot / Automated Dependency Update check
  const hasDependabot = treePaths.some(
    (p) =>
      p === '.github/dependabot.yml' ||
      p === '.github/dependabot.yaml' ||
      p === 'renovate.json' ||
      p.endsWith('.renovaterc') ||
      p.endsWith('.renovaterc.json')
  );

  const dependabotCheck = {
    ruleId: 'supply-chain-dependabot',
    title: 'Automated Dependency Vulnerability Alerts (Dependabot)',
    category: 'Supply Chain',
    status: hasDependabot ? 'PASS' : 'WARN',
    severity: hasDependabot ? 'LOW' : 'MEDIUM',
    simpleDescription: hasDependabot
      ? 'Automated dependency update scanner (.github/dependabot.yml or Renovate) is configured.'
      : 'Automated dependency scanning is unconfigured. Vulnerable third-party libraries might go unpatched.',
    simpleFix: 'Add a .github/dependabot.yml configuration file to receive automated pull requests for security vulnerabilities.'
  };

  // 3. Check for wildcard dependencies in package.json
  const pkgFile = candidateFiles.find((f) => f.path.endsWith('package.json'));
  if (pkgFile && pkgFile.content) {
    try {
      const parsed = JSON.parse(pkgFile.content);
      const allDeps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
      const wildcards = Object.entries(allDeps).filter(([_, version]) => version === '*' || version === 'latest');
      if (wildcards.length > 0) {
        findings.push({
          ruleId: 'supply-chain-wildcard-dep',
          title: `Wildcard Dependency Version: ${wildcards.map(([k]) => k).slice(0, 3).join(', ')}`,
          category: 'Supply Chain',
          severity: 'MEDIUM',
          file: pkgFile.path,
          simpleDescription: 'Using wildcard "*" or "latest" automatically installs any new package release without review, exposing you to supply chain takeovers.',
          simpleFix: 'Pin dependencies to specific version numbers (e.g. "express": "^4.19.2") rather than "*".'
        });
      }
    } catch {}
  }

  return { lockfileCheck, dependabotCheck, findings };
}

/**
 * Inspects Security Governance: SECURITY.md policy, CODEOWNERS, and .gitignore.
 */
function scanSecurityGovernance(tree = []) {
  const treePaths = tree.map((t) => t.path.toLowerCase());

  // 1. SECURITY.md
  const hasSecurityPolicy = treePaths.some((p) => p === 'security.md' || p === '.github/security.md' || p === 'docs/security.md');

  const securityPolicyCheck = {
    ruleId: 'gov-security-policy',
    title: 'Security Vulnerability Disclosure Policy (SECURITY.md)',
    category: 'Governance',
    status: hasSecurityPolicy ? 'PASS' : 'WARN',
    severity: hasSecurityPolicy ? 'LOW' : 'LOW',
    simpleDescription: hasSecurityPolicy
      ? 'SECURITY.md provides security researchers with a responsible, confidential way to disclose vulnerabilities.'
      : 'No SECURITY.md found. Researchers who discover bugs have no private contact method, increasing the risk of public disclosure.',
    simpleFix: 'Add a SECURITY.md file in your repository root or .github/ folder with an email address for reporting security issues.'
  };

  // 2. CODEOWNERS
  const hasCodeOwners = treePaths.some((p) => p === 'codeowners' || p === '.github/codeowners' || p === 'docs/codeowners');

  const codeOwnersCheck = {
    ruleId: 'gov-codeowners',
    title: 'Code Ownership & Review Enforcement (CODEOWNERS)',
    category: 'Governance',
    status: hasCodeOwners ? 'PASS' : 'INFO',
    severity: 'LOW',
    simpleDescription: hasCodeOwners
      ? 'CODEOWNERS automatically assigns designated engineers to review changes to sensitive paths.'
      : 'No CODEOWNERS file detected. Peer reviews on critical security paths are not automatically assigned.',
    simpleFix: 'Add a .github/CODEOWNERS file to automatically assign senior reviewers to security-sensitive directories.'
  };

  // 3. .gitignore
  const hasGitignore = treePaths.some((p) => p === '.gitignore');

  const gitignoreCheck = {
    ruleId: 'gov-gitignore',
    title: 'Git Exclusion Rules (.gitignore)',
    category: 'Governance',
    status: hasGitignore ? 'PASS' : 'WARN',
    severity: hasGitignore ? 'LOW' : 'MEDIUM',
    simpleDescription: hasGitignore
      ? '.gitignore exclusion rules are present to prevent accidental commits of local environment variables and build artifacts.'
      : 'No .gitignore file detected in repository root. Local secrets, node_modules, or credentials could accidentally be committed.',
    simpleFix: 'Add a standard .gitignore file to exclude .env files, credentials, and build directories.'
  };

  return { securityPolicyCheck, codeOwnersCheck, gitignoreCheck };
}

/**
 * Computes an overall Security Score (0 to 100), Letter Grade, and 5-pillar breakdown.
 */
function calculateSecurityScore(allFindings, allChecks) {
  let score = 100;

  // Deduct for findings by severity
  allFindings.forEach((f) => {
    if (f.severity === 'CRITICAL') score -= 25;
    else if (f.severity === 'HIGH') score -= 12;
    else if (f.severity === 'MEDIUM') score -= 5;
    else if (f.severity === 'LOW') score -= 2;
  });

  // Deduct for failed checks
  allChecks.forEach((c) => {
    if (c.status === 'WARN') {
      if (c.severity === 'MEDIUM') score -= 6;
      else score -= 3;
    }
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade = 'A+';
  let riskTier = 'LOW';
  if (score >= 95) {
    grade = 'A+';
    riskTier = 'LOW';
  } else if (score >= 85) {
    grade = 'A';
    riskTier = 'LOW';
  } else if (score >= 70) {
    grade = 'B';
    riskTier = 'MODERATE';
  } else if (score >= 50) {
    grade = 'C';
    riskTier = 'ELEVATED';
  } else {
    grade = 'F';
    riskTier = 'CRITICAL';
  }

  return { score, grade, riskTier };
}

/**
 * Main unified security evaluation function.
 * Evaluates repository against secrets, supply chain, CI/CD hardening, code injection, and governance.
 *
 * @param {Array} tree - Git tree entries
 * @param {Array} candidateFiles - Array of { path, content }
 * @param {string} commitSha - Pinned commit SHA
 * @returns {Object} Complete unified security report
 */
export function auditRepositorySecurity(tree = [], candidateFiles = [], commitSha = 'HEAD') {
  // 1. Secrets & Credentials Scan (Gitleaks)
  const secretReport = scanRepositoryFiles(candidateFiles, commitSha);
  const secretFindings = (secretReport.findings || []).map((f) => ({
    ruleId: f.ruleId,
    ruleName: f.ruleName,
    maskedSecret: f.maskedSecret,
    remediation: f.remediation,
    title: `Exposed Credential: ${f.ruleName}`,
    category: 'Secrets & Keys',
    severity: f.severity,
    file: f.file,
    line: f.line,
    codeSnippet: f.maskedSecret,
    simpleDescription: `A high-confidence credential (${f.ruleName}) was detected in candidate files. If exposed, attackers can access your accounts, cloud infrastructure, or private APIs.`,
    simpleFix: f.remediation || 'Revoke and rotate this credential immediately at the provider, and purge it from Git history.'
  }));

  // 2. Code Safety & Injection Scan (SAST)
  const codeSafetyFindings = scanCodeSafety(candidateFiles);

  // 3. CI/CD Hardening Scan
  const { findings: cicdFindings, sastCheck } = scanCiCdHardening(tree, candidateFiles);

  // 4. Supply Chain Defense
  const { lockfileCheck, dependabotCheck, findings: supplyChainFindings } = scanSupplyChain(tree, candidateFiles);

  // 5. Security Governance
  const { securityPolicyCheck, codeOwnersCheck, gitignoreCheck } = scanSecurityGovernance(tree);

  // Aggregate all findings and checks
  const allFindings = [...secretFindings, ...codeSafetyFindings, ...cicdFindings, ...supplyChainFindings];
  const allChecks = [sastCheck, lockfileCheck, dependabotCheck, securityPolicyCheck, codeOwnersCheck, gitignoreCheck];

  // Calculate score and grade
  const { score, grade, riskTier } = calculateSecurityScore(allFindings, allChecks);

  // Categorize findings into 5 Pillars
  const pillars = [
    {
      id: 'secrets',
      name: 'Secrets & Keys',
      icon: 'Key',
      score: secretFindings.length === 0 ? 100 : Math.max(0, 100 - secretFindings.length * 30),
      findingsCount: secretFindings.length,
      status: secretFindings.length === 0 ? 'SAFE' : 'CRITICAL',
      description: secretFindings.length === 0 ? 'Zero exposed API keys, tokens, or private keys detected.' : `${secretFindings.length} credential template(s) or keys detected.`
    },
    {
      id: 'code-safety',
      name: 'Code Safety & Injections',
      icon: 'ShieldAlert',
      score: codeSafetyFindings.length === 0 ? 100 : Math.max(0, 100 - codeSafetyFindings.length * 15),
      findingsCount: codeSafetyFindings.length,
      status: codeSafetyFindings.length === 0 ? 'SAFE' : codeSafetyFindings.some((f) => f.severity === 'HIGH') ? 'WARN' : 'INFO',
      description: codeSafetyFindings.length === 0 ? 'No dangerous shell executions, dynamic eval, or insecure TLS flags found.' : `${codeSafetyFindings.length} code safety notice(s) identified.`
    },
    {
      id: 'supply-chain',
      name: 'Supply Chain & Dependencies',
      icon: 'Package',
      score: (lockfileCheck.status === 'PASS' ? 50 : 0) + (dependabotCheck.status === 'PASS' ? 50 : 20) - supplyChainFindings.length * 10,
      findingsCount: supplyChainFindings.length + (lockfileCheck.status !== 'PASS' ? 1 : 0) + (dependabotCheck.status !== 'PASS' ? 1 : 0),
      status: lockfileCheck.status === 'PASS' && dependabotCheck.status === 'PASS' && supplyChainFindings.length === 0 ? 'SAFE' : 'WARN',
      description: lockfileCheck.status === 'PASS' ? 'Lockfile committed; reproducible build manifests verified.' : 'Lockfile or automated dependency scanning recommended.'
    },
    {
      id: 'cicd',
      name: 'CI/CD Pipeline Hardening',
      icon: 'Zap',
      score: cicdFindings.length === 0 ? (sastCheck.status === 'PASS' ? 100 : 85) : Math.max(0, 70 - cicdFindings.length * 20),
      findingsCount: cicdFindings.length,
      status: cicdFindings.length === 0 ? 'SAFE' : cicdFindings.some((f) => f.severity === 'CRITICAL') ? 'CRITICAL' : 'WARN',
      description: cicdFindings.length === 0 ? 'Workflow triggers and action dependencies adhere to baseline security.' : `${cicdFindings.length} CI/CD configuration risk(s) flagged.`
    },
    {
      id: 'governance',
      name: 'Security Governance',
      icon: 'FileCheck',
      score: (securityPolicyCheck.status === 'PASS' ? 40 : 15) + (gitignoreCheck.status === 'PASS' ? 40 : 10) + (codeOwnersCheck.status === 'PASS' ? 20 : 15),
      findingsCount: (securityPolicyCheck.status !== 'PASS' ? 1 : 0) + (gitignoreCheck.status !== 'PASS' ? 1 : 0),
      status: securityPolicyCheck.status === 'PASS' && gitignoreCheck.status === 'PASS' ? 'SAFE' : 'WARN',
      description: securityPolicyCheck.status === 'PASS' ? 'Vulnerability disclosure policy and git exclusions verified.' : 'SECURITY.md disclosure policy recommended.'
    }
  ];

  // Plain-language summary
  let summary = '';
  if (score >= 90) {
    summary = 'Strong security posture. No high-risk secrets or dangerous code execution patterns detected.';
  } else if (score >= 75) {
    summary = 'Good baseline protection. Recommended addressing minor supply-chain or workflow hygiene recommendations.';
  } else if (score >= 50) {
    summary = 'Moderate risk detected. Action recommended on code safety, dependency lockfiles, or workflow permissions.';
  } else {
    summary = 'High risk detected. Immediate attention required to address critical credentials or dangerous pipeline triggers.';
  }

  // Count severities
  const criticalCount = allFindings.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = allFindings.filter((f) => f.severity === 'HIGH').length;
  const mediumCount = allFindings.filter((f) => f.severity === 'MEDIUM').length;
  const lowCount = allFindings.filter((f) => f.severity === 'LOW').length;

  return {
    score,
    grade,
    riskTier,
    summary,
    pillars,
    // Backward-compatible fields
    totalFindings: secretReport.totalFindings,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    findings: allFindings,
    checks: allChecks,
    disclaimer: 'This audit uses zero-execution static pattern matching and GitHub metadata. A clean score indicates no known high-risk signatures were matched; it does not guarantee total immunity from all application vulnerabilities.'
  };
}
