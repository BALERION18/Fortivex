import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  RotateCw,
  Lock,
  Key,
  Package,
  Zap,
  FileCheck,
  Info,
  Lightbulb,
  Check,
  Copy
} from 'lucide-react';
import { scanSecrets } from '../api/client.js';

export default function SecurityScannerTab({ owner, repo }) {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    if (owner && repo) {
      runScan();
    }
  }, [owner, repo]);

  async function runScan() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scanSecrets(owner, repo);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Security scan failed');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyFix(text, index) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // Combine findings and hygiene checks for a comprehensive view
  const findings = report?.findings || [];
  const checks = report?.checks || [];

  // Normalise checks to match card rendering format
  const normalisedChecks = checks.map((c) => ({
    ruleId: c.ruleId,
    title: c.title,
    category: c.category,
    severity: c.status === 'PASS' ? 'PASS' : c.severity || 'LOW',
    status: c.status,
    simpleDescription: c.simpleDescription,
    simpleFix: c.simpleFix,
    isCheckItem: true
  }));

  const allItems = [...findings, ...normalisedChecks];

  const filteredItems = allItems.filter((item) => {
    // 1. Category Filter
    if (activeCategory !== 'ALL') {
      const cat = (item.category || '').toLowerCase();
      const targetCat = activeCategory.toLowerCase();
      if (!cat.includes(targetCat)) return false;
    }

    // 2. Severity Filter
    if (severityFilter !== 'ALL') {
      if (severityFilter === 'SAFE' && item.severity !== 'PASS') return false;
      if (severityFilter !== 'SAFE' && item.severity !== severityFilter) return false;
    }

    // 3. Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const title = (item.title || '').toLowerCase();
      const desc = (item.simpleDescription || '').toLowerCase();
      const file = (item.file || '').toLowerCase();
      const rule = (item.ruleId || '').toLowerCase();
      return title.includes(term) || desc.includes(term) || file.includes(term) || rule.includes(term);
    }

    return true;
  });

  const severityBadgeColors = {
    CRITICAL: 'bg-[#f24822]/10 text-[#f24822] border-[#f24822]/40',
    HIGH: 'bg-[#ffcd29]/10 text-[#ffcd29] border-[#ffcd29]/40',
    MEDIUM: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40',
    LOW: 'bg-white/10 text-white border-white/20',
    PASS: 'bg-[#14ae5c]/10 text-emerald-300 border-[#14ae5c]/40'
  };

  const gradeColors = {
    'A+': 'text-[#14ae5c] border-[#14ae5c]/40 bg-[#14ae5c]/10',
    A: 'text-[#14ae5c] border-[#14ae5c]/40 bg-[#14ae5c]/10',
    B: 'text-white border-white/30 bg-white/10',
    C: 'text-[#ffcd29] border-[#ffcd29]/40 bg-[#ffcd29]/10',
    F: 'text-[#f24822] border-[#f24822]/40 bg-[#f24822]/10'
  };

  const pillarIconMap = {
    secrets: Key,
    'code-safety': ShieldAlert,
    'supply-chain': Package,
    cicd: Zap,
    governance: FileCheck
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#252526] border border-[#383838] p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              Security Posture & Attack Defense
            </h3>
            <p className="text-xs text-[#8c8c8c]">
              Comprehensive static audit: Gitleaks Secret Detection & Credential Audit, code injection defense, and supply chain hardening.
            </p>
          </div>
        </div>

        <button
          onClick={runScan}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#383838] hover:bg-[#484848] text-white text-xs font-medium border border-[#484848]/60 transition disabled:opacity-50 self-start sm:self-center"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
          <span>{isLoading ? 'Auditing Repo...' : 'Rescan Security'}</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3.5 bg-[#252526] border border-[#f24822]/40 rounded-lg text-xs text-[#f24822] flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-[#f24822] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !report && (
        <div className="p-12 text-center bg-[#252526] rounded-lg border border-[#383838] text-xs text-[#8c8c8c] animate-pulse">
          <RotateCw className="h-7 w-7 text-white animate-spin mx-auto mb-3" />
          <span className="text-sm font-semibold text-white block">Auditing Repository Security Posture...</span>
          <span className="text-xs text-[#8c8c8c] mt-1 block">Inspecting candidate files for injection risks, CI/CD hardening, and secret leaks.</span>
        </div>
      )}

      {report && (
        <>
          {/* Main Hero Card: Overall Score & Risk Tier */}
          <div className="p-5 rounded-lg bg-[#252526] border border-[#383838] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Score & Grade Display */}
              <div className="flex items-center space-x-4">
                <div className="relative flex items-center justify-center h-16 w-16 rounded bg-[#1e1e1e] border border-[#383838]">
                  <div className="text-center font-mono">
                    <span className="text-xl font-bold text-white leading-none block">{report.score ?? 100}</span>
                    <span className="text-[9px] text-[#8c8c8c] font-semibold uppercase tracking-wider block mt-0.5">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                        gradeColors[report.grade] || 'text-white border-white/30 bg-white/10'
                      }`}
                    >
                      GRADE {report.grade || 'A'}
                    </span>
                    <span className="text-xs font-medium text-[#b3b3b3] uppercase tracking-wide">
                      Risk Level: <strong className={report.riskTier === 'CRITICAL' ? 'text-[#f24822]' : report.riskTier === 'ELEVATED' ? 'text-[#ffcd29]' : 'text-[#14ae5c]'}>{report.riskTier || 'LOW'}</strong>
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">
                    Attack Resistance Assessment
                  </h4>
                  <p className="text-xs text-[#8c8c8c] max-w-xl leading-relaxed">
                    {report.summary || 'Repository demonstrates baseline security hygiene with zero exposed credentials.'}
                  </p>
                </div>
              </div>

              {/* Quick Severity Pills */}
              <div className="flex flex-wrap md:flex-col gap-1.5 font-sans text-xs">
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#383838]">
                  <span className="text-[#8c8c8c] text-[11px]">Critical Risks:</span>
                  <span className={`font-bold ${report.criticalCount > 0 ? 'text-[#f24822]' : 'text-white'}`}>
                    {report.criticalCount || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#383838]">
                  <span className="text-[#8c8c8c] text-[11px]">High Risks:</span>
                  <span className={`font-bold ${report.highCount > 0 ? 'text-[#ffcd29]' : 'text-white'}`}>
                    {report.highCount || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#383838]">
                  <span className="text-[#8c8c8c] text-[11px]">Medium Risks:</span>
                  <span className={`font-bold ${report.mediumCount > 0 ? 'text-yellow-400' : 'text-white'}`}>
                    {report.mediumCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Security Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(report.pillars || []).map((pillar) => {
              const IconComp = pillarIconMap[pillar.id] || ShieldAlert;
              const isSelected = activeCategory.toLowerCase() === pillar.name.toLowerCase() || activeCategory === pillar.id;

              return (
                <button
                  key={pillar.id}
                  onClick={() => setActiveCategory(isSelected ? 'ALL' : pillar.name)}
                  className={`text-left p-3 rounded-md border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#2c2c2c] border-[#0d99ff] ring-1 ring-[#0d99ff]/50'
                      : 'bg-[#1e1e1e] border-[#383838] hover:border-[#484848]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="p-1.5 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        pillar.status === 'SAFE'
                          ? 'bg-[#14ae5c]/10 text-emerald-300 border-[#14ae5c]/30'
                          : pillar.status === 'CRITICAL'
                          ? 'bg-[#f24822]/10 text-[#f24822] border-[#f24822]/30'
                          : 'bg-[#ffcd29]/10 text-[#ffcd29] border-[#ffcd29]/30'
                      }`}
                    >
                      {pillar.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-white block truncate">{pillar.name}</span>
                    <span className="text-[10px] text-[#8c8c8c] block mt-1 leading-snug line-clamp-2">
                      {pillar.description}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#383838] flex items-center justify-between text-[11px]">
                    <span className="text-[#8c8c8c]">Score:</span>
                    <span className="font-bold text-white">{pillar.score}/100</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#252526] p-3 rounded-lg border border-[#383838] text-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#0d99ff]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search findings, code rules, or files..."
                className="w-full pl-8 pr-4 py-1.5 bg-[#1e1e1e] border border-[#383838] rounded text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40 text-xs"
              />
            </div>

            {/* Severity Pill Filter */}
            <div className="flex flex-wrap items-center gap-1 bg-[#1e1e1e] p-1 rounded border border-[#383838]">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'SAFE'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSeverityFilter(level)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition ${
                    severityFilter === level
                      ? 'bg-[#383838] text-white'
                      : 'text-[#8c8c8c] hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Clear Tag */}
          {(activeCategory !== 'ALL' || severityFilter !== 'ALL' || searchTerm.trim()) && (
            <div className="flex items-center justify-between text-xs text-[#8c8c8c] px-1">
              <span>
                Showing results for{' '}
                <strong className="text-white">{activeCategory}</strong>
                {severityFilter !== 'ALL' && (
                  <>
                    {' '}• Severity: <strong className="text-white">{severityFilter}</strong>
                  </>
                )}
                {searchTerm && (
                  <>
                    {' '}• Search: <strong className="text-white">"{searchTerm}"</strong>
                  </>
                )}
              </span>
              <button
                onClick={() => {
                  setActiveCategory('ALL');
                  setSeverityFilter('ALL');
                  setSearchTerm('');
                }}
                className="text-white hover:underline text-[11px]"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Findings & Checks List */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-[#252526] rounded-lg border border-[#383838] text-[#8c8c8c] text-sm">
              <CheckCircle2 className="h-10 w-10 text-[#14ae5c] mx-auto mb-2 opacity-80" />
              <p className="text-white font-medium">No Security Warnings in this Filter</p>
              <p className="text-xs text-[#8c8c8c] mt-1 max-w-md mx-auto">
                No matching vulnerabilities, injection risks, or unpinned dependencies were found under the current filter selection.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => {
                return (
                  <div
                    key={idx}
                    className="bg-[#252526] border border-[#383838] hover:border-[#484848] rounded-lg p-4 shadow-sm transition space-y-3"
                  >
                    {/* Item Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#383838]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            severityBadgeColors[item.severity] || 'bg-[#1e1e1e] text-[#b3b3b3] border-[#383838]'
                          }`}
                        >
                          {item.severity}
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e1e] text-[#8c8c8c] border border-[#383838] font-medium font-mono">
                          {item.category}
                        </span>

                        <span className="font-medium text-white text-xs sm:text-sm">
                          {item.title || item.ruleName}
                        </span>
                      </div>

                      {item.file && (
                        <span className="text-xs text-[#d4d4d4] font-mono">
                          {item.file}{item.line ? `:${item.line}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Code Snippet / Masked Secret (if available) */}
                    {(item.codeSnippet || item.maskedSecret || item.maskedSnippet) && (
                      <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#383838] text-[11px] text-[#f24822] font-mono overflow-x-auto flex items-center justify-between gap-2">
                        <code>{item.maskedSnippet || item.codeSnippet || item.maskedSecret}</code>
                        {item.maskedSecret && (
                          <span className="px-2 py-0.5 rounded bg-[#252526] text-[#f24822] border border-[#383838] text-[10px] font-bold flex-shrink-0">
                            {item.maskedSecret}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Simple Explanation (What is this?) */}
                    {item.simpleDescription && (
                      <div className="flex items-start space-x-2 text-xs text-[#d4d4d4] bg-[#1e1e1e] p-2.5 rounded border border-[#383838]">
                        <Lightbulb className="h-4 w-4 text-[#ffcd29] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-semibold text-white block mb-0.5">What is the risk?</span>
                          <p className="text-[11px] text-[#8c8c8c] leading-relaxed">{item.simpleDescription}</p>
                        </div>
                      </div>
                    )}

                    {/* Simple Fix / Remediation */}
                    {(item.simpleFix || item.remediation) && (
                      <div className="flex items-start justify-between gap-3 text-xs text-[#d4d4d4] bg-[#1e1e1e] p-2.5 rounded border border-[#383838]">
                        <div className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-[#14ae5c] flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[11px] font-semibold text-[#14ae5c] block mb-0.5">How to fix it:</span>
                            <p className="text-[11px] text-[#8c8c8c] leading-relaxed">{item.simpleFix || item.remediation}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopyFix(item.simpleFix || item.remediation, idx)}
                          title="Copy remediation advice"
                          className="p-1.5 rounded bg-[#383838] hover:bg-[#484848] text-[#8c8c8c] hover:text-white border border-[#484848]/60 transition flex-shrink-0"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3.5 w-3.5 text-[#14ae5c]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Safety & Boundary Notice */}
          <div className="p-3.5 rounded-lg bg-[#252526] border border-[#383838] text-xs text-[#8c8c8c] flex items-start space-x-2.5">
            <Info className="h-4 w-4 text-[#0d99ff] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-white font-medium">Security Audit Scope:</span>
              <p className="text-[11px] leading-relaxed text-[#8c8c8c]">
                {report.disclaimer ||
                  'Zero-execution static AST pattern matching and GitHub metadata inspection. Raw credentials are strictly masked.'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
