import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Activity,
  Flame,
  Users,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  HelpCircle,
  Info,
  Clock,
  ShieldCheck,
  Stethoscope,
  Compass
} from 'lucide-react';
import { fetchAdvancedInsights, downloadPdfReport } from '../api/client.js';

export default function AdvancedInsightsTab({ owner, repo, commitSha = 'HEAD' }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    if (owner && repo) {
      loadInsights();
    }
  }, [owner, repo]);

  async function loadInsights() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdvancedInsights(owner, repo);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load advanced insights');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadPdf() {
    setIsExporting(true);
    setExportError(null);
    try {
      await downloadPdfReport(owner, repo, commitSha);
    } catch (err) {
      setExportError(err.message || 'PDF Export Failed');
    } finally {
      setIsExporting(false);
    }
  }

  const history = data?.history || {};
  const impact = data?.changeImpact || {};
  const ownership = data?.ownership || {};
  const drift = data?.drift || {};
  const doctor = data?.doctor || {};

  const riskBadgeColors = {
    CRITICAL: 'bg-[#f24822]/10 text-[#f24822] border-[#f24822]/30',
    HIGH: 'bg-[#ffcd29]/10 text-[#ffcd29] border-[#ffcd29]/30',
    MEDIUM: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    LOW: 'bg-[#14ae5c]/10 text-emerald-300 border-[#14ae5c]/30'
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Bar with PDF Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#252526] border border-[#383838] p-4 rounded-md shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-[#0d99ff]/10 text-[#0d99ff] border border-[#0d99ff]/30">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              Advanced Insights, Setup Doctor & PDF Delivery
            </h3>
            <p className="text-[#8c8c8c] text-xs">
              Evidence-based change impact, commit velocity, cautionary bus-factor heuristics, documentation drift, and hygiene audit.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={loadInsights}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#383838] hover:bg-[#484848] text-white text-xs font-medium border border-[#484848]/60 transition disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-[#0d99ff] hover:bg-[#007be5] text-white text-xs font-medium transition disabled:opacity-50 shadow-sm"
          >
            <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
            <span>{isExporting ? 'Sanitizing PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="p-3 bg-[#252526] border border-[#f24822]/40 rounded-md text-[#f24822] flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-[#f24822] flex-shrink-0" />
          <span>Export Blocked: {exportError}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#252526] border border-[#f24822]/40 rounded-md text-[#f24822] flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-[#f24822] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !data && (
        <div className="p-10 text-center bg-[#252526] rounded-md border border-[#383838] text-[#8c8c8c] animate-pulse">
          <RotateCw className="h-6 w-6 text-white animate-spin mx-auto mb-2" />
          <span>Synthesizing commit history, change impact, and diagnostics...</span>
        </div>
      )}

      {data && (
        <>
          {/* Top Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-md bg-[#252526] border border-[#383838] shadow-sm">
              <span className="text-[11px] text-[#8c8c8c] block">CHANGE IMPACT RADIUS</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xl font-bold text-white">{impact.blastRadiusScore || 25}/100</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${riskBadgeColors[impact.riskTier] || 'text-[#8c8c8c]'}`}>
                  {impact.riskTier}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-[#252526] border border-[#383838] shadow-sm">
              <span className="text-[11px] text-[#8c8c8c] block">COMMIT VELOCITY</span>
              <span className="text-xl font-bold text-white block mt-1">{history.velocity || 'Moderate'}</span>
              <span className="text-[10px] text-[#8c8c8c]">{history.avgCommitsPerActiveDay || '1.0'} commits/active day</span>
            </div>

            <div className="p-3.5 rounded-md bg-[#252526] border border-[#383838] shadow-sm">
              <span className="text-[11px] text-[#8c8c8c] block">TOP CONTRIBUTOR SHARE</span>
              <span className="text-xl font-bold text-white block mt-1">{ownership.top1Percentage || 0}%</span>
              <span className="text-[10px] text-[#8c8c8c]">{ownership.concentrationLevel}</span>
            </div>

            <div className="p-3.5 rounded-md bg-[#252526] border border-[#383838] shadow-sm">
              <span className="text-[11px] text-[#8c8c8c] block">SETUP HYGIENE SCORE</span>
              <span className="text-xl font-bold text-white block mt-1">{doctor.hygieneScore || 90}%</span>
              <span className="text-[10px] text-[#8c8c8c]">{doctor.overallRating || 'Good'}</span>
            </div>
          </div>

          {/* Section 1: Change Impact & Velocity Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Change Impact Detail */}
            <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
                <div className="flex items-center space-x-2 text-white font-semibold">
                  <Flame className="h-4 w-4 text-[#0d99ff]" />
                  <span>CHANGE-IMPACT BLAST RADIUS</span>
                </div>
                <span className="text-[10px] text-[#8c8c8c]">Heuristic Analysis</span>
              </div>

              <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
                Evaluates repository structural sensitivity based on dependency manifests, core runtime entry points, and deployment configurations.
              </p>

              <div className="space-y-2">
                {(impact.impactFactors || []).map((factor, i) => (
                  <div key={i} className="p-2.5 rounded bg-[#1e1e1e] border border-[#383838] flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold block">{factor.factor}</span>
                      <span className="text-[10px] text-[#8c8c8c] truncate block max-w-xs">{factor.evidence}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${riskBadgeColors[factor.level] || 'text-[#8c8c8c]'}`}>
                      {factor.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commit Velocity & Churn */}
            <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
                <div className="flex items-center space-x-2 text-white font-semibold">
                  <Activity className="h-4 w-4 text-[#0d99ff]" />
                  <span>COMMIT VELOCITY & ACTIVE WINDOWS</span>
                </div>
                <span className="text-[10px] text-[#8c8c8c]">History Comparison</span>
              </div>

              <p className="text-[11px] text-[#d4d4d4] leading-relaxed">
                {history.summary}
              </p>

              <div className="p-3 rounded bg-[#1e1e1e] border border-[#383838] grid grid-cols-3 gap-2 text-center text-[11px]">
                <div>
                  <span className="text-[#8c8c8c] block">Sampled</span>
                  <span className="text-white font-bold text-sm">{history.totalCommitsSampled}</span>
                </div>
                <div>
                  <span className="text-[#8c8c8c] block">Active Days</span>
                  <span className="text-white font-bold text-sm">{history.activeDaysCount}</span>
                </div>
                <div>
                  <span className="text-[#8c8c8c] block">Authors</span>
                  <span className="text-white font-bold text-sm">{history.authorCount}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#8c8c8c] block font-semibold uppercase tracking-wider">Top Authors in Sample:</span>
                {(history.authors || []).slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-[#d4d4d4] px-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#383838]">
                    <span className="truncate">{a.name}</span>
                    <span className="text-white font-bold">{a.count} commits ({a.share}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Contributor Distribution & Bus Factor Heuristic */}
          <div className="p-4 rounded-md bg-[#252526] border border-[#383838] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
              <div className="flex items-center space-x-2 text-white font-semibold">
                <Users className="h-4 w-4 text-[#0d99ff]" />
                <span>CONTRIBUTOR OWNERSHIP & BUS-FACTOR HEURISTIC</span>
              </div>
              <span className="text-[10px] text-[#8c8c8c]">Cautious Estimate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#383838]">
                <span className="text-[#8c8c8c] text-[11px] block">Top 1 Contributor</span>
                <span className="text-lg font-bold text-white">{ownership.top1Percentage}%</span>
              </div>
              <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#383838]">
                <span className="text-[#8c8c8c] text-[11px] block">Top 3 Contributors</span>
                <span className="text-lg font-bold text-white">{ownership.top3Percentage}%</span>
              </div>
              <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#383838]">
                <span className="text-[#8c8c8c] text-[11px] block">Heuristic Bus Factor</span>
                <span className="text-sm font-bold text-white block truncate">{ownership.heuristicBusFactor}</span>
              </div>
            </div>

            {/* Cautionary Advisory Notice */}
            <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838] text-white text-[11px] leading-relaxed flex items-start space-x-2.5">
              <Info className="h-4 w-4 text-[#0d99ff] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">CAUTIONARY HEURISTIC ADVISORY:</strong>
                <span className="text-[#d4d4d4]">{ownership.cautionaryDisclaimer}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Documentation Drift & Setup Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Documentation Drift */}
            <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
                <div className="flex items-center space-x-2 text-white font-semibold">
                  <FileText className="h-4 w-4 text-[#0d99ff]" />
                  <span>DOCUMENTATION DRIFT AUDITOR</span>
                </div>
                <span className="text-[10px] text-[#8c8c8c]">{drift.status}</span>
              </div>

              <p className="text-[11px] text-[#8c8c8c]">
                Cross-references scripts, paths, and commands in README against active tree and manifest files.
              </p>

              {(drift.discrepancies || []).length === 0 ? (
                <div className="p-3 rounded bg-[#1e1e1e] border border-[#14ae5c]/30 text-[#14ae5c] text-[11px] flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                  <span>README instructions match active manifest scripts and tree paths.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {drift.discrepancies.map((d, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-[#1e1e1e] border border-[#383838] text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">{d.type}</span>
                        <span className="text-[10px] text-[#8c8c8c]">{d.severity}</span>
                      </div>
                      <p className="text-[#d4d4d4] leading-relaxed">{d.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Setup Doctor Diagnostics */}
            <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
                <div className="flex items-center space-x-2 text-white font-semibold">
                  <Stethoscope className="h-4 w-4 text-[#0d99ff]" />
                  <span>SETUP DOCTOR DIAGNOSTICS</span>
                </div>
                <span className="text-[10px] text-white font-bold">{doctor.hygieneScore}% PASS</span>
              </div>

              <div className="space-y-2">
                {(doctor.checks || []).map((c, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#1e1e1e] border border-[#383838] flex items-start justify-between space-x-2">
                    <div className="space-y-0.5">
                      <span className="text-white font-semibold block">{c.label}</span>
                      <p className="text-[10px] text-[#8c8c8c] leading-relaxed">{c.remediation}</p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                        c.status === 'PASS'
                          ? 'bg-[#14ae5c]/10 text-emerald-300 border border-[#14ae5c]/30'
                          : 'bg-[#ffcd29]/10 text-[#ffcd29] border border-[#ffcd29]/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
