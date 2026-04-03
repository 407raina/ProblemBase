"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


const INDUSTRIES = ["All", "Healthcare", "Fintech", "SMB", "Education", "Logistics", "HR & Hiring", "Legal", "Real Estate", "Climate"];
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Occasionally"];

//  Helpers 

function scoreColor(s) {
  if (s >= 8.5) return "#e84040";
  if (s >= 7) return "#d97706";
  return "#16a34a";
}

function statusBadge(s) {
  const map = { open: { label: "Open", bg: "#e0f2fe", color: "#0369a1" }, being_built: { label: "Being built", bg: "#fef9c3", color: "#92400e" }, solved: { label: "Solved", bg: "#dcfce7", color: "#166534" } };
  return map[s] || map.open;
}

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function normalizeProblem(problem) {
  return {
    ...problem,
    meToo: problem.meToo ?? problem.me_too ?? 0,
    buildersCount: problem.buildersCount ?? problem.builders_count ?? 0,
    posterName: problem.posterName ?? problem.poster_name ?? "Anonymous",
    posterId: problem.posterId ?? problem.poster_id ?? null,
    comments: problem.comments ?? 0,
    posted: problem.posted ?? problem.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    tags: Array.isArray(problem.tags)
      ? problem.tags
      : typeof problem.tags === "string" && problem.tags.trim()
      ? problem.tags.split(",").map(tag => tag.trim())
      : [],
  };
}

function normalizeSolution(solution) {
  return {
    ...solution,
    problemId: solution.problemId ?? solution.problem_id ?? null,
    builderId: solution.builderId ?? solution.builder_id ?? null,
    builder: solution.builder ?? solution.builder_name ?? "Builder",
    progress: Number(solution.progress ?? 0),
    teamSize: Number(solution.teamSize ?? solution.team_size ?? 1),
    launchIn: solution.launchIn ?? solution.launch_in ?? "TBD",
    status: solution.status ?? "in_progress",
    title: solution.title ?? "Untitled solution",
    description: solution.description ?? "",
    bountyEarned: Number(solution.bountyEarned ?? solution.bounty_earned ?? 0),
  };
}

