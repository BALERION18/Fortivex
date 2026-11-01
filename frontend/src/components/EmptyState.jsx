import React from 'react';
import { Activity, BrainCircuit, ShieldCheck, FileText, Search, Sparkles, User } from 'lucide-react';

export default function EmptyState({ onOpenAuth }) {
  return (
    <div className="flex-1 h-full min-h-[500px] flex items-center justify-center p-4 sm:p-8 select-none">
      {/* Figma-Style Precision Canvas Card */}
      <div className="max-w-2xl w-full text-center space-y-6 p-6 sm:p-8 rounded-lg bg-[#252526] border border-[#383838] shadow-sm relative">
        <div className="flex flex-col items-center space-y-2">
          <img
            src="/logo.png"
            alt="FORTIVEX"
            className="h-16 w-16 object-contain rounded-md drop-shadow"
          />
          <span className="text-[10px] font-bold tracking-widest text-[#0d99ff] uppercase">
            FORTIVEX
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            GitHub Observability & Security Cockpit
          </h2>
          <p className="text-xs sm:text-sm text-[#b3b3b3] max-w-lg mx-auto leading-relaxed">
            Search any public repository in the top bar (e.g. <span className="text-white font-medium underline">facebook/react</span> or <span className="text-white font-medium underline">expressjs/express</span>) to open its canvas and inspect live code intelligence, security posture, and git telemetry.
          </p>
        </div>

        {/* Feature Capabilities Grid: Crisp Figma Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-1">
          <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838] hover:border-[#484848] transition">
            <div className="flex items-center space-x-2 text-white mb-1 text-xs font-semibold">
              <BrainCircuit className="h-4 w-4 text-[#0d99ff]" />
              <span className="text-white">Living Architecture & AI Docs</span>
            </div>
            <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
              Auto-discovers verified REST routes, Prisma/SQL schemas, package dependencies, and setup commands.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838] hover:border-[#484848] transition">
            <div className="flex items-center space-x-2 text-white mb-1 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#0d99ff]" />
              <span className="text-white">Security Posture & Attack Defense</span>
            </div>
            <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
              0–100 security score across secrets, SAST injection risks, supply chain lockfiles, and CI/CD hardening.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838] hover:border-[#484848] transition">
            <div className="flex items-center space-x-2 text-white mb-1 text-xs font-semibold">
              <Activity className="h-4 w-4 text-[#0d99ff]" />
              <span className="text-white">Time-Series Telemetry & Analytics</span>
            </div>
            <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
              Live commit velocity, operational push feeds, pull request resolution health, and doctor hygiene checklist.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#1e1e1e] border border-[#383838] hover:border-[#484848] transition">
            <div className="flex items-center space-x-2 text-white mb-1 text-xs font-semibold">
              <FileText className="h-4 w-4 text-[#0d99ff]" />
              <span className="text-white">Executive Audit PDF Export</span>
            </div>
            <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
              Generate 1-click professional PDF audit reports with buffer secret sanitization and commit pinning.
            </p>
          </div>
        </div>

        {/* Minimal Instruction Tip */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[#8c8c8c]">
          <div className="flex items-center space-x-1.5">
            <Search className="h-3 w-3 text-[#0d99ff]" />
            <span>Type <span className="text-white font-medium">owner/repo</span> in the search bar above to begin</span>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#383838] border border-[#383838] hover:border-[#0d99ff]/50 text-white text-[11px] font-medium transition"
            >
              <User className="h-3 w-3 text-[#0d99ff]" />
              <span>Sign In / Create Account</span>
            </button>
          )}
        </div>

        {/* License Notice */}
        <div className="pt-3 border-t border-[#383838] flex items-center justify-center space-x-2 text-[11px] text-[#8c8c8c]">
          <span className="font-semibold text-white">FORTIVEX</span>
          <span>•</span>
          <span>Released under the MIT License</span>
        </div>
      </div>
    </div>
  );
}
