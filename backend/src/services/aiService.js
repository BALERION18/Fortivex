import { redactSecretsBeforeAI } from './redactionService.js';

/**
 * AI Q&A Service
 * Answers developer inquiries regarding the codebase.
 * Strictly grounds answers in analyzed files, pins links to commit SHAs,
 * separates Verified Facts vs Inferences vs Unknowns,
 * and redacts credentials before prompt evaluation.
 */
export async function answerCodebaseQuery({
  query,
  owner,
  repo,
  commitSha = 'HEAD',
  files = [],
  architecture = null
}) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query string is required');
  }

  // 1. Enforce length limits on user input to prevent prompt injection / memory abuse
  const MAX_QUERY_LEN = 500;
  const trimmedQuery = query.trim().slice(0, MAX_QUERY_LEN);

  // 2. Scan and redact user query before processing
  const querySanitization = redactSecretsBeforeAI(trimmedQuery);
  if (!querySanitization.safe) {
    throw new Error(querySanitization.error || 'Failed to safely sanitize input query.');
  }
  const cleanQuery = querySanitization.text;

  // 3. Retrieve relevant files based on query keywords
  const keywords = cleanQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const relevantFiles = [];

  for (const f of files) {
    if (!f.content || f.skipped) continue;

    // MANDATORY SAFETY: Redact credentials before using content in AI context
    const contentSanitization = redactSecretsBeforeAI(f.content);
    if (!contentSanitization.safe) {
      // Content could not be safely scrubbed: drop file completely from AI context
      continue;
    }

    const lowerPath = f.path.toLowerCase();
    const lowerContent = contentSanitization.text.toLowerCase();

    const matchesKeyword = keywords.some((k) => lowerPath.includes(k) || lowerContent.includes(k));
    if (matchesKeyword || lowerPath.includes('readme') || lowerPath.includes('package.json')) {
      relevantFiles.push({
        path: f.path,
        content: contentSanitization.text,
        lines: contentSanitization.text.split('\n')
      });
    }
  }

  // Bounded context: max 5 most relevant files
  const topFiles = relevantFiles.slice(0, 5);

  // 4. Extract citations and grounded line references
  const citations = [];
  const lowerQuery = cleanQuery.toLowerCase();

  // Search for line matches
  for (const f of topFiles) {
    for (let idx = 0; idx < f.lines.length; idx++) {
      const line = f.lines[idx];
      const matchFound = keywords.some((k) => line.toLowerCase().includes(k) && k.length > 3);
      if (matchFound) {
        citations.push({
          file: f.path,
          line: idx + 1,
          snippet: line.trim().slice(0, 120),
          commitUrl: `https://github.com/${owner}/${repo}/blob/${commitSha}/${f.path}#L${idx + 1}`
        });
        if (citations.length >= 8) break;
      }
    }
    if (citations.length >= 8) break;
  }

  // 5. Structure grounded answer (separating Facts, Inferences, Unknowns)
  const verifiedFacts = [];
  const inferences = [];
  const unknowns = [];

  // Determine subject of inquiry
  if (lowerQuery.includes('test') || lowerQuery.includes('testing')) {
    const testCmd = architecture?.setupGuide?.testCommand;
    if (testCmd) {
      verifiedFacts.push(`Test command declared in manifest: \`${testCmd}\`.`);
    } else {
      unknowns.push('No automated test runner script found in scanned manifests.');
    }
    const testFiles = files.filter((f) => f.path.match(/(?:test|spec)/i));
    if (testFiles.length > 0) {
      verifiedFacts.push(`Found ${testFiles.length} test-related files (e.g., ${testFiles.slice(0, 3).map((f) => f.path).join(', ')}).`);
    }
  } else if (lowerQuery.includes('route') || lowerQuery.includes('endpoint') || lowerQuery.includes('api')) {
    const routes = architecture?.routes || [];
    if (routes.length > 0) {
      verifiedFacts.push(`Discovered ${routes.length} concrete API route declarations.`);
      routes.slice(0, 4).forEach((r) => {
        verifiedFacts.push(`${r.method} ${r.path} in \`${r.file}:${r.line}\``);
      });
    } else {
      unknowns.push('No HTTP route declarations matching Express/FastAPI/Next.js syntax were found in scanned files.');
    }
  } else if (lowerQuery.includes('database') || lowerQuery.includes('schema') || lowerQuery.includes('db') || lowerQuery.includes('sql')) {
    const schemas = architecture?.schemas || [];
    if (schemas.length > 0) {
      verifiedFacts.push(`Discovered ${schemas.length} database entities.`);
      schemas.forEach((s) => {
        verifiedFacts.push(`${s.type} '${s.name}' in \`${s.file}:${s.line}\``);
      });
    } else {
      unknowns.push('No database schemas (Prisma, SQL, Mongoose) discovered in scanned files.');
    }
  } else if (lowerQuery.includes('install') || lowerQuery.includes('setup') || lowerQuery.includes('run')) {
    if (architecture?.setupGuide) {
      verifiedFacts.push(`Installation command: \`${architecture.setupGuide.installCommand}\``);
      verifiedFacts.push(`Development run command: \`${architecture.setupGuide.runDevCommand}\``);
    }
  } else {
    // General overview inquiry
    verifiedFacts.push(`Repository primary language: ${architecture?.manifest?.type || 'Standard source'}.`);
    if (architecture?.purpose) {
      verifiedFacts.push(`Identified purpose: ${architecture.purpose}`);
    }
    inferences.push('Analysis based on inspected configuration files, manifests, and Git tree hierarchy.');
  }

  // Construct comprehensive answer text
  const answerIntro = `Based on the repository analysis pinned to commit **${commitSha.substring(0, 7)}**:`;
  const factsList = verifiedFacts.length > 0 ? verifiedFacts.map((f) => `- ${f}`).join('\n') : '- No direct syntax fact matched this query.';
  const inferencesList = inferences.length > 0 ? inferences.map((i) => `- ${i}`).join('\n') : '- No speculative architectural inferences required.';
  const unknownsList = unknowns.length > 0 ? unknowns.map((u) => `- ${u}`).join('\n') : '- No critical gaps identified for this query.';

  const fullAnswer = `${answerIntro}\n\n### Verified Facts\n${factsList}\n\n### Architectural Inferences\n${inferencesList}\n\n### Unknowns & Limitations\n${unknownsList}`;

  return {
    query: cleanQuery,
    commitSha,
    answer: fullAnswer,
    citations,
    epistemicTriad: {
      verifiedFacts,
      inferences,
      unknowns
    }
  };
}
