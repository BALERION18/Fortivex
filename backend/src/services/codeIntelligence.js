/**
 * Code Intelligence & Architecture Analyzer
 * Implements DeepWiki-style living codebase analysis.
 *
 * Strict Epistemic Boundaries:
 * - Verified Facts: Backed by manifest, README, or code syntax evidence.
 * - Inferences: Deductions derived from recognized architectural patterns.
 * - Unknowns: Elements not visible or indeterminate in inspected files.
 *
 * Discovery of API routes and Database schemas occurs ONLY when evidence exists.
 */

/**
 * Extracts dependency and script information from package.json, requirements.txt, or go.mod.
 */
export function analyzeManifest(filePath, content) {
  if (!content || typeof content !== 'string') return null;

  if (filePath.endsWith('package.json')) {
    try {
      const pkg = JSON.parse(content);
      return {
        type: 'npm',
        language: 'JavaScript / TypeScript',
        file: filePath,
        name: pkg.name || 'unnamed',
        version: pkg.version || '1.0.0',
        description: pkg.description || '',
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        scripts: pkg.scripts || {},
        main: pkg.main
      };
    } catch {
      return { type: 'npm', language: 'JavaScript', file: filePath, error: 'Malformed package.json' };
    }
  }

  if (filePath.endsWith('requirements.txt')) {
    const deps = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('-'))
      .map((l) => l.split(/[=<>~;\[]/)[0].trim())
      .filter(Boolean);
    return {
      type: 'pip',
      language: 'Python',
      file: filePath,
      name: filePath.includes('backend') ? 'backend-python' : 'python-app',
      version: '1.0.0',
      dependencies: deps,
      devDependencies: [],
      scripts: {}
    };
  }

  if (filePath.endsWith('pyproject.toml')) {
    const deps = [];
    const lines = content.split('\n');
    let inDeps = false;
    for (const line of lines) {
      if (line.includes('[project.dependencies]') || line.includes('[tool.poetry.dependencies]')) {
        inDeps = true;
        continue;
      }
      if (inDeps) {
        if (line.startsWith('[')) {
          inDeps = false;
          continue;
        }
        const trimmed = line.trim().replace(/[",']/g, '');
        if (trimmed && !trimmed.startsWith('#')) {
          deps.push(trimmed.split(/[=<>~]/)[0].trim());
        }
      }
    }
    return {
      type: 'pyproject',
      language: 'Python',
      file: filePath,
      name: 'python-project',
      dependencies: deps,
      devDependencies: [],
      scripts: {}
    };
  }

  if (filePath.endsWith('go.mod')) {
    const requires = content
      .split('\n')
      .filter((l) => l.trim().startsWith('require') || l.includes('=>'))
      .map((l) => l.trim());
    return {
      type: 'go',
      language: 'Go',
      file: filePath,
      name: 'go-module',
      dependencies: requires,
      devDependencies: [],
      scripts: {}
    };
  }

  return null;
}

/**
 * Deduplicates API routes by HTTP method + normalized path.
 * Retains source file & line locations and occurrences count.
 */
export function deduplicateRoutes(routes = []) {
  if (!Array.isArray(routes)) return [];
  const seen = new Map();

  for (const r of routes) {
    if (!r || !r.path) continue;
    const method = (r.method || 'GET').toUpperCase();
    // Normalize path: lowercase, collapse duplicate slashes, remove trailing slash unless root '/'
    const normalizedPath = r.path.trim().replace(/\/+/g, '/').replace(/(.)\/+$/, '$1') || '/';
    const key = `${method} ${normalizedPath}`;

    if (!seen.has(key)) {
      seen.set(key, {
        ...r,
        method,
        path: normalizedPath,
        occurrences: 1,
        locations: [`${r.file}:${r.line}`]
      });
    } else {
      const existing = seen.get(key);
      existing.occurrences = (existing.occurrences || 1) + 1;
      const loc = `${r.file}:${r.line}`;
      if (!existing.locations.includes(loc)) {
        existing.locations.push(loc);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Discovers API routes from code files ONLY when concrete syntax evidence exists.
 * Deduplicates routes to ensure each unique HTTP method + path appears cleanly.
 */
export function discoverApiRoutes(files = [], commitSha = 'HEAD') {
  const rawRoutes = [];

  // Patterns for Express, Next.js, and FastAPI/Flask
  const expressRouteRegex = /(?:router|app)\.(get|post|put|delete|patch|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  const flaskFastApiRouteRegex = /@(?:app|router|api)\.(get|post|put|delete|patch|api_route)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

  for (const file of files) {
    if (!file.content || file.skipped) continue;
    const lines = file.content.split('\n');

    // 1. Next.js App Router API routes (route.js / route.ts)
    if (file.path.includes('/api/') && file.path.match(/route\.[jt]sx?$/)) {
      const cleanPath = file.path
        .replace(/^.*\/api\//, '/api/')
        .replace(/\/route\.[jt]sx?$/, '');
      rawRoutes.push({
        method: 'ANY',
        path: cleanPath,
        file: file.path,
        line: 1,
        source: 'Next.js App Router',
        description: 'Next.js serverless route handler',
        commitUrl: `https://github.com/blob/${commitSha}/${file.path}#L1`
      });
      continue;
    }

    // 2. Scan lines for Express, Koa, and FastAPI/Flask route declarations
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Express / Router
      let match;
      const expRegex = new RegExp(expressRouteRegex.source, expressRouteRegex.flags);
      while ((match = expRegex.exec(line)) !== null) {
        rawRoutes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: file.path,
          line: i + 1,
          source: 'Express Router',
          description: `Route declaration in ${file.path.split('/').pop()}`,
          commitUrl: `https://github.com/blob/${commitSha}/${file.path}#L${i + 1}`
        });
      }

      // Python FastAPI / Flask
      const pyRegex = new RegExp(flaskFastApiRouteRegex.source, flaskFastApiRouteRegex.flags);
      while ((match = pyRegex.exec(line)) !== null) {
        // Look ahead for function docstring or name
        let handlerName = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
          const fnMatch = lines[j].match(/(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/);
          if (fnMatch) {
            handlerName = ` (${fnMatch[1]})`;
            break;
          }
        }
        rawRoutes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: file.path,
          line: i + 1,
          source: 'FastAPI / Flask',
          description: `API endpoint handler${handlerName} in ${file.path.split('/').pop()}`,
          commitUrl: `https://github.com/blob/${commitSha}/${file.path}#L${i + 1}`
        });
      }
    }
  }

  // Deduplicate before returning
  return deduplicateRoutes(rawRoutes);
}

/**
 * Discovers Database schemas ONLY when concrete evidence exists.
 */
export function discoverDatabaseSchemas(files = [], commitSha = 'HEAD') {
  const schemas = [];
  const seen = new Set();

  for (const file of files) {
    if (!file.content || file.skipped) continue;
    const lines = file.content.split('\n');

    // 1. Prisma schema (.prisma)
    if (file.path.endsWith('.prisma')) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const modelMatch = line.match(/^model\s+([A-Za-z0-9_]+)\s*\{/);
        if (modelMatch) {
          const key = `Prisma:${modelMatch[1]}`;
          if (!seen.has(key)) {
            seen.add(key);
            schemas.push({
              type: 'Prisma Model',
              name: modelMatch[1],
              file: file.path,
              line: i + 1,
              commitUrl: `https://github.com/blob/${commitSha}/${file.path}#L${i + 1}`
            });
          }
        }
      }
    }

    // 2. SQL Create Table statements (.sql)
    if (file.path.endsWith('.sql')) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const tableMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z0-9_]+)["`]?/i);
        if (tableMatch) {
          const key = `SQL:${tableMatch[1]}`;
          if (!seen.has(key)) {
            seen.add(key);
            schemas.push({
              type: 'SQL Table',
              name: tableMatch[1],
              file: file.path,
              line: i + 1,
              commitUrl: `https://github.com/blob/${commitSha}/${file.path}#L${i + 1}`
            });
          }
        }
      }
    }

    // 3. Mongoose Schema
    if (file.content.includes('new Schema(') || file.content.includes('mongoose.model(')) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const mongooseMatch = line.match(/(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:mongoose\.)?model\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (mongooseMatch) {
          const key = `Mongoose:${mongooseMatch[2]}`;
          if (!seen.has(key)) {
            seen.add(key);
            schemas.push({
              type: 'Mongoose Model',
              name: mongooseMatch[2],
              file: file.path,
              line: i + 1,
              commitUrl: `https://github.com/blob/${commitSha}/${file.path}#L${i + 1}`
            });
          }
        }
      }
    }

    // 4. SQLAlchemy / Tortoise ORM Model in Python
    if (file.path.endsWith('.py') && (file.content.includes('Base') || file.content.includes('Model'))) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const saMatch = line.match(/^class\s+([A-Za-z0-9_]+)\s*\(\s*(?:Base|Model|SQLModel)\s*\)\s*:/);
        if (saMatch) {
          const key = `ORM:${saMatch[1]}`;
          if (!seen.has(key)) {
            seen.add(key);
            schemas.push({
              type: 'SQLAlchemy / Pydantic Entity',
              name: saMatch[1],
              file: file.path,
              line: i + 1,
              commitUrl: `https://github.com/blob/${commitSha}/${file.path}#L${i + 1}`
            });
          }
        }
      }
    }
  }

  return schemas;
}

