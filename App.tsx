import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Problem {
  id: number;
  title: string;
  description: string;
  who: string;
  industry: string;
  region: string;
  severity: number;
  frequency: string;
  meToo: number;
  votes: number;
  bounty: number;
  status: "open" | "being_built" | "solved";
  buildersCount: number;
  score: number;
  posted: string;
  posterName: string;
  posterId: number;
  comments: number;
  tags: string[];
}

interface Solution {
  id: number;
  problemId: number;
  title: string;
  builder: string;
  status: string;
  progress: number;
  teamSize: number;
  launchIn: string;
  description: string;
}

type Page =
  | "home"
  | "browse"
  | "post"
  | "dashboard"
  | "leaderboard"
  | { name: "detail"; id: number }
  | { name: "browse"; industry: string };

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "All","Healthcare","Fintech","SMB","Education",
  "Logistics","HR & Hiring","Legal","Real Estate","Climate",
];
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Occasionally"];

const SEED_PROBLEMS: Problem[] = [
  {
    id: 1,
    title: "Hospital billing is completely opaque — patients can't understand their charges",
    description:
      "After any medical visit, patients receive bills weeks later with cryptic codes, no itemization, and no way to verify accuracy. The system is designed to confuse. I've been overbilled three times and had to fight each time.",
    who: "Patients, uninsured adults, low-income families",
    industry: "Healthcare", region: "USA",
    severity: 9, frequency: "Daily", meToo: 2341, votes: 4102,
    bounty: 5000, status: "being_built", buildersCount: 3, score: 9.1,
    posted: "2025-11-14", posterName: "Sarah K.", posterId: 2,
    comments: 87, tags: ["billing", "transparency", "insurance"],
  },
  {
    id: 2,
    title: "Small restaurants can't afford proper inventory management software",
    description:
      "Every tool I've tried costs $200+/month and is built for chains, not a 12-table bistro. I end up using spreadsheets that are always wrong. I've thrown out thousands in expired stock this year alone.",
    who: "Independent restaurant owners, food truck operators",
    industry: "SMB", region: "Global",
    severity: 7, frequency: "Daily", meToo: 1087, votes: 2200,
    bounty: 0, status: "open", buildersCount: 1, score: 7.4,
    posted: "2025-12-02", posterName: "Marco R.", posterId: 3,
    comments: 34, tags: ["inventory", "restaurants", "SMB"],
  },
  {
    id: 3,
    title: "No easy way to track medications for elderly parents who live alone",
    description:
      "My mother takes 8 medications at different times. I live 3 hours away. Every app I've tried is too complex for her, and pill dispensers don't sync to my phone. She missed critical doses twice last year.",
    who: "Adult children of elderly parents, caregivers",
    industry: "Healthcare", region: "India",
    severity: 8, frequency: "Daily", meToo: 876, votes: 1540,
    bounty: 1200, status: "open", buildersCount: 0, score: 8.2,
    posted: "2026-01-08", posterName: "Priya M.", posterId: 4,
    comments: 52, tags: ["elderly", "caregiving", "medication"],
  },
  {
    id: 4,
    title: "Freelancers have no straightforward way to chase overdue invoices",
    description:
      "I spend 3–5 hours per week just following up on unpaid invoices. There's no tool that automatically escalates, sends legal-sounding reminders, and tracks the full paper trail without costing a fortune.",
    who: "Freelance designers, developers, consultants",
    industry: "Fintech", region: "Global",
    severity: 8, frequency: "Weekly", meToo: 3210, votes: 5600,
    bounty: 2500, status: "being_built", buildersCount: 2, score: 8.7,
    posted: "2025-10-20", posterName: "Alex T.", posterId: 5,
    comments: 113, tags: ["invoicing", "freelance", "payments"],
  },
  {
    id: 5,
    title: "Teachers can't easily identify which students are falling behind in real time",
    description:
      "With 35 kids in a class, I have no dashboard showing me who's struggling with what. By the time I notice a pattern it's been weeks. Existing tools are either too expensive or require 2 hours of setup per student.",
    who: "Primary and secondary school teachers",
    industry: "Education", region: "UK",
    severity: 7, frequency: "Daily", meToo: 921, votes: 1780,
    bounty: 800, status: "open", buildersCount: 1, score: 7.1,
    posted: "2026-01-22", posterName: "James O.", posterId: 6,
    comments: 29, tags: ["education", "classroom", "analytics"],
  },
  {
    id: 6,
    title: "Truck drivers can't find available parking at rest stops before it's too late",
    description:
      "Rest stop parking fills up hours in advance, but there's no app showing real-time occupancy. I've driven 40 extra miles to find a spot. This creates dangerous situations when drivers are forced to park illegally.",
    who: "Long-haul truck drivers, logistics companies",
    industry: "Logistics", region: "USA",
    severity: 9, frequency: "Daily", meToo: 644, votes: 1100,
    bounty: 3000, status: "open", buildersCount: 0, score: 8.8,
    posted: "2026-02-11", posterName: "Dave H.", posterId: 7,
    comments: 41, tags: ["trucking", "parking", "safety"],
  },
  {
    id: 7,
    title: "Small law firms can't afford eDiscovery tools built for BigLaw",
    description:
      "The cheapest eDiscovery platforms start at $5,000/month. I represent individuals and small businesses — my whole firm runs on $8k/month revenue. I'm stuck reviewing documents manually and it kills my margins.",
    who: "Solo attorneys, small law firms (1–5 attorneys)",
    industry: "Legal", region: "USA",
    severity: 8, frequency: "Monthly", meToo: 320, votes: 680,
    bounty: 10000, status: "open", buildersCount: 2, score: 8.0,
    posted: "2026-02-28", posterName: "Dana L.", posterId: 8,
    comments: 61, tags: ["legal", "eDiscovery", "SMB"],
  },
  {
    id: 8,
    title: "HR teams lose track of contractor compliance documents across dozens of vendors",
    description:
      "We manage 80+ contractors. Their certifications, NDAs, and insurance docs expire at different times. I have a spreadsheet and a prayer. Last quarter we had an audit and two contractors were technically non-compliant.",
    who: "HR managers at mid-size companies, procurement teams",
    industry: "HR & Hiring", region: "Global",
    severity: 7, frequency: "Weekly", meToo: 540, votes: 990,
    bounty: 1500, status: "solved", buildersCount: 1, score: 7.6,
    posted: "2025-09-15", posterName: "Nisha B.", posterId: 9,
    comments: 44, tags: ["HR", "compliance", "contractors"],
  },
];