//  Styles 

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f7f5f0;
    --surface: #ffffff;
    --surface2: #f0ede8;
    --border: #e2ddd8;
    --border2: #c8c3bc;
    --text: #1a1815;
    --text2: #5a5650;
    --text3: #9a9590;
    --accent: #c84b2f;
    --accent2: #e86040;
    --accent-bg: #fff0ed;
    --teal: #0f766e;
    --teal-bg: #f0fdf9;
    --purple: #6d28d9;
    --purple-bg: #f5f3ff;
    --amber: #d97706;
    --amber-bg: #fffbeb;
    --blue: #1d4ed8;
    --blue-bg: #eff6ff;
    --green: #15803d;
    --green-bg: #f0fdf4;
    --red: #dc2626;
    --red-bg: #fef2f2;
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --radius: 10px;
    --radius-lg: 14px;
    --font-display: 'DM Serif Display', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 14px; line-height: 1.6; min-height: 100vh; }

  /* Layout */
  .app { display: flex; flex-direction: column; min-height: 100vh; }
  .nav { background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
  .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 58px; display: flex; align-items: center; gap: 24px; }
  .logo { font-family: var(--font-display); font-size: 20px; color: var(--text); cursor: pointer; display: flex; align-items: center; gap: 8px; }
  .logo-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; display: inline-block; }
  .nav-links { display: flex; gap: 2px; margin-left: 16px; }
  .nav-link { padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--text2); transition: all 0.15s; font-weight: 500; border: none; background: none; }
  .nav-link:hover { background: var(--surface2); color: var(--text); }
  .nav-link.active { background: var(--accent-bg); color: var(--accent); }
  .nav-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; font-family: var(--font-body); }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: var(--accent2); }
  .btn-secondary { background: var(--surface); border-color: var(--border); color: var(--text); }
  .btn-secondary:hover { background: var(--surface2); }
  .btn-ghost { background: none; border-color: transparent; color: var(--text2); }
  .btn-ghost:hover { background: var(--surface2); color: var(--text); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-teal { background: var(--teal); color: white; }
  .btn-teal:hover { opacity: 0.9; }

  .page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; flex: 1; }

  /* Cards */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
  .card-hover { transition: box-shadow 0.15s, transform 0.15s; cursor: pointer; }
  .card-hover:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }

  /* Problem card */
  .problem-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
  .problem-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .problem-title { font-size: 15px; font-weight: 600; line-height: 1.4; flex: 1; }
  .problem-score-badge { min-width: 52px; text-align: center; }
  .score-num { font-size: 22px; font-weight: 700; line-height: 1; }
  .score-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .problem-meta { font-size: 12px; color: var(--text2); display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .problem-meta-sep { color: var(--border2); }
  .problem-footer { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .badge-red { background: var(--red-bg); color: var(--red); }
  .badge-amber { background: var(--amber-bg); color: var(--amber); }
  .badge-green { background: var(--green-bg); color: var(--green); }
  .badge-blue { background: var(--blue-bg); color: var(--blue); }
  .badge-teal { background: var(--teal-bg); color: var(--teal); }
  .badge-purple { background: var(--purple-bg); color: var(--purple); }
  .badge-gray { background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }

  /* Grid layouts */
  .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
  @media (max-width: 768px) { .grid-3, .grid-4 { grid-template-columns: 1fr 1fr; } .grid-2 { grid-template-columns: 1fr; } }
  @media (max-width: 500px) { .grid-3, .grid-4, .grid-2 { grid-template-columns: 1fr; } }

  /* Stat card */
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
  .stat-label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500; margin-bottom: 6px; }
  .stat-value { font-size: 28px; font-weight: 700; line-height: 1; color: var(--text); }
  .stat-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }

  /* Filters */
  .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
  .filter-chip { padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text2); transition: all 0.15s; }
  .filter-chip:hover { border-color: var(--border2); color: var(--text); }
  .filter-chip.active { background: var(--accent); border-color: var(--accent); color: white; }
  .filter-chip-sm { padding: 4px 10px; font-size: 11px; }

  /* Forms */
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input { padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; font-family: var(--font-body); background: var(--surface); color: var(--text); transition: border-color 0.15s; outline: none; width: 100%; }
  .form-input:focus { border-color: var(--accent); }
  .form-textarea { min-height: 100px; resize: vertical; }
  .form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9590' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; cursor: pointer; }
  .form-hint { font-size: 11px; color: var(--text3); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* Search */
  .search-wrap { position: relative; flex: 1; max-width: 360px; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text3); font-size: 14px; }
  .search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: var(--surface); outline: none; transition: border-color 0.15s; }
  .search-input:focus { border-color: var(--border2); }

  /* Tabs */
  .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
  .tab { padding: 10px 18px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text2); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  /* Problem detail */
  .detail-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
  @media (max-width: 900px) { .detail-layout { grid-template-columns: 1fr; } }

  /* Vote button */
  .vote-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; border: 1px solid var(--border); background: var(--surface); min-width: 52px; }
  .vote-btn.voted { background: var(--accent-bg); border-color: var(--accent); }
  .vote-btn:hover { border-color: var(--accent); }
  .vote-count { font-size: 15px; font-weight: 700; line-height: 1; }
  .vote-label { font-size: 10px; color: var(--text3); }

  /* Progress bar */
  .progress-bar { height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; background: var(--teal); transition: width 0.3s; }

  /* Avatar */
  .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .avatar-lg { width: 44px; height: 44px; font-size: 14px; }
  .avatar-accent { background: var(--accent-bg); color: var(--accent); }
  .avatar-teal { background: var(--teal-bg); color: var(--teal); }
  .avatar-purple { background: var(--purple-bg); color: var(--purple); }

  /* Bounty */
  .bounty-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 20px; font-size: 11px; font-weight: 600; color: #92400e; }

  /* Empty state */
  .empty { text-align: center; padding: 48px 24px; color: var(--text3); }
  .empty-title { font-size: 16px; font-weight: 600; color: var(--text2); margin-bottom: 8px; }

  /* Hero */
  .hero { background: var(--surface); border-bottom: 1px solid var(--border); padding: 48px 24px 40px; text-align: center; }
  .hero-inner { max-width: 640px; margin: 0 auto; }
  .hero-eyebrow { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 14px; }
  .hero-title { font-family: var(--font-display); font-size: 44px; line-height: 1.1; color: var(--text); margin-bottom: 16px; }
  .hero-title em { color: var(--accent); font-style: italic; }
  .hero-sub { font-size: 16px; color: var(--text2); line-height: 1.6; margin-bottom: 28px; }
  .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .hero-stats { display: flex; gap: 32px; justify-content: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
  .hero-stat-val { font-size: 24px; font-weight: 700; color: var(--text); }
  .hero-stat-label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }

  /* Section titles */
  .section-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .section-sub { font-size: 13px; color: var(--text2); margin-bottom: 20px; }

  /* Sidebar sections */
  .sidebar-card { padding: 16px; margin-bottom: 16px; }
  .sidebar-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text3); margin-bottom: 12px; }

  /* Comment */
  .comment { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .comment:last-child { border-bottom: none; }
  .comment-body { flex: 1; }
  .comment-author { font-size: 12px; font-weight: 600; }
  .comment-time { font-size: 11px; color: var(--text3); }
  .comment-text { font-size: 13px; color: var(--text2); margin-top: 4px; line-height: 1.5; }

  /* Tag pills */
  .tag { display: inline-block; padding: 2px 8px; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; font-size: 11px; color: var(--text2); font-weight: 500; }

  /* Notification dot */
  .notif-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; flex-shrink: 0; }

  /* Leaderboard */
  .lb-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .lb-rank { font-size: 13px; font-weight: 700; color: var(--text3); width: 24px; }
  .lb-name { font-weight: 600; font-size: 13px; flex: 1; }
  .lb-score { font-size: 13px; font-weight: 700; color: var(--accent); }

  /* Divider */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* Sort select */
  .sort-select { padding: 6px 28px 6px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 12px; font-family: var(--font-body); background: var(--surface); color: var(--text); outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239a9590' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; cursor: pointer; }

  /* Notification toast */
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--text); color: white; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; z-index: 1000; animation: slideUp 0.2s ease; box-shadow: var(--shadow-md); }
  @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  /* Scrollable list */
  .scroll-list { display: flex; flex-direction: column; gap: 8px; }

  /* Severity meter */
  .sev-bar { display: flex; gap: 3px; margin-top: 6px; }
  .sev-block { height: 6px; flex: 1; border-radius: 2px; }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-title { font-size: 32px; }
    .page { padding: 20px 16px; }
    .nav-links { display: none; }
  }
