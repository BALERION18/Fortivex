import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Activity,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  PieChart as PieIcon,
  Users,
  Terminal
} from 'lucide-react';
import { formatNumber } from '../utils/formatters.js';

const PALETTE = ['#0d99ff', '#14ae5c', '#7b61ff', '#ffcd29', '#f24822', '#007be5', '#8c8c8c'];

// Custom dark-mode tooltip styled like Figma property panels
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] border border-[#383838] px-3 py-2 rounded shadow-sm text-xs">
        <p className="text-[#8c8c8c] mb-1 border-b border-[#383838] pb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || entry.fill }} className="flex items-center space-x-2">
            <span>{entry.name}:</span>
            <span className="font-semibold text-white ml-auto">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsCharts({
  commits = [],
  issues = [],
  pulls = [],
  contributors = [],
  languages = {},
  workflowRuns = [],
  primaryLanguage = 'JavaScript'
}) {
  // 1. Prepare Commit Timeline Data (group commits by date)
  const commitTimelineMap = {};
  commits.forEach((c) => {
    const rawDate = c.commit?.author?.date;
    if (rawDate) {
      const dateStr = new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      commitTimelineMap[dateStr] = (commitTimelineMap[dateStr] || 0) + 1;
    }
  });

  const commitTimelineData = Object.entries(commitTimelineMap)
    .map(([date, count]) => ({ date, commits: count }))
    .reverse();

  // 2. Prepare Language Breakdown Data with fallback to repository primary language
  const rawLangEntries = Object.entries(languages);
  const totalLangBytes = Object.values(languages).reduce((acc, bytes) => acc + bytes, 0);

  const languageData =
    rawLangEntries.length > 0
      ? rawLangEntries.slice(0, 6).map(([lang, bytes]) => ({
          name: lang,
          value: bytes,
          percentage: totalLangBytes > 0 ? ((bytes / totalLangBytes) * 100).toFixed(1) : 0
        }))
      : primaryLanguage
      ? [{ name: primaryLanguage, value: 100, percentage: 100 }]
      : [];

  // 3. Prepare Issues & PRs Resolution Comparison
  const issuesOpen = issues.filter((i) => i.state === 'open').length;
  const issuesClosed = issues.filter((i) => i.state === 'closed').length;
  const pullsOpen = pulls.filter((p) => p.state === 'open').length;
  const pullsClosed = pulls.filter((p) => p.state === 'closed').length;

  const resolutionData = [
    {
      category: 'Issues',
      Open: issuesOpen,
      Resolved: issuesClosed
    },
    {
      category: 'Pull Requests',
      Open: pullsOpen,
      Resolved: pullsClosed
    }
  ];

  // 4. Top Contributors Impact
  const topContributorsData = contributors.slice(0, 7).map((c) => ({
    name: c.login,
    contributions: c.contributions
  }));

  // 5. CI Workflow Success Distribution
  const ciPassed = workflowRuns.filter((r) => r.conclusion === 'success').length;
  const ciFailed = workflowRuns.filter((r) => r.conclusion === 'failure').length;
  const ciOther = workflowRuns.length - ciPassed - ciFailed;

  const ciDistributionData = [
    { name: 'Success', value: ciPassed, color: '#10b981' },
    { name: 'Failed', value: ciFailed, color: '#f43f5e' },
    { name: 'Other', value: Math.max(0, ciOther), color: '#64748b' }
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#383838] text-xs font-sans text-[#8c8c8c]">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-[#0d99ff]" />
          <span className="uppercase tracking-wider font-semibold text-white">
            Telemetry & Visualizations
          </span>
        </div>
        <div className="text-[11px] text-[#8c8c8c]">
          Source: Real-time GitHub REST stream
        </div>
      </div>

      {/* Row 1: Commit Velocity & CI Stability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Commit Activity Timeline */}
        <div className="lg:col-span-2 bg-[#252526] border border-[#383838] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-[#0d99ff]" />
              <span className="font-semibold text-white">COMMIT FREQUENCY TIMELINE</span>
            </div>
            <span className="text-[#8c8c8c] text-[11px]">Recent {commits.length} commits</span>
          </div>

          <div className="h-56 w-full">
            {commitTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={commitTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d99ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d99ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
                  <XAxis dataKey="date" stroke="#8c8c8c" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8c8c8c" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="commits"
                    name="Commits"
                    stroke="#0d99ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#commitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#8c8c8c] text-xs">
                No recent commit timeseries data
              </div>
            )}
          </div>
        </div>

        {/* CI Run Success vs Failure Doughnut */}
        <div className="bg-[#252526] border border-[#383838] rounded-lg p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-[#14ae5c]" />
              <span className="font-semibold text-white">ACTIONS CI RUN OUTCOMES</span>
            </div>
          </div>

          <div className="h-44 w-full flex-1">
            {ciDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ciDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ciDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#8c8c8c] text-xs">
                No recorded Actions CI runs
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Resolution Funnel, Language Breakdown, Top Contributors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Issues & PRs Resolution Comparison */}
        <div className="bg-[#252526] border border-[#383838] rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3 text-xs">
            <GitPullRequest className="h-4 w-4 text-[#7b61ff]" />
            <span className="font-semibold text-white">OPEN VS RESOLVED RATIO</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
                <XAxis dataKey="category" stroke="#8c8c8c" fontSize={11} tickLine={false} />
                <YAxis stroke="#8c8c8c" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Resolved" fill="#14ae5c" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Open" fill="#ffcd29" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Breakdown */}
        <div className="bg-[#252526] border border-[#383838] rounded-lg p-4 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-3 text-xs">
            <PieIcon className="h-4 w-4 text-[#0d99ff]" />
            <span className="font-semibold text-white">LANGUAGE DISTRIBUTION</span>
          </div>

          <div className="flex-1 space-y-2 text-xs font-sans justify-center flex flex-col">
            {languageData.length > 0 ? (
              languageData.map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-[#d4d4d4] text-[11px]">
                    <span className="flex items-center space-x-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                      ></span>
                      <span className="font-medium">{item.name}</span>
                    </span>
                    <span className="text-[#8c8c8c] font-mono">
                      {item.percentage}% ({formatNumber(item.value)} B)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1e1e1e] border border-[#383838] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: PALETTE[idx % PALETTE.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[#8c8c8c] text-center text-xs">No language data available</div>
            )}
          </div>
        </div>

        {/* Top Contributors Velocity */}
        <div className="bg-[#252526] border border-[#383838] rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3 text-xs">
            <Users className="h-4 w-4 text-[#0d99ff]" />
            <span className="font-semibold text-white">TOP CONTRIBUTORS VOLUME</span>
          </div>

          <div className="h-52 w-full">
            {topContributorsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topContributorsData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
                  <XAxis type="number" stroke="#8c8c8c" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#8c8c8c" fontSize={10} tickLine={false} width={65} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="contributions" name="Commits" fill="#0d99ff" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#8c8c8c] text-xs">
                No contributor volume data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
