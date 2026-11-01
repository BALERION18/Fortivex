import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Compass,
  Layers,
  Database,
  Route,
  Terminal,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  RotateCw,
  Box,
  FileText
} from 'lucide-react';
import { fetchCodeIntelligence } from '../api/client.js';
import AIQuestionPanel from './AIQuestionPanel.jsx';

export default function CodeIntelligenceTab({ owner, repo, commitSha = 'HEAD' }) {
  const [intelligence, setIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (owner && repo) {
      loadIntelligence();
    }
  }, [owner, repo]);

  async function loadIntelligence() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCodeIntelligence(owner, repo);
      setIntelligence(data);
    } catch (err) {
      setError(err.message || 'Failed to load code intelligence');
    } finally {
      setIsLoading(false);
    }
  }

  const routes = intelligence?.routes || [];
  const schemas = intelligence?.schemas || [];
  const triad = intelligence?.epistemicTriad || { verifiedFacts: [], inferences: [], unknowns: [] };
  const setupGuide = intelligence?.setupGuide || {};

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#252526] border border-[#383838] p-4 rounded-md shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              DeepWiki Codebase Architecture & Living Documentation
            </h3>
            <p className="text-[#8c8c8c] text-xs">
              Automated structural inference, manifest analysis, syntax-discovered API routes, and database schemas.
            </p>
          </div>
        </div>

        <button
          onClick={loadIntelligence}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#383838] hover:bg-[#484848] text-white text-xs font-medium border border-[#484848]/60 transition disabled:opacity-50 self-start sm:self-center"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
          <span>{isLoading ? 'Analyzing...' : 'Re-analyze'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#252526] border border-[#f24822]/40 rounded-md text-[#f24822] flex items-center space-x-2 text-xs">
          <AlertCircle className="h-4 w-4 text-[#f24822] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !intelligence && (
        <div className="p-10 text-center bg-[#252526] rounded-md border border-[#383838] text-[#8c8c8c] text-xs animate-pulse">
          <RotateCw className="h-6 w-6 text-white animate-spin mx-auto mb-2" />
          <span>Ingesting repository trees and dependency manifests...</span>
        </div>
      )}

      {intelligence && (
        <>
          {/* Section 1: Purpose & Setup Commands */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Purpose & Overview */}
            <div className="lg:col-span-2 bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#383838] text-white font-semibold mb-2 text-xs">
                <Compass className="h-4 w-4 text-[#0d99ff]" />
                <span>PROJECT PURPOSE & SCOPE</span>
              </div>
              <p className="text-[#d4d4d4] leading-relaxed text-xs sm:text-sm font-sans">
                {intelligence.purpose}
              </p>

              {intelligence.manifest && (
                <div className="mt-3 pt-3 border-t border-[#383838] flex items-center flex-wrap gap-2 text-[11px] text-[#8c8c8c]">
                  <span className="text-[#8c8c8c]">Manifest:</span>
                  <span className="text-[#0d99ff] font-mono font-bold">{intelligence.manifest.name}</span>
                  <span className="font-mono">(v{intelligence.manifest.version})</span>
                  <span>•</span>
                  <span>{intelligence.manifest.dependencies.length} runtime deps</span>
                  <span>•</span>
                  <span>{intelligence.manifest.devDependencies.length} dev deps</span>
                </div>
              )}
            </div>

            {/* Setup & Testing Commands */}
            <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#383838] text-white font-semibold text-xs">
                <Terminal className="h-4 w-4 text-[#0d99ff]" />
                <span>EXECUTION & RUNTIME</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-[#8c8c8c] block mb-0.5">Install:</span>
                  <code className="text-[#0d99ff] font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#383838] block truncate">
                    {setupGuide.installCommand}
                  </code>
                </div>

                <div>
                  <span className="text-[#8c8c8c] block mb-0.5">Development:</span>
                  <code className="text-[#d4d4d4] font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#383838] block truncate">
                    {setupGuide.runDevCommand}
                  </code>
                </div>

                <div>
                  <span className="text-[#8c8c8c] block mb-0.5">Test:</span>
                  <code className="text-[#d4d4d4] font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#383838] block truncate">
                    {setupGuide.testCommand}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Discovered Routes & Schemas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* API Routes */}
            <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#383838] mb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-xs">
                  <Route className="h-4 w-4 text-[#0d99ff]" />
                  <span>DISCOVERED API ROUTES ({routes.length})</span>
                </div>
                <span className="text-[10px] text-[#8c8c8c]">Syntax Evidenced</span>
              </div>

              {routes.length === 0 ? (
                <div className="text-[#8c8c8c] py-6 text-center text-xs">
                  No API route declarations discovered in inspected files.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {routes.map((r, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#1e1e1e] border border-[#383838] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            r.method === 'GET'
                              ? 'bg-[#14ae5c]/10 text-emerald-300 border border-[#14ae5c]/30'
                              : r.method === 'POST'
                              ? 'bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30'
                              : 'bg-[#ffcd29]/10 text-yellow-300 border border-[#ffcd29]/30'
                          }`}
                        >
                          {r.method}
                        </span>
                        <span className="text-white font-mono font-semibold truncate text-[11px]">{r.path}</span>
                      </div>

                      <a
                        href={r.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#8c8c8c] hover:text-[#0d99ff] flex items-center space-x-1 flex-shrink-0 font-mono"
                      >
                        <span>{r.file.split('/').pop()}:{r.line}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Database Schemas */}
            <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#383838] mb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-xs">
                  <Database className="h-4 w-4 text-[#0d99ff]" />
                  <span>DATABASE ENTITIES & SCHEMAS ({schemas.length})</span>
                </div>
                <span className="text-[10px] text-[#8c8c8c]">Syntax Evidenced</span>
              </div>

              {schemas.length === 0 ? (
                <div className="text-[#8c8c8c] py-6 text-center text-xs">
                  No database schema definitions (Prisma/SQL/Mongoose) discovered in inspected files.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {schemas.map((s, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#1e1e1e] border border-[#383838] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#7b61ff]/10 text-purple-300 border border-[#7b61ff]/30">
                          {s.type}
                        </span>
                        <span className="text-white font-mono font-semibold truncate text-[11px]">{s.name}</span>
                      </div>

                      <a
                        href={s.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#8c8c8c] hover:text-white flex items-center space-x-1 flex-shrink-0 font-mono"
                      >
                        <span>{s.file.split('/').pop()}:{s.line}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Epistemic Triad (Verified Facts vs Inferences vs Unknowns) */}
          <div className="p-4 rounded-md bg-[#252526] border border-[#383838] shadow-sm space-y-3 font-sans">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">
              Epistemic Triad: Fact Verification & Boundary Analysis
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Verified Facts */}
              <div className="p-3 rounded bg-[#1e1e1e] border border-[#14ae5c]/30 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-white font-bold text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  <span className="text-emerald-400">VERIFIED FACTS</span>
                </div>
                <div className="space-y-1 text-[11px] text-[#d4d4d4]">
                  {triad.verifiedFacts.map((fact, idx) => (
                    <p key={idx} className="leading-relaxed">
                      • {fact.claim || fact}
                    </p>
                  ))}
                </div>
              </div>

              {/* Inferences */}
              <div className="p-3 rounded bg-[#1e1e1e] border border-[#ffcd29]/30 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-white font-bold text-[11px]">
                  <HelpCircle className="h-3.5 w-3.5 text-white" />
                  <span className="text-amber-400">ARCHITECTURAL INFERENCES</span>
                </div>
                <div className="space-y-1 text-[11px] text-[#d4d4d4]">
                  {triad.inferences.map((inf, idx) => (
                    <p key={idx} className="leading-relaxed">
                      • {inf}
                    </p>
                  ))}
                </div>
              </div>

              {/* Unknowns & Limitations */}
              <div className="p-3 rounded bg-[#1e1e1e] border border-[#383838] space-y-1.5">
                <div className="flex items-center space-x-1.5 text-white font-bold text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                  <span className="text-[#8c8c8c]">UNKNOWNS & LIMITATIONS</span>
                </div>
                <div className="space-y-1 text-[11px] text-[#8c8c8c]">
                  {triad.unknowns.map((unk, idx) => (
                    <p key={idx} className="leading-relaxed">
                      • {unk}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Grounded AI Q&A Assistant */}
          <AIQuestionPanel owner={owner} repo={repo} commitSha={intelligence.commitSha} />
        </>
      )}
    </div>
  );
}