`;

//  Components 

function SeverityBar({ value }) {
  return (
    <div className="sev-bar">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="sev-block" style={{ background: i < value ? scoreColor(value) : "var(--border)" }} />
      ))}
    </div>
  );
}

function Avatar({ name, size = "sm", color = "accent" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <div className={`avatar${size === "lg" ? " avatar-lg" : ""} avatar-${color}`}>{initials}</div>;
}

function ProblemCard({ problem, onClick, voted, onVote }) {
  const sb = statusBadge(problem.status);
  return (
    <div className="card card-hover problem-card" onClick={onClick}>
      <div className="problem-header">
        <div className="problem-title">{problem.title}</div>
        <div className="problem-score-badge">
          <div className="score-num" style={{ color: scoreColor(problem.score) }}>{problem.score}</div>
          <div className="score-label">score</div>
        </div>
      </div>
      <div className="problem-meta">
        <span>{problem.industry}</span>
        <span className="problem-meta-sep"></span>
        <span>{problem.region}</span>
        <span className="problem-meta-sep"></span>
        <span>{fmtNum(problem.meToo)} &quot;me too&quot;</span>
        <span className="problem-meta-sep"></span>
        <span>{timeAgo(problem.posted)}</span>
      </div>
      <div className="problem-footer">
        <span className="badge" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
        {problem.severity >= 8 && <span className="badge badge-red">High severity</span>}
        {problem.bounty > 0 && <span className="bounty-tag"> ${problem.bounty.toLocaleString()} bounty</span>}
        {problem.buildersCount > 0 && <span className="badge badge-teal">{problem.buildersCount} builder{problem.buildersCount > 1 ? "s" : ""}</span>}
        <span className="badge badge-gray">{problem.frequency}</span>
        <div style={{ marginLeft: "auto" }}>
          <div className={`vote-btn${voted ? " voted" : ""}`} onClick={e => { e.stopPropagation(); onVote(problem.id); }}>
            <span style={{ fontSize: 14 }}></span>
            <span className="vote-count" style={{ color: voted ? "var(--accent)" : "var(--text)" }}>{fmtNum(problem.votes + (voted ? 1 : 0))}</span>
            <span className="vote-label">votes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

//  Pages 

function HomePage({ setPage, problems, stats }) {
  return (
    <div>
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">Problem marketplace</div>
          <h1 className="hero-title">Real problems.<br /><em>Real opportunities.</em></h1>
          <p className="hero-sub">Post the frustrations you face every day. Discover them as validated startup ideas. Build solutions people actually need.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setPage("post")} style={{ padding: "10px 24px", fontSize: 15 }}>Post a problem {"\u2192"}</button>
            <button className="btn btn-secondary" onClick={() => setPage("browse")} style={{ padding: "10px 24px", fontSize: 15 }}>Browse problems</button>
          </div>
          <div className="hero-stats">
            <div style={{ textAlign: "center" }}>
              <div className="hero-stat-val">{stats.problemsPosted.toLocaleString()}</div>
              <div className="hero-stat-label">Problems posted</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="hero-stat-val">{stats.beingBuilt.toLocaleString()}</div>
              <div className="hero-stat-label">Being built</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="hero-stat-val">${fmtNum(stats.activeBounties)}</div>
              <div className="hero-stat-label">Active bounties</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="hero-stat-val">{stats.solved.toLocaleString()}</div>
              <div className="hero-stat-label">Solved</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <div className="section-title">Trending problems</div>
            <div className="section-sub">Highest-scored unsolved opportunities right now</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage("browse")}>View all {"\u2192"}</button>
        </div>
        <div className="scroll-list">
          {problems.slice(0, 4).map(p => (
            <div key={p.id} className="card problem-card" style={{ cursor: "default" }}>
              <div className="problem-header">
                <div className="problem-title" style={{ cursor: "pointer", color: "var(--blue)" }} onClick={() => setPage({ name: "detail", id: p.id })}>{p.title}</div>
                <div className="problem-score-badge">
                  <div className="score-num" style={{ color: scoreColor(p.score) }}>{p.score}</div>
                  <div className="score-label">score</div>
                </div>
              </div>
              <div className="problem-meta">
                <span>{p.industry}</span><span className="problem-meta-sep"></span>
                <span>{fmtNum(p.meToo)} &quot;me too&quot;</span><span className="problem-meta-sep"></span>
                <span>{timeAgo(p.posted)}</span>
              </div>
              <div className="problem-footer">
                <span className="badge" style={{ background: statusBadge(p.status).bg, color: statusBadge(p.status).color }}>{statusBadge(p.status).label}</span>
                {p.bounty > 0 && <span className="bounty-tag"> ${p.bounty.toLocaleString()}</span>}
                {p.buildersCount > 0 && <span className="badge badge-teal">{p.buildersCount} builder{p.buildersCount > 1 ? "s" : ""}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="section-title" style={{ marginBottom: 16 }}>Browse by industry</div>
        <div className="grid-4">
          {INDUSTRIES.filter(i => i !== "All").map(ind => {
            const count = problems.filter(p => p.industry === ind).length;
            const topScore = Math.max(...problems.filter(p => p.industry === ind).map(p => p.score), 0);
            return (
              <div key={ind} className="card card-hover" style={{ padding: "14px 16px" }} onClick={() => setPage({ name: "browse", industry: ind })}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ind}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{count} problem{count !== 1 ? "s" : ""}</div>
                {topScore > 0 && <div style={{ fontSize: 11, color: scoreColor(topScore), fontWeight: 600, marginTop: 4 }}>Top score: {topScore}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BrowsePage({ problems, setPage, votes, onVote, initialIndustry }) {
  const [industry, setIndustry] = useState(initialIndustry || "All");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = problems
    .filter(p => industry === "All" || p.industry === industry)
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "score" ? b.score - a.score : sort === "votes" ? b.votes - a.votes : sort === "metoo" ? b.meToo - a.meToo : new Date(b.posted) - new Date(a.posted));

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div className="section-title">Browse problems</div>
          <div className="section-sub">{filtered.length} problems found</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-wrap">
            <span className="search-icon"></span>
            <input className="search-input" placeholder="Search problems\u2026" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="score">By score</option>
            <option value="votes">By votes</option>
            <option value="metoo">By &quot;me too&quot;</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="filter-bar">
        {INDUSTRIES.map(ind => (
          <div key={ind} className={`filter-chip${industry === ind ? " active" : ""}`} onClick={() => setIndustry(ind)}>{ind}</div>
        ))}
      </div>

      <div className="filter-bar" style={{ marginBottom: 24 }}>
        {[["all", "All statuses"], ["open", "Open"], ["being_built", "Being built"], ["solved", "Solved"]].map(([val, label]) => (
          <div key={val} className={`filter-chip filter-chip-sm${statusFilter === val ? " active" : ""}`} onClick={() => setStatusFilter(val)}>{label}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty"><div className="empty-title">No problems found</div><p>Try adjusting your filters or search query.</p></div>
      ) : (
        <div className="scroll-list">
          {filtered.map(p => (
            <ProblemCard key={p.id} problem={p} voted={votes.includes(p.id)} onVote={onVote} onClick={() => setPage({ name: "detail", id: p.id })} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailPage({ problem, setPage, votes, onVote, onMeToo, meToos, solutions }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const sb = statusBadge(problem.status);
  const meSolution = solutions.find(s => s.problemId === problem.id);
  const didVote = votes.includes(problem.id);
  const didMeToo = meToos.includes(problem.id);

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage("browse")}> Back to problems</button>
      </div>

      <div className="detail-layout">
        <div>
          <div className="card" style={{ padding: "24px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <span className="badge" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
              <span className="badge badge-gray">{problem.industry}</span>
              <span className="badge badge-gray">{problem.region}</span>
              <span className="badge badge-gray">{problem.frequency}</span>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1.3, marginBottom: 16 }}>{problem.title}</h1>

            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div className={`vote-btn${didVote ? " voted" : ""}`} onClick={() => onVote(problem.id)} style={{ flexDirection: "row", gap: 8 }}>
                <span></span>
                <span style={{ fontWeight: 700 }}>{fmtNum(problem.votes + (didVote ? 1 : 0))}</span>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>votes</span>
              </div>
              <div className={`vote-btn${didMeToo ? " voted" : ""}`} onClick={() => onMeToo(problem.id)} style={{ flexDirection: "row", gap: 8 }}>
                <span></span>
                <span style={{ fontWeight: 700 }}>{fmtNum(problem.meToo + (didMeToo ? 1 : 0))}</span>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>me too</span>
              </div>
              <div style={{ display: "flex", flex: 1, gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor(problem.score), lineHeight: 1 }}>{problem.score}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Problem score</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 20 }}>{problem.description}</div>

            <div className="divider" />

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Who faces this</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{problem.who}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Severity</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{problem.severity}/10</div>
                <SeverityBar value={problem.severity} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Posted by</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{problem.posterName}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{timeAgo(problem.posted)}</div>
              </div>
            </div>

            {problem.tags?.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {problem.tags.map(t => <span key={t} className="tag">#{t}</span>)}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Community discussion ({comments.length})</div>
            <div>
              {comments.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 10 }}>No comments yet. Start the discussion.</div>
              ) : comments.map(c => (
                <div key={c.id} className="comment">
                  <Avatar name={c.author} color="purple" />
                  <div className="comment-body">
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <span className="comment-author">{c.author}</span>
                      <span className="comment-time">{c.time}</span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <Avatar name="You" color="accent" />
              <div style={{ flex: 1 }}>
                <textarea className="form-input form-textarea" style={{ minHeight: 72 }} placeholder="Add context, examples, or your experience\u2026" value={comment} onChange={e => setComment(e.target.value)} />
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => {
                  if (!comment.trim()) return;
                  setComments(prev => [...prev, { id: Date.now(), author: "You", time: "just now", text: comment }]);
                  setComment("");
                }}>Post comment</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          {problem.bounty > 0 && (
            <div className="card sidebar-card" style={{ marginBottom: 16, border: "1px solid #fde68a", background: "#fffef7" }}>
              <div className="sidebar-title" style={{ color: "var(--amber)" }}>Active bounty</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--amber)", lineHeight: 1, marginBottom: 4 }}>${problem.bounty.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>Paid out when poster marks a solution accepted. Funds held in escrow.</div>
              {!claimed ? (
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", background: "var(--amber)" }}
                  onClick={() => { setClaiming(true); setTimeout(() => { setClaimed(true); setClaiming(false); }, 800); }}>
                  {claiming ? "Claiming\u2026" : "Claim this bounty \u2192"}
                </button>
              ) : (
                <div className="badge badge-green" style={{ fontSize: 12 }}>{"\u2713"} Bounty claimed {"\u2014"} start building!</div>
              )}
            </div>
          )}

          {meSolution && (
            <div className="card sidebar-card" style={{ marginBottom: 16 }}>
              <div className="sidebar-title">Your active build</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{meSolution.title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>{meSolution.description}</div>
              <div className="progress-bar" style={{ marginBottom: 6 }}>
                <div className="progress-fill" style={{ width: `${meSolution.progress}%` }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{meSolution.progress}% complete  {meSolution.teamSize} team members  Beta in {meSolution.launchIn}</div>
            </div>
          )}

          <div className="card sidebar-card" style={{ marginBottom: 16 }}>
            <div className="sidebar-title">Builders interested</div>
            {problem.buildersCount === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12 }}>Be the first to build a solution</div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>{problem.buildersCount} builder{problem.buildersCount > 1 ? "s" : ""} working on this</div>
            )}
            {!claimed && <button className="btn btn-teal" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPage({ name: "post-solution", id: problem.id })}>Start building {"\u2192"}</button>}
          </div>

          <div className="card sidebar-card">
            <div className="sidebar-title">Stats</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Views", "1,240"], ["Votes", fmtNum(problem.votes)], ["\"Me too\"", fmtNum(problem.meToo)], ["Comments", problem.comments], ["Solutions", problem.buildersCount]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text2)" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostPage({ onSubmit, onBrowse }) {
  const [form, setForm] = useState({ title: "", description: "", who: "", severity: 7, frequency: "Daily", industry: "Healthcare", region: "", bounty: "", tags: "" });
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [posting, setPosting] = useState(false);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit() {
    if (!form.title || !form.description || !form.who) return;
    setPosting(true);
    const didSubmit = await onSubmit({
      ...form,
      severity: Number(form.severity),
      bounty: Number(form.bounty) || 0,
      meToo: 0, votes: 0, score: Number(form.severity) * 0.7,
      status: "open", buildersCount: 0, comments: 0,
      posted: new Date().toISOString().slice(0, 10),
      posterName: "You", posterId: 1,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()) : []
    });
    if (didSubmit) setSubmitted(true);
    setPosting(false);
  }

  if (submitted) return (
    <div className="page" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}></div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 12 }}>Problem posted!</div>
        <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.7 }}>Your problem is now live and searchable. The community will start validating it, and builders will discover it through the feed and weekly digest.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Post another</button>
          <button className="btn btn-secondary" onClick={onBrowse}>Browse problems</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="section-title">Post a problem</div>
        <div className="section-sub">Describe a real frustration you face. Be specific {"\u2014"} the more concrete, the more valuable.</div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ height: 4, flex: 1, borderRadius: 2, background: s <= step ? "var(--accent)" : "var(--border)", transition: "background 0.2s" }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>Step {step} of 3</div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {step === 1 && <>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Describe the problem</div>
          <div className="form-group">
            <label className="form-label">Problem title *</label>
            <input className="form-input" placeholder="e.g. Hospital billing is opaque and impossible to understand" value={form.title} onChange={e => update("title", e.target.value)} />
            <span className="form-hint">Be specific. Imagine a developer searching for this exact problem.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Full description *</label>
            <textarea className="form-input form-textarea" style={{ minHeight: 130 }} placeholder="Describe the problem in detail. Include your personal experience, what you've tried, and why existing solutions don't work." value={form.description} onChange={e => update("description", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Who faces this problem? *</label>
            <input className="form-input" placeholder="e.g. Freelance designers and independent consultants" value={form.who} onChange={e => update("who", e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => form.title && form.description && form.who && setStep(2)} style={{ marginTop: 8 }}>Continue {"\u2192"}</button>
        </>}

        {step === 2 && <>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Categorise and score</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="form-input form-select" value={form.industry} onChange={e => update("industry", e.target.value)}>
                {INDUSTRIES.filter(i => i !== "All").map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <input className="form-input" placeholder="e.g. USA, India, Global" value={form.region} onChange={e => update("region", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Severity: {form.severity}/10</label>
            <input type="range" min={1} max={10} value={form.severity} onChange={e => update("severity", e.target.value)} style={{ width: "100%", accentColor: scoreColor(form.severity) }} />
            <SeverityBar value={Number(form.severity)} />
            <span className="form-hint">How badly does this affect you? (1 = minor annoyance, 10 = critical, recurring pain)</span>
          </div>
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select className="form-input form-select" value={form.frequency} onChange={e => update("frequency", e.target.value)}>
              {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" placeholder="e.g. billing, insurance, transparency" value={form.tags} onChange={e => update("tags", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Continue {"\u2192"}</button>
          </div>
        </>}

        {step === 3 && <>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Add a bounty (optional)</div>
          <div style={{ background: "var(--amber-bg)", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "var(--amber)", lineHeight: 1.6 }}>
             Offering a bounty dramatically increases builder interest. Funds are held in escrow and only released when you mark a solution accepted.
          </div>
          <div className="form-group">
            <label className="form-label">Bounty amount (USD)</label>
            <input className="form-input" type="number" placeholder="0 \u2014 leave blank for no bounty" value={form.bounty} onChange={e => update("bounty", e.target.value)} />
          </div>
          <div className="divider" />
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Review your problem</div>
          <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{form.title || "(no title)"}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{form.industry}  {form.region || "Global"}  Severity {form.severity}/10  {form.frequency}</div>
            {form.bounty > 0 && <div style={{ fontSize: 12, color: "var(--amber)", fontWeight: 600, marginTop: 4 }}>Bounty: ${Number(form.bounty).toLocaleString()}</div>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}> Back</button>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1, justifyContent: "center" }} disabled={posting}>{posting ? "Publishing\u2026" : "Publish problem \u2192"}</button>
          </div>
        </>}
      </div>
    </div>
  );
}

function DashboardPage({ problems, solutions, setPage, currentUser }) {
  const [tab, setTab] = useState("overview");
  const currentUserId = currentUser?.id || null;
  const currentUserEmail = currentUser?.email || "You";
  const myProblems = problems.filter(p => String(p.posterId) === String(currentUserId));
  const mySolutions = solutions.filter(s => String(s.builderId) === String(currentUserId));
  const builderScore = mySolutions.reduce((sum, solution) => sum + Math.round(solution.progress * 10), 0);
  const bountyEarned = mySolutions.reduce((sum, solution) => sum + solution.bountyEarned, 0);
  const solutionsShipped = mySolutions.filter(s => ["shipped", "launched", "completed"].includes(String(s.status).toLowerCase())).length;
  const recentActivity = [...problems]
    .sort((a, b) => new Date(b.posted) - new Date(a.posted))
    .slice(0, 5)
    .map(problem => ({
      text: `New problem posted: ${problem.title}`,
      time: timeAgo(problem.posted),
    }));

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 8 }}>
          <Avatar name="You" size="lg" color="accent" />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Your dashboard</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>Builder  Poster  {currentUserEmail}</div>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[["Problems posted", myProblems.length, "var(--accent)"], ["Builder score", builderScore, "var(--teal)"], ["Bounties earned", `$${bountyEarned.toLocaleString()}`, "var(--amber)"], ["Solutions shipped", solutionsShipped, "var(--purple)"]].map(([label, val, color]) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[["overview", "Overview"], ["my-problems", "My problems"], ["building", "Building"], ["notifications", "Activity"]].map(([key, label]) => (
          <div key={key} className={`tab${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>{label}</div>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid-2">
          <div>
            <div className="section-title" style={{ marginBottom: 12 }}>Reputation</div>
            <div className="card" style={{ padding: 20 }}>
              {[["Poster score", myProblems.reduce((sum, p) => sum + Math.round((p.score || 0) * 100), 0), 5000, "var(--accent)"], ["Builder score", builderScore, 5000, "var(--teal)"], ["Community trust", Math.min(100, myProblems.length * 10 + mySolutions.length * 12), 100, "var(--purple)"]].map(([label, val, max, color]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{label}</span>
                    <span style={{ color, fontWeight: 700 }}>{val}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(val / max) * 100}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="section-title" style={{ marginBottom: 12 }}>Active build</div>
            {mySolutions.length === 0 ? (
              <div className="card" style={{ padding: 20, fontSize: 13, color: "var(--text3)" }}>No active builds yet.</div>
            ) : mySolutions.map(s => (
              <div key={s.id} className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>{s.description}</div>
                <div className="progress-bar" style={{ marginBottom: 6 }}>
                  <div className="progress-fill" style={{ width: `${s.progress}%` }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>{s.progress}% complete  {s.teamSize} team members  Beta in {s.launchIn}</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage({ name: "detail", id: s.problemId })}>View problem {"\u2192"}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "my-problems" && (
        <div>
          {myProblems.length === 0 ? (
            <div className="empty"><div className="empty-title">No problems posted yet</div><p>Share your first frustration and help builders find what to build.</p><br /><button className="btn btn-primary" onClick={() => setPage("post")}>Post a problem</button></div>
          ) : (
            <div className="scroll-list">
              {myProblems.map(p => (
                <div key={p.id} className="card problem-card" onClick={() => setPage({ name: "detail", id: p.id })} style={{ cursor: "pointer" }}>
                  <div className="problem-header">
                    <div className="problem-title">{p.title}</div>
                    <div className="problem-score-badge">
                      <div className="score-num" style={{ color: scoreColor(p.score) }}>{p.score}</div>
                      <div className="score-label">score</div>
                    </div>
                  </div>
                  <div className="problem-meta"><span>{fmtNum(p.meToo)} &quot;me too&quot;</span><span className="problem-meta-sep"></span><span>{fmtNum(p.votes)} votes</span><span className="problem-meta-sep"></span><span>{p.comments} comments</span></div>
                  <div className="problem-footer">
                    <span className="badge" style={{ background: statusBadge(p.status).bg, color: statusBadge(p.status).color }}>{statusBadge(p.status).label}</span>
                    {p.bounty > 0 && <span className="bounty-tag"> ${p.bounty.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "building" && (
        <div>
          {mySolutions.length === 0 ? (
            <div className="empty"><div className="empty-title">Not building anything yet</div><p>Browse problems and claim one to start building.</p><br /><button className="btn btn-teal" onClick={() => setPage("browse")}>Browse problems</button></div>
          ) : (
            mySolutions.map(s => (
              <div key={s.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>{s.description}</div>
                  </div>
                  <span className={`badge badge-amber`}>{s.status}</span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 6 }}>
                  <div className="progress-fill" style={{ width: `${s.progress}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
                  <span>{s.progress}% complete</span>
                  <span>{s.teamSize} team members</span>
                  <span>Beta in {s.launchIn}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm">Update progress</button>
                  <button className="btn btn-secondary btn-sm">Find co-founder</button>
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}>Mark as launched </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "notifications" && (
        <div className="card" style={{ padding: 20 }}>
          {recentActivity.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text3)" }}>No activity yet.</div>
          ) : recentActivity.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="notif-dot" style={{ marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{n.text}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardPage({ problems, solutions, currentUser }) {
  const currentUserName = currentUser?.email || "You";

  const topPosters = Object.values(
    problems.reduce((acc, problem) => {
      const key = problem.posterName || "Anonymous";
      if (!acc[key]) {
        acc[key] = { name: key, score: 0, problems: 0, meToo: 0 };
      }
      acc[key].score += Math.round((problem.score || 0) * 100);
      acc[key].problems += 1;
      acc[key].meToo += problem.meToo || 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topBuilders = Object.values(
    solutions.reduce((acc, solution) => {
      const key = solution.builder || "Builder";
      if (!acc[key]) {
        acc[key] = { name: key, score: 0, shipped: 0, bountyEarned: 0 };
      }
      acc[key].score += Math.round((solution.progress || 0) * 10);
      if (["shipped", "launched", "completed"].includes(String(solution.status).toLowerCase())) {
        acc[key].shipped += 1;
      }
      acc[key].bountyEarned += solution.bountyEarned || 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="page">
      <div className="section-title">Leaderboard</div>
      <div className="section-sub">Top contributors building the problem marketplace</div>

      <div className="grid-2">
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Top problem posters</div>
          <div className="card" style={{ padding: "8px 20px" }}>
            {topPosters.length === 0 ? (
              <div style={{ padding: "12px 0", fontSize: 13, color: "var(--text3)" }}>No poster data yet.</div>
            ) : topPosters.map((u, i) => (
              <div key={u.name} className="lb-row" style={u.name === currentUserName ? { background: "var(--accent-bg)", margin: "0 -20px", padding: "10px 20px" } : {}}>
                <div className="lb-rank" style={{ color: i < 3 ? ["#f59e0b", "#94a3b8", "#cd7c2f"][i] : "var(--text3)" }}>#{i + 1}</div>
                <Avatar name={u.name} color={["accent", "teal", "purple", "accent", "teal"][i]} />
                <div className="lb-name">{u.name}{u.name === currentUserName && <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: 10 }}>you</span>}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{u.problems} problems</div>
                <div className="lb-score">{u.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Top builders</div>
          <div className="card" style={{ padding: "8px 20px" }}>
            {topBuilders.length === 0 ? (
              <div style={{ padding: "12px 0", fontSize: 13, color: "var(--text3)" }}>No builder data yet.</div>
            ) : topBuilders.map((u, i) => (
              <div key={u.name} className="lb-row" style={u.name === currentUserName ? { background: "var(--accent-bg)", margin: "0 -20px", padding: "10px 20px" } : {}}>
                <div className="lb-rank" style={{ color: i < 3 ? ["#f59e0b", "#94a3b8", "#cd7c2f"][i] : "var(--text3)" }}>#{i + 1}</div>
                <Avatar name={u.name} color={["teal", "purple", "accent", "accent", "teal"][i]} />
                <div className="lb-name">{u.name}{u.name === currentUserName && <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: 10 }}>you</span>}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>${u.bountyEarned.toLocaleString()}</div>
                <div className="lb-score" style={{ color: "var(--teal)" }}>{u.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="section-title" style={{ marginBottom: 16 }}>Highest-scored problems ever</div>
      <div className="scroll-list">
        {[...problems].sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
          <div key={p.id} className="card" style={{ padding: "14px 20px", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text3)", width: 28 }}>#{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{p.industry}  {fmtNum(p.meToo)} &quot;me too&quot;s</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(p.score) }}>{p.score}</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

//App 
export default function App() {
  const router = useRouter();
  const [page, setPage] = useState("home");
  const [problems, setProblems] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [meToos, setMeToos] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  const homeStats = useMemo(() => {
    const problemsPosted = problems.length;
    const beingBuilt = problems.filter(problem => problem.status === "being_built").length;
    const solved = problems.filter(problem => problem.status === "solved").length;
    const activeBounties = problems
      .filter(problem => problem.status !== "solved")
      .reduce((sum, problem) => sum + (problem.bounty || 0), 0);

    return { problemsPosted, beingBuilt, activeBounties, solved };
  }, [problems]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setLoading(true);
      const [{ data, error }, { data: solutionsData, error: solutionsError }, { data: userData }] = await Promise.all([
        supabase.from("problems").select("*").order("score", { ascending: false }),
        supabase.from("solutions").select("*"),
        supabase.auth.getUser(),
      ]);

      if (!isMounted) return;

      if (error) {
        showToast("Failed to load problems");
      } else {
        setProblems((data || []).map(normalizeProblem));
      }

      if (!solutionsError) {
        setSolutions((solutionsData || []).map(normalizeSolution));
      }

      setUser(userData?.user || null);
      setLoading(false);
    }

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  function onVote(id) {
    const wasVoted = votes.includes(id);
    setVotes((currentVotes) => (currentVotes.includes(id) ? currentVotes.filter((x) => x !== id) : [...currentVotes, id]));
    showToast(wasVoted ? "Vote removed" : "Voted!");
  }

  function onMeToo(id) {
    const wasMarked = meToos.includes(id);
    setMeToos((currentMeToos) => (currentMeToos.includes(id) ? currentMeToos.filter((x) => x !== id) : [...currentMeToos, id]));
    showToast(wasMarked ? "Removed" : '"Me too" added');
  }

  async function loadProblems() {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .order("score", { ascending: false });

    if (error) {
      showToast("Could not refresh problems");
      return;
    }

    setProblems((data || []).map(normalizeProblem));
  }

  async function loadSolutions() {
    const { data, error } = await supabase.from("solutions").select("*");
    if (error) return;
    setSolutions((data || []).map(normalizeSolution));
  }

  async function onPostProblem(form) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      showToast("Please sign in to post");
      return false;
    }

    const parsedTags = Array.isArray(form.tags)
      ? form.tags
      : typeof form.tags === "string" && form.tags.trim()
      ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

    const payload = {
      title: form.title,
      description: form.description,
      who: form.who,
      severity: Number(form.severity),
      frequency: form.frequency,
      industry: form.industry,
      region: form.region,
      bounty: Number(form.bounty) || 0,
      tags: parsedTags,
      status: "open",
      user_id: currentUser.id,
      score: Number(form.severity) * 0.7,
      me_too: 0,
      votes: 0,
      builders_count: 0,
      comments: 0,
      poster_name: currentUser.email || "You",
      poster_id: currentUser.id,
    };

    const { error } = await supabase.from("problems").insert(payload);

    if (error) {
      showToast(error.message ? `Could not publish: ${error.message}` : "Could not publish problem");
      return false;
    }

    await Promise.all([loadProblems(), loadSolutions()]);
    setPage("browse");
    showToast("Problem published! ");
    return true;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    showToast("Signed out");
  }

  const navItems = [
    ["home", "Home"],
    ["browse", "Browse"],
    ["post", "Post problem"],
    ["dashboard", "Dashboard"],
    ["leaderboard", "Leaderboard"],
  ];

  const activePage = typeof page === "object" ? page.name : page;

  let content = null;
  if (activePage === "home") content = <HomePage setPage={setPage} problems={problems} stats={homeStats} />;
  else if (activePage === "browse") content = <BrowsePage problems={problems} setPage={setPage} votes={votes} onVote={onVote} initialIndustry={typeof page === "object" ? page.industry : null} />;
  else if (activePage === "post") content = <PostPage onSubmit={onPostProblem} onBrowse={() => setPage("browse")} />;
  else if (activePage === "dashboard") content = <DashboardPage problems={problems} solutions={solutions} setPage={setPage} currentUser={user} />;
  else if (activePage === "leaderboard") content = <LeaderboardPage problems={problems} solutions={solutions} currentUser={user} />;
  else if (activePage === "detail") {
    const prob = problems.find(p => p.id === page.id);
    if (prob) content = <DetailPage problem={prob} setPage={setPage} votes={votes} onVote={onVote} onMeToo={onMeToo} meToos={meToos} solutions={solutions} />;
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-inner">
            <div className="logo" onClick={() => setPage("home")}>
              <span className="logo-dot" />
              ProblemBase
            </div>
            <div className="nav-links">
              {navItems.map(([key, label]) => (
                <button key={key} className={`nav-link${activePage === key ? " active" : ""}`} onClick={() => setPage(key)}>{label}</button>
              ))}
            </div>
            <div className="nav-right">
              <button className="btn btn-primary btn-sm" onClick={() => setPage("post")}>+ Post problem</button>
              {user ? (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={handleSignOut}>Sign out</button>
                  <div className="avatar avatar-accent" title={user.email || "Signed in user"} style={{ cursor: "pointer" }} onClick={() => setPage("dashboard")}>YO</div>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push("/signin")}>Sign in</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push("/signup")}>Sign up</button>
                </>
              )}
            </div>
          </div>
        </nav>
        <main style={{ flex: 1 }}>
          {loading ? (
            <div className="page">
              <div className="empty">
                <div className="empty-title">Loading problems{"\u2026"}</div>
                <p>Fetching live data from Supabase.</p>
              </div>
            </div>
          ) : (
            content
          )}
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

