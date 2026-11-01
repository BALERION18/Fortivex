import { describe, it, expect } from 'vitest';
import {
  analyzeManifest,
  discoverApiRoutes,
  discoverDatabaseSchemas,
  buildArchitectureAnalysis,
  deduplicateRoutes
} from '../src/services/codeIntelligence.js';

describe('Code Intelligence & Architecture Engine', () => {
  it('parses package.json manifest dependencies and scripts', () => {
    const pkgJson = JSON.stringify({
      name: 'sample-project',
      dependencies: { express: '^4.19.0', cors: '^2.8.5' },
      devDependencies: { vitest: '^2.0.0' },
      scripts: { dev: 'node server.js', test: 'vitest run' }
    });

    const result = analyzeManifest('package.json', pkgJson);
    expect(result.type).toBe('npm');
    expect(result.dependencies).toContain('express');
    expect(result.devDependencies).toContain('vitest');
    expect(result.scripts.test).toBe('vitest run');
  });

  it('discovers API routes only when concrete syntax evidence exists', () => {
    const serverCode = `
      import express from 'express';
      const app = express();
      app.get('/api/users', (req, res) => {});
      app.post('/api/auth/login', (req, res) => {});
    `;

    const files = [{ path: 'src/server.js', content: serverCode }];
    const routes = discoverApiRoutes(files, 'commit789');

    expect(routes.length).toBe(2);
    expect(routes[0].method).toBe('GET');
    expect(routes[0].path).toBe('/api/users');
    expect(routes[0].line).toBe(4);
    expect(routes[0].commitUrl).toContain('commit789/src/server.js#L4');

    expect(routes[1].method).toBe('POST');
    expect(routes[1].path).toBe('/api/auth/login');
  });

  it('does not fabricate API routes if no evidence exists', () => {
    const docCode = 'This is a README explaining the architecture without routes.';
    const files = [{ path: 'README.md', content: docCode }];
    const routes = discoverApiRoutes(files, 'commit789');

    expect(routes.length).toBe(0);
  });

  it('discovers Database schemas from Prisma and SQL files', () => {
    const prismaContent = `
      model User {
        id Int @id @default(autoincrement())
        email String @unique
      }
    `;

    const sqlContent = `
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(10,2)
      );
    `;

    const files = [
      { path: 'prisma/schema.prisma', content: prismaContent },
      { path: 'db/schema.sql', content: sqlContent }
    ];

    const schemas = discoverDatabaseSchemas(files, 'commit789');

    expect(schemas.length).toBe(2);
    expect(schemas[0].type).toBe('Prisma Model');
    expect(schemas[0].name).toBe('User');
    expect(schemas[1].type).toBe('SQL Table');
    expect(schemas[1].name).toBe('orders');
  });

  it('builds epistemic triad distinguishing verified facts, inferences and unknowns', () => {
    const mockRepo = {
      default_branch: 'main',
      language: 'JavaScript',
      description: 'Test repository'
    };

    const mockTree = [
      { path: 'src/components/Header.jsx' },
      { path: 'src/server/app.js' },
      { path: 'package.json' }
    ];

    const mockFiles = [
      {
        path: 'package.json',
        content: JSON.stringify({ dependencies: { react: '^18.0.0' } })
      }
    ];

    const analysis = buildArchitectureAnalysis(mockRepo, mockTree, mockFiles, 'sha123');

    expect(analysis.epistemicTriad).toBeDefined();
    expect(analysis.epistemicTriad.verifiedFacts.length).toBeGreaterThan(0);
    expect(analysis.epistemicTriad.inferences.length).toBeGreaterThan(0);
    expect(analysis.epistemicTriad.unknowns.length).toBeGreaterThan(0);
  });

  it('deduplicates API routes using HTTP method + normalized route path', () => {
    const rawRoutes = [
      { method: 'GET', path: '/api/v1/telemetry/', file: 'main.py', line: 15 },
      { method: 'get', path: '/api/v1/telemetry', file: 'cloud/main.py', line: 40 },
      { method: 'POST', path: '/api/v1/telemetry', file: 'main.py', line: 25 },
      { method: 'GET', path: '/api/v1/status', file: 'main.py', line: 50 }
    ];

    const deduplicated = deduplicateRoutes(rawRoutes);

    // GET /api/v1/telemetry should only appear once with occurrences = 2
    expect(deduplicated.length).toBe(3);
    const getTelemetry = deduplicated.find((r) => r.method === 'GET' && r.path === '/api/v1/telemetry');
    expect(getTelemetry).toBeDefined();
    expect(getTelemetry.occurrences).toBe(2);
    expect(getTelemetry.locations).toContain('main.py:15');
    expect(getTelemetry.locations).toContain('cloud/main.py:40');
  });

  it('parses Python requirements.txt manifests and identifies dependencies without version noise', () => {
    const reqContent = `
      # Core Framework
      fastapi>=0.109.0
      uvicorn[standard]==0.27.0
      sqlalchemy>=2.0.25
      pydantic>=2.5.3
      pytest==8.0.0
      --extra-index-url https://pypi.org/simple
    `;

    const res = analyzeManifest('backend/requirements.txt', reqContent);
    expect(res.type).toBe('pip');
    expect(res.language).toBe('Python');
    expect(res.dependencies).toContain('fastapi');
    expect(res.dependencies).toContain('uvicorn');
    expect(res.dependencies).toContain('sqlalchemy');
    expect(res.dependencies).toContain('pytest');
  });

  it('generates multi-component setup guides without mixing incompatible commands', () => {
    const mockRepo = { default_branch: 'main', description: 'Himadri Polar Digital Twin' };
    const mockTree = [
      { path: 'backend/requirements.txt' },
      { path: 'backend/cloud/main.py' },
      { path: 'backend/tests/conftest.py' },
      { path: 'frontend/package.json' },
      { path: 'frontend/src/App.jsx' }
    ];
    const mockFiles = [
      {
        path: 'backend/requirements.txt',
        content: 'fastapi==0.109.0\nuvicorn==0.27.0\npytest==8.0.0'
      },
      {
        path: 'frontend/package.json',
        content: JSON.stringify({
          name: 'frontend',
          scripts: { dev: 'vite', build: 'vite build' },
          dependencies: { react: '^19.0.0' }
        })
      }
    ];

    const analysis = buildArchitectureAnalysis(mockRepo, mockTree, mockFiles, 'sha999');
    const { setupGuide } = analysis;

    expect(setupGuide.components).toBeDefined();
    expect(setupGuide.components.length).toBe(2);

    const pyComp = setupGuide.components.find((c) => c.component.includes('Python'));
    expect(pyComp.installCommand).toBe('pip install -r backend/requirements.txt');
    expect(pyComp.testCommand).toContain('pytest backend/tests');
    // Ensure it NEVER mixes in node .
    expect(pyComp.runDevCommand).not.toContain('node');

    const jsComp = setupGuide.components.find((c) => c.component.includes('FRONTEND'));
    expect(jsComp.installCommand).toBe('npm install --prefix frontend');
    expect(jsComp.runDevCommand).toBe('npm run dev --prefix frontend');
    expect(jsComp.buildCommand).toBe('npm run build --prefix frontend');
  });

  it('handles repositories with missing manifests gracefully without fabricating commands', () => {
    const analysis = buildArchitectureAnalysis({ default_branch: 'main' }, [], [], 'sha111');
    expect(analysis.setupGuide.installCommand).toContain('Not verified');
    expect(analysis.setupGuide.runDevCommand).toContain('Not verified');
    expect(analysis.setupGuide.testCommand).toContain('Not verified');
  });
});