const SEED_SOLUTIONS: Solution[] = [
  {
    id: 1, problemId: 4, title: "InvoiceHound", builder: "You",
    status: "beta", progress: 60, teamSize: 2, launchIn: "3 weeks",
    description: "Automated invoice follow-up with legal escalation templates, Stripe integration, and full audit trail.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 8.5) return "#dc2626";
  if (s >= 7) return "#d97706";
  return "#16a34a";
}

function statusBadge(s: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    open:         { label: "Open",         bg: "#dbeafe", color: "#1d4ed8" },
    being_built:  { label: "Being built",  bg: "#fef9c3", color: "#92400e" },
    solved:       { label: "Solved",       bg: "#dcfce7", color: "#166534" },
  };
  return map[s] ?? map.open;
}

function fmtNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Tiny UI Primitives ───────────────────────────────────────────────────────

function Badge({
  children, variant = "gray",
}: {
  children: React.ReactNode;
  variant?: "gray" | "red" | "amber" | "green" | "blue" | "teal" | "purple";
}) {
  const styles: Record<string, React.CSSProperties> = {
    gray:   { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" },
    red:    { background: "#fee2e2", color: "#dc2626" },
    amber:  { background: "#fffbeb", color: "#d97706" },
    green:  { background: "#dcfce7", color: "#16a34a" },
    blue:   { background: "#dbeafe", color: "#1d4ed8" },
    teal:   { background: "#ccfbf1", color: "#0f766e" },
    purple: { background: "#ede9fe", color: "#6d28d9" },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 500,
      ...styles[variant],
    }}>
      {children}
    </span>
  );
}

function Avatar({
  name, size = "sm", variant = "accent",
}: {
  name: string; size?: "sm" | "lg"; variant?: "accent" | "teal" | "purple";
}) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = {
    accent: { bg: "#fff0ed", color: "#c84b2f" },
    teal:   { bg: "#ccfbf1", color: "#0f766e" },
    purple: { bg: "#ede9fe", color: "#6d28d9" },
  };
  const c = colors[variant];
  const dim = size === "lg" ? 44 : 32;
  return (
    <div style={{
      width: dim, height: dim, borderRadius: "50%", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: size === "lg" ? 14 : 11, fontWeight: 700, flexShrink: 0,
      background: c.bg, color: c.color,
    }}>
      {initials}
    </div>
  );
}

function SeverityBar({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{
          height: 5, flex: 1, borderRadius: 2,
          background: i < value ? scoreColor(value) : "#e5e7eb",
        }} />
      ))}
    </div>
  );
}

function Card({
  children, style, onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s, transform 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {children}
    </div>
  );
}

function Btn({
  children, onClick, variant = "secondary", style, disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "teal" | "amber";
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 16px", borderRadius: 8, fontSize: 13,
    fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s", border: "1px solid transparent",
    fontFamily: "inherit", opacity: disabled ? 0.6 : 1,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: "#c84b2f", color: "#fff", borderColor: "#c84b2f" },
    secondary: { background: "#fff", color: "#111", borderColor: "#e5e7eb" },
    ghost:     { background: "transparent", color: "#6b7280", borderColor: "transparent" },
    teal:      { background: "#0f766e", color: "#fff" },
    amber:     { background: "#d97706", color: "#fff" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function StatCard({ label, value, color = "#111" }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
      padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color }}>{value}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 500,
      cursor: "pointer", border: `1px solid ${active ? "#c84b2f" : "#e5e7eb"}`,
      background: active ? "#c84b2f" : "#fff",
      color: active ? "#fff" : "#6b7280",
      transition: "all 0.15s",
    }}>
      {label}
    </div>
  );
}

function ProgressBar({ value, color = "#0f766e" }: { value: number; color?: string }) {
  return (
    <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.3s" }} />
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", style,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8,
        fontSize: 14, fontFamily: "inherit", background: "#fff", color: "#111",
        outline: "none", width: "100%", boxSizing: "border-box",
        transition: "border-color 0.15s", ...style,
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#c84b2f")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    />
  );
}

function Textarea({
  value, onChange, placeholder, rows = 5,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8,
        fontSize: 14, fontFamily: "inherit", background: "#fff", color: "#111",
        outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#c84b2f")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    />
  );
}

function Select({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8,
      fontSize: 14, fontFamily: "inherit", background: "#fff", color: "#111",
      outline: "none", width: "100%", cursor: "pointer",
    }}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: "#111", color: "#fff", padding: "10px 18px",
      borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 1000,
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      animation: "slideUp 0.2s ease",
    }}>
      {msg}
    </div>
  );
}

// ─── Problem Card ─────────────────────────────────────────────────────────────