/**
 * Extracts a clean, well-formed project purpose from README or repository metadata.
 */
function extractPurpose(readmeContent, repoDesc) {
  const cleanDesc = (repoDesc || '').trim();

  if (readmeContent) {
    const lines = readmeContent.split('\n');
    const candidates = [];
    for (const rawLine of lines) {
      let l = rawLine.trim();
      if (!l || l.startsWith('#') || l.startsWith('![') || l.startsWith('<') || l.startsWith('---')) continue;

      // Skip lines that are multi-lingual navigation bars (e.g. "English · 简体中文 · 日本語 · Deutsch...")
      if (/[·•|]/.test(l) && (l.split(/[·•|]/).length >= 3 || /(?:english|chinese|deutsch|español|français|russian|portuguese|turkish)/i.test(l))) {
        continue;
      }

      // Skip badges or badge links
      if (/^\[!\[/.test(l) || /shields\.io|badge/i.test(l)) continue;

      // Clean markdown blockquotes, bolding, links, html tags
      l = l
        .replace(/^>\s*/, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<[^>]+>/g, '')
        .trim();

      // Skip table rows or bullet items that are not descriptive sentences
      if (l.length > 25 && !l.startsWith('|') && !l.startsWith('-') && !l.startsWith('*')) {
        // Ensure line has actual alphanumeric words and isn't just symbols
        const alphaWords = l.match(/[a-zA-Z0-9]{3,}/g) || [];
        if (alphaWords.length >= 4) {
          candidates.push(l);
          if (candidates.length >= 2) break;
        }
      }
    }

    if (candidates.length > 0) {
      return candidates.join(' ');
    }
  }

  return cleanDesc || 'General open-source software repository analyzed via static AST and tree metadata.';
}

/**
 * Formulates evidence-based setup and execution guides, respecting multi-component architectures.
 */
function buildSetupGuide(manifests, treePaths = [], candidateFiles = []) {
  const components = [];

  const pythonManifest = manifests.find((m) => m.type === 'pip' || m.type === 'pyproject');
  const npmManifests = manifests.filter((m) => m.type === 'npm');

  // Check for test files in tree
  const hasPytest = treePaths.some((p) => p.includes('conftest.py') || p.includes('test_') || p.includes('/tests/'));
  const hasDocker = treePaths.some((p) => p.includes('docker-compose') || p.includes('Dockerfile'));

  // 1. Python Component
  if (pythonManifest) {
    const isFastApi = (pythonManifest.dependencies || []).some((d) => d.toLowerCase().includes('fastapi') || d.toLowerCase().includes('uvicorn'));
    const isDjango = (pythonManifest.dependencies || []).some((d) => d.toLowerCase().includes('django'));
    const isFlask = (pythonManifest.dependencies || []).some((d) => d.toLowerCase().includes('flask'));

    let runCmd = 'python main.py';
    if (isFastApi) {
      runCmd = treePaths.some((p) => p.includes('backend/cloud/main.py'))
        ? 'uvicorn backend.cloud.main:app --port 8000'
        : 'uvicorn main:app --reload';
    } else if (isDjango) {
      runCmd = 'python manage.py runserver';
    } else if (isFlask) {
      runCmd = 'flask run';
    }

    components.push({
      component: 'Python Backend / Services',
      manifestFile: pythonManifest.file,
      installCommand: `pip install -r ${pythonManifest.file}`,
      runDevCommand: runCmd,
      testCommand: hasPytest ? 'pytest backend/tests' : 'python -m unittest',
      buildCommand: 'Not applicable (interpreted runtime)'
    });
  }

  // 2. Node / React Component
  for (const npm of npmManifests) {
    const isSubfolder = npm.file.includes('/');
    const prefix = isSubfolder ? npm.file.replace(/\/package\.json$/, '') : '';
    const scripts = npm.scripts || {};

    const installCmd = prefix ? `npm install --prefix ${prefix}` : 'npm install';
    const runCmd = scripts.dev
      ? prefix ? `npm run dev --prefix ${prefix}` : 'npm run dev'
      : scripts.start
      ? prefix ? `npm start --prefix ${prefix}` : 'npm start'
      : 'Not verified';

    const testCmd = scripts.test && !scripts.test.includes('no test specified')
      ? prefix ? `npm test --prefix ${prefix}` : 'npm test'
      : 'Not verified (no test script in package.json)';

    const buildCmd = scripts.build
      ? prefix ? `npm run build --prefix ${prefix}` : 'npm run build'
      : 'Not verified';

    components.push({
      component: prefix ? `${prefix.toUpperCase()} (Node/React)` : 'Frontend / Node Application',
      manifestFile: npm.file,
      installCommand: installCmd,
      runDevCommand: runCmd,
      testCommand: testCmd,
      buildCommand: buildCmd
    });
  }

  // Fallback single-component representation
  if (components.length === 0) {
    return {
      installCommand: 'Not verified (no dependency manifest detected in root)',
      runDevCommand: 'Not verified (check README for execution entry point)',
      testCommand: 'Not verified (no automated test runner detected)',
      buildCommand: 'Not applicable',
      components: []
    };
  }

  const primary = components[0];
  return {
    installCommand: primary.installCommand,
    runDevCommand: primary.runDevCommand,
    testCommand: primary.testCommand,
    buildCommand: primary.buildCommand,
    components
  };
}

/**
 * Analyzes repository tree to produce a structured living architecture document.
 */
export function buildArchitectureAnalysis(repo = {}, tree = [], files = [], commitSha = 'HEAD') {
  const safeFiles = Array.isArray(files) ? files : [];
  const safeTree = Array.isArray(tree) ? tree : [];
  const safeRepo = repo || {};

  // 1. Identify Key Files & Manifests
  const readmeFile = safeFiles.find((f) => f && f.path && f.path.match(/^readme\.md$/i));
  const manifests = safeFiles
    .map((f) => (f && f.path ? analyzeManifest(f.path, f.content) : null))
    .filter(Boolean);

  const primaryManifest = manifests[0] || null;

  // 2. Purpose Extraction
  const purpose = extractPurpose(readmeFile?.content, safeRepo.description);

  // 3. Tree Classification (High-level architecture layers)
  const treePaths = safeTree.map((t) => t.path || t);
  const layers = {
    frontend: treePaths.filter((p) => p.match(/^(?:src\/)?(?:components|views|pages|frontend|client|ui)\//i)),
    backend: treePaths.filter((p) => p.match(/^(?:src\/)?(?:controllers|routes|services|models|api|server|backend)\//i)),
    config: treePaths.filter((p) => p.match(/^(?:docker|nginx|\.github|\.env|tsconfig|vite\.config|webpack|turbo|package\.json|requirements)/i)),
    tests: treePaths.filter((p) => p.match(/(?:tests?|__tests__|\.test\.|\.spec\.|conftest\.py)/i)),
    docs: treePaths.filter((p) => p.match(/^(?:docs?|research|wiki|README|CONTRIBUTING|LICENSE)/i))
  };

  // 4. Discover Evidence-Based Routes & Schemas (Deduplicated)
  const routes = discoverApiRoutes(safeFiles, commitSha);
  const schemas = discoverDatabaseSchemas(safeFiles, commitSha);

  // 5. Setup & Testing Commands
  const setupGuide = buildSetupGuide(manifests, treePaths, safeFiles);

  // 6. Construct Strict Epistemic Triad
  const verifiedFacts = [
    {
      claim: `Repository default branch is '${safeRepo.default_branch || 'main'}' with detected primary language '${safeRepo.language || (primaryManifest?.language) || 'Unknown'}'.`,
      citation: 'Repository Metadata'
    }
  ];

  manifests.forEach((m) => {
    verifiedFacts.push({
      claim: `Component '${m.file}' configured as a ${m.language} (${m.type.toUpperCase()}) manifest with ${m.dependencies.length} declared dependencies.`,
      citation: m.file
    });
  });

  if (routes.length > 0) {
    verifiedFacts.push({
      claim: `Discovered and deduplicated ${routes.length} HTTP API route endpoints with concrete source code citations.`,
      citation: routes.slice(0, 4).map((r) => `${r.method} ${r.path}`).join(', ')
    });
  }

  if (schemas.length > 0) {
    verifiedFacts.push({
      claim: `Declares ${schemas.length} database entities / ORM models.`,
      citation: schemas.slice(0, 4).map((s) => `${s.type} '${s.name}'`).join(', ')
    });
  }

  const inferences = [];
  if (layers.frontend.length > 0 && layers.backend.length > 0) {
    inferences.push('Full-stack decoupled architecture containing distinct frontend presentation and backend service layers.');
  } else if (layers.frontend.length > 0) {
    inferences.push('Client-heavy single-page application or static frontend UI architecture.');
  } else if (layers.backend.length > 0) {
    inferences.push('Backend microservice or server-side API application architecture.');
  }

  const unknowns = [
    'Runtime production credentials and live database endpoints (untracked outside template files).',
    'External cloud network topologies and private service registries not committed to source control.',
    'Test code coverage metrics for untested edge modules.'
  ];

  return {
    purpose,
    commitSha,
    manifest: primaryManifest,
    manifests,
    layers: {
      frontendCount: layers.frontend.length,
      backendCount: layers.backend.length,
      configCount: layers.config.length,
      testsCount: layers.tests.length,
      docsCount: layers.docs.length,
      samples: {
        frontend: layers.frontend.slice(0, 6),
        backend: layers.backend.slice(0, 6),
        config: layers.config.slice(0, 6),
        tests: layers.tests.slice(0, 6)
      }
    },
    routes,
    schemas,
    setupGuide,
    epistemicTriad: {
      verifiedFacts,
      inferences,
      unknowns
    }
  };
}
