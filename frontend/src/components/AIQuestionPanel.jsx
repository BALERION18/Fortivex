import React, { useState } from 'react';
import {
  BrainCircuit,
  Send,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { queryCodebaseAI } from '../api/client.js';

export default function AIQuestionPanel({ owner, repo, commitSha = 'HEAD' }) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const sampleQuestions = [
    'Where are API routes declared?',
    'What database and schemas are configured?',
    'How is automated testing configured?',
    'What are the primary production dependencies?'
  ];

  async function handleAsk(queryText) {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await queryCodebaseAI(owner, repo, q, commitSha);
      setResponse(data);
    } catch (err) {
      setError(err.message || 'AI Query Failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-[#252526] border border-[#383838] rounded-md p-4 shadow-sm space-y-4 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#383838]">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-4 w-4 text-[#0d99ff]" />
          <span className="font-semibold text-white uppercase tracking-wider text-xs">
            Repository Q&A Assistant (Ground-Truth Cited)
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-[#14ae5c]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0d99ff]" />
          <span>Gitleaks Pre-AI Redaction Active</span>
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="relative"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
            placeholder="Ask about architecture, routing, schemas, or testing..."
            className="w-full pl-3 pr-20 py-2 bg-[#1e1e1e] border border-[#383838] rounded text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="absolute right-1 px-3 py-1 bg-[#0d99ff] hover:bg-[#007be5] text-white font-medium rounded text-xs transition flex items-center space-x-1 disabled:opacity-40"
          >
            {isLoading ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Ask</span>
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-[#8c8c8c]">
          <span>Safe Input: Sensitive credentials are redacted before AI ingestion.</span>
          <span>{question.length}/500</span>
        </div>
      </form>

      {/* Suggested prompts */}
      <div className="flex items-center flex-wrap gap-1.5 pt-1">
        <span className="text-[11px] text-[#8c8c8c] mr-1">Suggestions:</span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setQuestion(sq);
              handleAsk(sq);
            }}
            disabled={isLoading}
            className="px-2 py-0.5 rounded bg-[#1e1e1e] hover:bg-[#383838] text-[11px] text-[#8c8c8c] hover:text-white border border-[#383838] transition"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Error View */}
      {error && (
        <div className="p-3 bg-[#252526] border border-[#f24822]/40 rounded text-xs text-[#f24822] flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-[#f24822] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Answer & Triad */}
      {response && (
        <div className="mt-4 p-4 rounded bg-[#1e1e1e] border border-[#383838] space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#383838] text-xs text-[#8c8c8c]">
              <span className="text-white font-semibold">Grounded Answer:</span>
              <span className="text-[11px] text-[#8c8c8c]">
                Pinned commit: <strong className="text-[#0d99ff] font-mono">{response.commitSha?.substring(0, 7)}</strong>
              </span>
            </div>

            <div className="mt-2 text-xs text-[#d4d4d4] leading-relaxed whitespace-pre-line">
              {response.answer}
            </div>
          </div>

          {/* Citations with Commit Links */}
          {response.citations && response.citations.length > 0 && (
            <div className="pt-3 border-t border-[#383838] space-y-2">
              <span className="text-[11px] font-semibold text-[#8c8c8c] block uppercase tracking-wider">
                Exact Code Citations:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {response.citations.map((c, idx) => (
                  <a
                    key={idx}
                    href={c.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-[#252526] border border-[#383838] hover:border-[#484848] flex items-center justify-between group transition"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[#0d99ff] font-mono font-semibold block truncate">
                        {c.file}:{c.line}
                      </span>
                      {c.snippet && (
                        <span className="text-[11px] text-[#8c8c8c] truncate block opacity-80">
                          {c.snippet}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-[#8c8c8c] group-hover:text-[#0d99ff] flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