function ProblemCard({
  problem, onClick, voted, onVote,
}: {
  problem: Problem; onClick: () => void;
  voted: boolean; onVote: (id: number) => void;
}) {
  const sb = statusBadge(problem.status);
  return (
    <Card onClick={onClick} style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{problem.title}</div>
        <div style={{ textAlign: "center", minWidth: 52 }}>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: scoreColor(problem.score) }}>{problem.score}</div>
          <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>score</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span>{problem.industry}</span><span>·</span>
        <span>{problem.region}</span><span>·</span>
        <span>{fmtNum(problem.meToo)} "me too"</span><span>·</span>
        <span>{timeAgo(problem.posted)}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:500,background:sb.bg,color:sb.color }}>{sb.label}</span>
        {problem.severity >= 8 && <Badge variant="red">High severity</Badge>}
        {problem.bounty > 0 && (
          <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:20,fontSize:11,fontWeight:600,color:"#92400e" }}>
            💰 ${problem.bounty.toLocaleString()}
          </span>
        )}
        {problem.buildersCount > 0 && <Badge variant="teal">{problem.buildersCount} builder{problem.buildersCount > 1 ? "s" : ""}</Badge>}
        <Badge variant="gray">{problem.frequency}</Badge>

        <div
          onClick={(e) => { e.stopPropagation(); onVote(problem.id); }}
          style={{
            marginLeft: "auto", display:"flex", flexDirection:"column", alignItems:"center",
            gap:2, padding:"7px 12px", borderRadius:8, cursor:"pointer", minWidth:52,
            border:`1px solid ${voted ? "#c84b2f" : "#e5e7eb"}`,
            background: voted ? "#fff0ed" : "#fff",
            transition:"all 0.15s",
          }}
        >
          <span style={{ fontSize: 13 }}>▲</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: voted ? "#c84b2f" : "#111" }}>{fmtNum(problem.votes + (voted ? 1 : 0))}</span>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>votes</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const activePage = typeof page === "object" ? page.name : page;
  const links: [Page, string][] = [
    ["home", "Home"], ["browse", "Browse"], ["post", "Post a problem"],
    ["dashboard", "Dashboard"], ["leaderboard", "Leaderboard"],
  ];
  return (
    <nav style={{
      background: "#fff", borderBottom: "1px solid #e5e7eb",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 24px",
        height: 58, display: "flex", alignItems: "center", gap: 8,
      }}>
        <div
          onClick={() => setPage("home")}
          style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:"Georgia,serif", fontSize:20, color:"#111", fontWeight:700, marginRight:16 }}
        >
          <span style={{ width:8, height:8, background:"#c84b2f", borderRadius:"50%", display:"inline-block" }} />
          ProblemBase
        </div>

        <div style={{ display:"flex", gap:2 }}>
          {links.map(([key, label]) => {
            const active = activePage === (typeof key === "string" ? key : key);
            return (
              <button
                key={String(key)}
                onClick={() => setPage(key)}
                style={{
                  padding:"6px 12px", borderRadius:6, cursor:"pointer",
                  fontSize:13, fontWeight:500, border:"none", fontFamily:"inherit",
                  background: active ? "#fff0ed" : "transparent",
                  color: active ? "#c84b2f" : "#6b7280",
                  transition:"all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <Btn variant="primary" onClick={() => setPage("post")} style={{ padding:"6px 14px", fontSize:13 }}>+ Post problem</Btn>
          <Avatar name="You" size="sm" variant="accent" />
        </div>
      </div>
    </nav>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ setPage, problems }: { setPage: (p: Page) => void; problems: Problem[] }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"52px 24px 44px", textAlign:"center" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", color:"#c84b2f", marginBottom:14 }}>Problem marketplace</div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:44, lineHeight:1.1, color:"#111", marginBottom:16 }}>
            Real problems.<br /><em style={{ color:"#c84b2f" }}>Real opportunities.</em>
          </h1>
          <p style={{ fontSize:16, color:"#6b7280", lineHeight:1.7, marginBottom:28 }}>
            Post the frustrations you face every day. Discover them as validated startup ideas. Build solutions people actually need.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Btn variant="primary" onClick={() => setPage("post")} style={{ padding:"11px 28px", fontSize:15 }}>Post a problem →</Btn>
            <Btn variant="secondary" onClick={() => setPage("browse")} style={{ padding:"11px 28px", fontSize:15 }}>Browse problems</Btn>
          </div>
          <div style={{ display:"flex", gap:40, justifyContent:"center", marginTop:36, paddingTop:28, borderTop:"1px solid #e5e7eb", flexWrap:"wrap" }}>
            {[["12,847","Problems posted"],["1,204","Being built"],["$84k","Active bounties"],["342","Solved"]].map(([v,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:700, color:"#111" }}>{v}</div>
                <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"36px 24px" }}>
        {/* Trending */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Trending problems</div>
            <div style={{ fontSize:13, color:"#6b7280" }}>Highest-scored unsolved opportunities right now</div>
          </div>
          <Btn variant="secondary" onClick={() => setPage("browse")} style={{ padding:"5px 14px", fontSize:13 }}>View all →</Btn>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:36 }}>
          {problems.slice(0,4).map(p => {
            const sb = statusBadge(p.status);
            return (
              <Card key={p.id} onClick={() => setPage({ name:"detail", id:p.id })} style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:8 }}>
                  <div style={{ fontSize:15, fontWeight:600, lineHeight:1.4, flex:1, color:"#1d4ed8" }}>{p.title}</div>
                  <div style={{ textAlign:"right", minWidth:52 }}>
                    <div style={{ fontSize:22, fontWeight:800, lineHeight:1, color:scoreColor(p.score) }}>{p.score}</div>
                    <div style={{ fontSize:10, color:"#9ca3af" }}>score</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:"#6b7280", display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
                  <span>{p.industry}</span><span>·</span><span>{fmtNum(p.meToo)} "me too"</span><span>·</span><span>{timeAgo(p.posted)}</span>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:500,background:sb.bg,color:sb.color }}>{sb.label}</span>
                  {p.bounty > 0 && <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:20,fontSize:11,fontWeight:600,color:"#92400e" }}>💰 ${p.bounty.toLocaleString()}</span>}
                  {p.buildersCount > 0 && <Badge variant="teal">{p.buildersCount} builder{p.buildersCount>1?"s":""}</Badge>}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Industries */}
        <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Browse by industry</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
          {INDUSTRIES.filter(i=>i!=="All").map(ind => {
            const count = problems.filter(p=>p.industry===ind).length;
            const top = Math.max(...problems.filter(p=>p.industry===ind).map(p=>p.score),0);
            return (
              <Card key={ind} onClick={() => setPage({ name:"browse", industry:ind })} style={{ padding:"14px 16px" }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{ind}</div>
                <div style={{ fontSize:12, color:"#9ca3af" }}>{count} problem{count!==1?"s":""}</div>
                {top > 0 && <div style={{ fontSize:11, color:scoreColor(top), fontWeight:600, marginTop:4 }}>Top: {top}</div>}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Browse Page ──────────────────────────────────────────────────────────────

function BrowsePage({
  problems, setPage, votes, onVote, initialIndustry,
}: {
  problems: Problem[]; setPage: (p: Page) => void;
  votes: number[]; onVote: (id: number) => void;
  initialIndustry?: string;
}) {
  const [industry, setIndustry] = useState(initialIndustry ?? "All");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = problems
    .filter(p => industry === "All" || p.industry === industry)
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "score" ? b.score - a.score :
      sort === "votes" ? b.votes - a.votes :
      sort === "metoo" ? b.meToo - a.meToo :
      new Date(b.posted).getTime() - new Date(a.posted).getTime()
    );

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Browse problems</div>
          <div style={{ fontSize:13, color:"#6b7280" }}>{filtered.length} problems found</div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:13 }}>🔍</span>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search problems…"
              style={{ padding:"7px 12px 7px 32px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none", width:240 }}
            />
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{ padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, fontFamily:"inherit", cursor:"pointer" }}>
            <option value="score">By score</option>
            <option value="votes">By votes</option>
            <option value="metoo">By "me too"</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        {INDUSTRIES.map(ind=><FilterChip key={ind} label={ind} active={industry===ind} onClick={()=>setIndustry(ind)} />)}
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
        {[["all","All statuses"],["open","Open"],["being_built","Being built"],["solved","Solved"]].map(([val,label])=>(
          <FilterChip key={val} label={label} active={statusFilter===val} onClick={()=>setStatusFilter(val)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 24px", color:"#9ca3af" }}>
          <div style={{ fontSize:16, fontWeight:600, color:"#6b7280", marginBottom:8 }}>No problems found</div>
          <p>Try adjusting your filters or search.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(p=>(
            <ProblemCard key={p.id} problem={p} voted={votes.includes(p.id)} onVote={onVote} onClick={()=>setPage({ name:"detail", id:p.id })} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail Page ──────────────────────────────────────────────────────────────

function DetailPage({
  problem, setPage, votes, onVote, onMeToo, meToos, solutions,
}: {
  problem: Problem; setPage: (p: Page) => void;
  votes: number[]; onVote: (id: number) => void;
  onMeToo: (id: number) => void; meToos: number[];
  solutions: Solution[];
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { id:1, author:"Sarah K.", time:"2 days ago", text:"This is exactly the problem I face every month. The lack of transparency is intentional — hospitals profit from confusion." },
    { id:2, author:"James O.", time:"5 days ago", text:"I built a basic spreadsheet tool to parse EOBs. Happy to share. But a real solution needs to integrate with insurance APIs." },
    { id:3, author:"Priya M.", time:"1 week ago",  text:"Similar problem in India but with private hospital billing. Would a US-focused solution be adaptable here?" },
  ]);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const sb = statusBadge(problem.status);
  const didVote = votes.includes(problem.id);
  const didMeToo = meToos.includes(problem.id);
  const meSol = solutions.find(s=>s.problemId===problem.id);

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px" }}>
      <div style={{ marginBottom:20 }}>
        <Btn variant="ghost" onClick={() => setPage("browse")} style={{ padding:"5px 10px", fontSize:13 }}>← Back</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:24 }}>
        {/* Main */}
        <div>
          <Card style={{ padding:28, marginBottom:16 }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
              <span style={{ display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:500,background:sb.bg,color:sb.color }}>{sb.label}</span>
              <Badge variant="gray">{problem.industry}</Badge>
              <Badge variant="gray">{problem.region}</Badge>
              <Badge variant="gray">{problem.frequency}</Badge>
            </div>

            <h1 style={{ fontFamily:"Georgia,serif", fontSize:24, lineHeight:1.35, marginBottom:18, color:"#111" }}>{problem.title}</h1>

            <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
              {/* vote */}
              <div onClick={()=>onVote(problem.id)} style={{ display:"flex",flexDirection:"row",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${didVote?"#c84b2f":"#e5e7eb"}`,background:didVote?"#fff0ed":"#fff",transition:"all 0.15s" }}>
                <span>▲</span>
                <span style={{ fontWeight:700 }}>{fmtNum(problem.votes+(didVote?1:0))}</span>
                <span style={{ fontSize:12, color:"#9ca3af" }}>votes</span>
              </div>
              {/* me too */}
              <div onClick={()=>onMeToo(problem.id)} style={{ display:"flex",flexDirection:"row",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${didMeToo?"#c84b2f":"#e5e7eb"}`,background:didMeToo?"#fff0ed":"#fff",transition:"all 0.15s" }}>
                <span>👋</span>
                <span style={{ fontWeight:700 }}>{fmtNum(problem.meToo+(didMeToo?1:0))}</span>
                <span style={{ fontSize:12, color:"#9ca3af" }}>me too</span>
              </div>
              <div style={{ marginLeft:"auto", textAlign:"right" }}>
                <div style={{ fontSize:34, fontWeight:800, color:scoreColor(problem.score), lineHeight:1 }}>{problem.score}</div>
                <div style={{ fontSize:10, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px" }}>problem score</div>
              </div>
            </div>

            <p style={{ fontSize:14, color:"#374151", lineHeight:1.75, marginBottom:20 }}>{problem.description}</p>

            <div style={{ height:1, background:"#f3f4f6", margin:"20px 0" }} />

            <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Who faces this</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{problem.who}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Severity</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{problem.severity}/10</div>
                <SeverityBar value={problem.severity} />
              </div>
              <div>
                <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Posted by</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{problem.posterName}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>{timeAgo(problem.posted)}</div>
              </div>
            </div>

            {problem.tags.length > 0 && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:16 }}>
                {problem.tags.map(t=>(
                  <span key={t} style={{ display:"inline-block",padding:"2px 8px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:4,fontSize:11,color:"#6b7280",fontWeight:500 }}>#{t}</span>
                ))}
              </div>
            )}
          </Card>

          {/* Comments */}
          <Card style={{ padding:20 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Community discussion ({comments.length})</div>
            <div>
              {comments.map((c,i)=>(
                <div key={c.id} style={{ display:"flex", gap:10, padding:"12px 0", borderBottom: i<comments.length-1?"1px solid #f3f4f6":"none" }}>
                  <Avatar name={c.author} variant="purple" />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"baseline", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600 }}>{c.author}</span>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize:13, color:"#374151", lineHeight:1.55 }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, display:"flex", gap:10 }}>
              <Avatar name="You" variant="accent" />
              <div style={{ flex:1 }}>
                <Textarea value={comment} onChange={setComment} placeholder="Add context, examples, or your experience…" rows={3} />
                <Btn variant="primary" onClick={()=>{ if(!comment.trim())return; setComments(prev=>[...prev,{id:Date.now(),author:"You",time:"just now",text:comment}]); setComment(""); }} style={{ marginTop:8, padding:"6px 14px", fontSize:12 }}>Post comment</Btn>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {problem.bounty > 0 && (
            <Card style={{ padding:20, marginBottom:16, border:"1px solid #fde68a", background:"#fffef7" }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px", color:"#d97706", marginBottom:10 }}>Active bounty</div>
              <div style={{ fontSize:34, fontWeight:800, color:"#d97706", lineHeight:1, marginBottom:6 }}>${problem.bounty.toLocaleString()}</div>
              <p style={{ fontSize:12, color:"#6b7280", marginBottom:14, lineHeight:1.6 }}>Paid out when poster marks solution accepted. Funds held in escrow via Stripe.</p>
              {!claimed ? (
                <Btn variant="amber" onClick={()=>{ setClaiming(true); setTimeout(()=>{ setClaimed(true); setClaiming(false); },800); }} style={{ width:"100%", justifyContent:"center" }}>
                  {claiming ? "Claiming…" : "Claim this bounty →"}
                </Btn>
              ) : (
                <Badge variant="green">✓ Bounty claimed — start building!</Badge>
              )}
            </Card>
          )}

          {meSol && (
            <Card style={{ padding:20, marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px", color:"#9ca3af", marginBottom:10 }}>Your active build</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{meSol.title}</div>
              <p style={{ fontSize:12, color:"#6b7280", marginBottom:12, lineHeight:1.6 }}>{meSol.description}</p>
              <ProgressBar value={meSol.progress} />
              <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>{meSol.progress}% complete · {meSol.teamSize} team members · Beta in {meSol.launchIn}</div>
            </Card>
          )}

          <Card style={{ padding:20, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px", color:"#9ca3af", marginBottom:12 }}>Builders interested</div>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:12 }}>
              {problem.buildersCount === 0 ? "Be the first to build a solution" : `${problem.buildersCount} builder${problem.buildersCount>1?"s":""} working on this`}
            </p>
            {!claimed && <Btn variant="teal" style={{ width:"100%", justifyContent:"center" }}>Start building →</Btn>}
          </Card>

          <Card style={{ padding:20 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px", color:"#9ca3af", marginBottom:12 }}>Stats</div>
            {[["Views","1,240"],["Votes",fmtNum(problem.votes)],['"Me too"',fmtNum(problem.meToo)],["Comments",problem.comments],["Builders",problem.buildersCount]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                <span style={{ color:"#6b7280" }}>{k}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Post Page ────────────────────────────────────────────────────────────────

function PostPage({ onSubmit }: { onSubmit: (p: Problem) => void }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title:"", description:"", who:"", severity:7,
    frequency:"Daily", industry:"Healthcare", region:"", bounty:"", tags:"",
  });

  function upd<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handleSubmit() {
    if (!form.title || !form.description || !form.who) return;
    onSubmit({
      ...form, id: Date.now(), severity: Number(form.severity),
      bounty: Number(form.bounty) || 0,
      meToo:0, votes:0, score: Number(form.severity) * 0.7,
      status:"open", buildersCount:0, comments:0,
      posted: new Date().toISOString().slice(0,10),
      posterName:"You", posterId:1,
      tags: form.tags ? form.tags.split(",").map(t=>t.trim()) : [],
    });
    setSubmitted(true);
  }

  if (submitted) return (
    <div style={{ maxWidth:560, margin:"60px auto", padding:"0 24px" }}>
      <Card style={{ padding:44, textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:26, marginBottom:12 }}>Problem posted!</div>
        <p style={{ fontSize:14, color:"#6b7280", marginBottom:28, lineHeight:1.7 }}>Your problem is now live and searchable. The community will start validating it, and builders will discover it through the feed and weekly digest.</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <Btn variant="primary" onClick={()=>setSubmitted(false)}>Post another</Btn>
          <Btn variant="secondary" onClick={()=>setSubmitted(false)}>Browse problems</Btn>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"32px 24px" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Post a problem</div>
        <div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>Describe a real frustration you face. Be specific — the more concrete, the more valuable.</div>
        <div style={{ display:"flex", gap:6, marginBottom:6 }}>
          {[1,2,3].map(s=>(
            <div key={s} style={{ height:4, flex:1, borderRadius:2, background: s<=step ? "#c84b2f" : "#e5e7eb", transition:"background 0.2s" }} />
          ))}
        </div>
        <div style={{ fontSize:11, color:"#9ca3af" }}>Step {step} of 3</div>
      </div>

      <Card style={{ padding:28 }}>
        {step === 1 && (
          <>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>Describe the problem</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Problem title *</div>
              <Input value={form.title} onChange={v=>upd("title",v)} placeholder="e.g. Hospital billing is opaque and impossible to understand" />
              <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>Be specific. Imagine a developer searching for this exact problem.</div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Full description *</div>
              <Textarea value={form.description} onChange={v=>upd("description",v)} placeholder="Describe the problem in detail. Include your personal experience, what you've tried, and why existing solutions don't work." rows={5} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Who faces this problem? *</div>
              <Input value={form.who} onChange={v=>upd("who",v)} placeholder="e.g. Freelance designers and independent consultants" />
            </div>
            <Btn variant="primary" onClick={()=>form.title&&form.description&&form.who&&setStep(2)}>Continue →</Btn>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>Categorise and score</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Industry</div>
                <Select value={form.industry} onChange={v=>upd("industry",v)} options={INDUSTRIES.filter(i=>i!=="All")} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Region</div>
                <Input value={form.region} onChange={v=>upd("region",v)} placeholder="e.g. USA, India, Global" />
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Severity: {form.severity}/10</div>
              <input type="range" min={1} max={10} value={form.severity} onChange={e=>upd("severity",Number(e.target.value))} style={{ width:"100%", accentColor:"#c84b2f" }} />
              <SeverityBar value={form.severity} />
              <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>1 = minor annoyance · 10 = critical, daily pain</div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Frequency</div>
              <Select value={form.frequency} onChange={v=>upd("frequency",v)} options={FREQUENCIES} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Tags (comma-separated)</div>
              <Input value={form.tags} onChange={v=>upd("tags",v)} placeholder="e.g. billing, insurance, transparency" />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="secondary" onClick={()=>setStep(1)}>← Back</Btn>
              <Btn variant="primary" onClick={()=>setStep(3)}>Continue →</Btn>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>Add a bounty (optional)</div>
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"12px 14px", marginBottom:20, fontSize:13, color:"#92400e", lineHeight:1.6 }}>
              💰 Offering a bounty dramatically increases builder interest. Funds are held in escrow and only released when you accept a solution.
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Bounty amount (USD)</div>
              <Input value={form.bounty} onChange={v=>upd("bounty",v)} type="number" placeholder="0 — leave blank for no bounty" />
            </div>
            <div style={{ height:1, background:"#f3f4f6", margin:"20px 0" }} />
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Review your problem</div>
            <div style={{ background:"#f9fafb", borderRadius:8, padding:"14px 16px", marginBottom:20 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:6 }}>{form.title || "(no title)"}</div>
              <div style={{ fontSize:12, color:"#6b7280" }}>{form.industry} · {form.region||"Global"} · Severity {form.severity}/10 · {form.frequency}</div>
              {Number(form.bounty)>0 && <div style={{ fontSize:12, color:"#d97706", fontWeight:600, marginTop:4 }}>Bounty: ${Number(form.bounty).toLocaleString()}</div>}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="secondary" onClick={()=>setStep(2)}>← Back</Btn>
              <Btn variant="primary" onClick={handleSubmit} style={{ flex:1, justifyContent:"center" }}>Publish problem →</Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ problems, solutions, setPage }: { problems: Problem[]; solutions: Solution[]; setPage: (p: Page) => void }) {
  const [tab, setTab] = useState("overview");
  const myProblems = problems.filter(p=>p.posterId===1);

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px" }}>
      <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:28 }}>
        <Avatar name="You" size="lg" variant="accent" />
        <div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:22 }}>Your dashboard</div>
          <div style={{ fontSize:12, color:"#9ca3af" }}>Builder · Poster · Member since Nov 2025</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:28 }}>
        <StatCard label="Problems posted" value={myProblems.length} color="#c84b2f" />
        <StatCard label="Builder score"   value="1,840" color="#0f766e" />
        <StatCard label="Bounties earned" value="$2,200" color="#d97706" />
        <StatCard label="Solutions shipped" value={solutions.filter(s=>s.status==="shipped").length||0} color="#6d28d9" />
      </div>

      <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", marginBottom:24 }}>
        {[["overview","Overview"],["my-problems","My problems"],["building","Building"],["activity","Activity"]].map(([key,label])=>(
          <div key={key} onClick={()=>setTab(key)} style={{ padding:"10px 18px", fontSize:13, fontWeight:500, cursor:"pointer", borderBottom:`2px solid ${tab===key?"#c84b2f":"transparent"}`, marginBottom:-1, color:tab===key?"#c84b2f":"#6b7280", transition:"all 0.15s" }}>{label}</div>
        ))}
      </div>

      {tab==="overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Reputation</div>
            <Card style={{ padding:20 }}>
              {[["Poster score",420,1000,"#c84b2f"],["Builder score",1840,5000,"#0f766e"],["Community trust",72,100,"#6d28d9"]].map(([label,val,max,color])=>(
                <div key={String(label)} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                    <span style={{ fontWeight:500 }}>{label}</span>
                    <span style={{ color:String(color), fontWeight:700 }}>{val}</span>
                  </div>
                  <ProgressBar value={(Number(val)/Number(max))*100} color={String(color)} />
                </div>
              ))}
            </Card>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Active build</div>
            {solutions.map(s=>(
              <Card key={s.id} style={{ padding:20 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{s.title}</div>
                <p style={{ fontSize:12, color:"#6b7280", marginBottom:14, lineHeight:1.6 }}>{s.description}</p>
                <ProgressBar value={s.progress} />
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:6, marginBottom:16 }}>{s.progress}% complete · {s.teamSize} team members · Beta in {s.launchIn}</div>
                <Btn variant="secondary" onClick={()=>setPage({ name:"detail", id:s.problemId })} style={{ fontSize:12, padding:"5px 12px" }}>View problem →</Btn>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab==="my-problems" && (
        <div>
          {myProblems.length===0 ? (
            <div style={{ textAlign:"center", padding:"48px 24px", color:"#9ca3af" }}>
              <div style={{ fontSize:16, fontWeight:600, color:"#6b7280", marginBottom:8 }}>No problems posted yet</div>
              <p style={{ marginBottom:20 }}>Share your first frustration and help builders find what to build.</p>
              <Btn variant="primary" onClick={()=>setPage("post")}>Post a problem</Btn>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {myProblems.map(p => {
                const sb = statusBadge(p.status);
                return (
                  <Card key={p.id} onClick={()=>setPage({ name:"detail", id:p.id })} style={{ padding:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                      <div style={{ fontSize:15, fontWeight:600, lineHeight:1.4, flex:1 }}>{p.title}</div>
                      <div style={{ textAlign:"right", minWidth:52 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:scoreColor(p.score) }}>{p.score}</div>
                        <div style={{ fontSize:10, color:"#9ca3af" }}>score</div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"#6b7280", display:"flex", gap:10, marginBottom:10 }}>
                      <span>{fmtNum(p.meToo)} "me too"</span><span>·</span>
                      <span>{fmtNum(p.votes)} votes</span><span>·</span>
                      <span>{p.comments} comments</span>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:500,background:sb.bg,color:sb.color }}>{sb.label}</span>
                      {p.bounty>0 && <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:20,fontSize:11,fontWeight:600,color:"#92400e" }}>💰 ${p.bounty.toLocaleString()}</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab==="building" && (
        <div>
          {solutions.length===0 ? (
            <div style={{ textAlign:"center", padding:"48px 24px", color:"#9ca3af" }}>
              <div style={{ fontSize:16, fontWeight:600, color:"#6b7280", marginBottom:8 }}>Not building anything yet</div>
              <p style={{ marginBottom:20 }}>Browse problems and claim one to start building.</p>
              <Btn variant="teal" onClick={()=>setPage("browse")}>Browse problems</Btn>
            </div>
          ) : solutions.map(s=>(
            <Card key={s.id} style={{ padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>{s.title}</div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>{s.description}</div>
                </div>
                <Badge variant="amber">{s.status}</Badge>
              </div>
              <ProgressBar value={s.progress} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#9ca3af", marginTop:6, marginBottom:16 }}>
                <span>{s.progress}% complete</span>
                <span>{s.teamSize} team members</span>
                <span>Beta in {s.launchIn}</span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="secondary" style={{ fontSize:12, padding:"5px 12px" }}>Update progress</Btn>
                <Btn variant="secondary" style={{ fontSize:12, padding:"5px 12px" }}>Find co-founder</Btn>
                <Btn variant="primary" style={{ marginLeft:"auto", fontSize:12, padding:"5px 12px" }}>Mark as launched 🚀</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab==="activity" && (
        <Card style={{ padding:20 }}>
          {[
            "Your problem 'Freelancers chasing invoices' received 12 new votes — 2h ago",
            "New builder claimed your problem 'Hospital billing transparency' — 1d ago",
            "Someone added a 'me too' to your medication tracking problem — 2d ago",
            "Your solution 'InvoiceHound' was featured in the weekly digest — 3d ago",
            "New comment on 'Hospital billing is completely opaque' — 4d ago",
          ].map((n,i)=>(
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"12px 0", borderBottom:i<4?"1px solid #f3f4f6":"none" }}>
              <div style={{ width:8, height:8, background:"#c84b2f", borderRadius:"50%", flexShrink:0, marginTop:5 }} />
              <div style={{ flex:1, fontSize:13 }}>{n.split(" — ")[0]}<span style={{ color:"#9ca3af", marginLeft:8, fontSize:11 }}>{n.split(" — ")[1]}</span></div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── Leaderboard Page ─────────────────────────────────────────────────────────

function LeaderboardPage({ problems }: { problems: Problem[] }) {
  const topPosters = [
    { name:"Alex T.",   score:4420, problems:18, meToo:14200 },
    { name:"Sarah K.",  score:3890, problems:12, meToo:9800  },
    { name:"Priya M.",  score:2710, problems:9,  meToo:6500  },
    { name:"You",       score:420,  problems:4,  meToo:1200  },
    { name:"Dana L.",   score:390,  problems:3,  meToo:980   },
  ];
  const topBuilders = [
    { name:"Jamie C.",  score:8200, shipped:5, bountyEarned:18500 },
    { name:"Riya B.",   score:6100, shipped:3, bountyEarned:9200  },
    { name:"Tom W.",    score:4800, shipped:4, bountyEarned:7400  },
    { name:"You",       score:1840, shipped:1, bountyEarned:2200  },
    { name:"Mira S.",   score:1200, shipped:1, bountyEarned:1500  },
  ];
  const rankColors = ["#f59e0b","#94a3b8","#cd7c2f"];

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px" }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Leaderboard</div>
      <div style={{ fontSize:13, color:"#6b7280", marginBottom:28 }}>Top contributors building the problem marketplace</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:36 }}>
        {[["🏆 Top problem posters", topPosters, false],["🔧 Top builders", topBuilders, true]].map(([title, list, isBuilder])=>(
          <div key={String(title)}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>{String(title)}</div>
            <Card style={{ padding:"8px 20px" }}>
              {(list as typeof topPosters).map((u,i)=>(
                <div key={u.name} style={{ display:"flex", alignItems:"center", gap:12, borderBottom:i<4?"1px solid #f3f4f6":"none", background:u.name==="You"?"#fff0ed":"transparent", margin:u.name==="You"?"0 -20px":"0", padding:u.name==="You"?"10px 20px":"10px 0" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:i<3?rankColors[i]:"#9ca3af", width:24 }}>#{i+1}</div>
                  <Avatar name={u.name} variant={["accent","teal","purple","accent","teal"][i] as any} />
                  <div style={{ flex:1, fontWeight:600, fontSize:13 }}>
                    {u.name}
                    {u.name==="You" && <span style={{ display:"inline-flex",alignItems:"center",padding:"2px 8px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:20,fontSize:10,color:"#6b7280",marginLeft:8 }}>you</span>}
                  </div>
                  <div style={{ fontSize:12, color:"#6b7280" }}>
                    {isBuilder ? `${"bountyEarned" in u ? "$"+(u as any).bountyEarned.toLocaleString() : ""}` : `${"problems" in u ? u.problems : ""} problems`}
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color: isBuilder?"#0f766e":"#c84b2f" }}>{u.score.toLocaleString()}</div>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>

      <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Highest-scored problems ever</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[...problems].sort((a,b)=>b.score-a.score).slice(0,5).map((p,i)=>(
          <Card key={p.id} style={{ padding:"14px 20px", display:"flex", gap:16, alignItems:"center" }}>
            <div style={{ fontSize:20, fontWeight:800, color:"#9ca3af", width:28 }}>#{i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{p.title}</div>
              <div style={{ fontSize:12, color:"#6b7280" }}>{p.industry} · {fmtNum(p.meToo)} "me too"s</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:800, color:scoreColor(p.score) }}>{p.score}</div>
              <div style={{ fontSize:10, color:"#9ca3af" }}>score</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [problems, setProblems] = useState<Problem[]>(SEED_PROBLEMS);
  const [solutions] = useState<Solution[]>(SEED_SOLUTIONS);
  const [votes, setVotes] = useState<number[]>([]);
  const [meToos, setMeToos] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function onVote(id: number) {
    setVotes(v => v.includes(id) ? v.filter(x=>x!==id) : [...v, id]);
    showToast(votes.includes(id) ? "Vote removed" : "Voted! 👍");
  }

  function onMeToo(id: number) {
    setMeToos(v => v.includes(id) ? v.filter(x=>x!==id) : [...v, id]);
    showToast(meToos.includes(id) ? "Removed" : '"Me too" added 👋');
  }

  function onPostProblem(p: Problem) {
    setProblems(prev => [p, ...prev]);
    showToast("Problem published! 🎉");
  }

  const activePage = typeof page === "object" ? page.name : page;

  let content: React.ReactNode = null;
  if (activePage === "home")
    content = <HomePage setPage={setPage} problems={problems} />;
  else if (activePage === "browse")
    content = <BrowsePage problems={problems} setPage={setPage} votes={votes} onVote={onVote} initialIndustry={typeof page === "object" && "industry" in page ? page.industry : undefined} />;
  else if (activePage === "post")
    content = <PostPage onSubmit={p=>{ onPostProblem(p); setPage("dashboard"); }} />;
  else if (activePage === "dashboard")
    content = <DashboardPage problems={problems} solutions={solutions} setPage={setPage} />;
  else if (activePage === "leaderboard")
    content = <LeaderboardPage problems={problems} />;
  else if (activePage === "detail") {
    const prob = problems.find(p => p.id === (page as { name: string; id: number }).id);
    if (prob) content = <DetailPage problem={prob} setPage={setPage} votes={votes} onVote={onVote} onMeToo={onMeToo} meToos={meToos} solutions={solutions} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f7f5f0", fontFamily:"system-ui, -apple-system, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f7f5f0; }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        input[type=range] { accent-color: #c84b2f; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f1f1; } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
      `}</style>
      <Nav page={page} setPage={setPage} />
      <main>{content}</main>
      {toast && <Toast msg={toast} />}
    </div>
  );
}
