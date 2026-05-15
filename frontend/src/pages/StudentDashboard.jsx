import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { ArrowUpRight, AlertTriangle, Sparkles } from "lucide-react";

const SkeletonCard = () => (
  <div className="pi-card p-6 animate-pulse">
    <div className="h-3 w-24 bg-white/5 rounded" />
    <div className="h-8 w-32 bg-white/10 rounded mt-4" />
    <div className="h-2 w-full bg-white/5 rounded mt-6" />
  </div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [resume, setResume] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, r, m] = await Promise.allSettled([
          api.get("/predict/me"),
          api.get("/resume/me"),
          api.get("/match/recommendations"),
        ]);
        if (p.status === "fulfilled") setPrediction(p.value.data);
        if (r.status === "fulfilled") setResume(r.value.data);
        if (m.status === "fulfilled") setRecs(m.value.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const radarData = (resume?.skills || []).slice(0, 6).map((s) => ({
    subject: s.length > 10 ? s.slice(0, 10) + "…" : s,
    A: 70 + Math.floor(Math.random() * 30),
  }));

  return (
    <div className="space-y-8" data-testid="student-dashboard">
      <header>
        <div className="label-eyebrow">/ Student workspace</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">
          Hello, {user.name.split(" ")[0]}.
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-2">
          Your AI placement plan, regenerated continuously from your resume, skills, and goals.
        </p>
      </header>

      {!resume && (
        <div className="pi-card p-6 flex items-center justify-between flex-wrap gap-4" data-testid="empty-resume-banner">
          <div>
            <div className="text-sm text-white font-medium">Get your AI placement plan</div>
            <div className="text-sm text-[#A1A1AA] mt-1">Upload or paste your resume to unlock prediction, fit scores, and gap analysis.</div>
          </div>
          <Link to="/app/resume" className="btn-primary inline-flex items-center gap-2" data-testid="cta-upload-resume">
            <Sparkles size={14} strokeWidth={1.5} />
            Analyze resume
          </Link>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
          <>
            <div className="pi-card p-6" data-testid="kpi-probability">
              <div className="label-eyebrow">Placement probability</div>
              <div className="flex items-end gap-2 mt-3">
                <div className="font-display text-5xl tracking-tighter">{prediction ? prediction.placement_probability : 0}<span className="text-[#52525B] text-2xl">%</span></div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${prediction?.placement_probability || 0}%` }} />
              </div>
              <div className="text-xs text-[#A1A1AA] mt-3">Risk: <span className="text-white capitalize">{prediction?.risk_level || "n/a"}</span></div>
            </div>

            <div className="pi-card p-6" data-testid="kpi-ats">
              <div className="label-eyebrow">Resume ATS score</div>
              <div className="font-display text-5xl tracking-tighter mt-3">{resume?.ats_score ?? "—"}</div>
              <div className="text-xs text-[#A1A1AA] mt-2">Keywords {resume?.keyword_score ?? "—"} · Format {resume?.format_score ?? "—"}</div>
              <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#6366F1]" style={{ width: `${resume?.ats_score || 0}%` }} />
              </div>
            </div>

            <div className="pi-card p-6" data-testid="kpi-ctc">
              <div className="label-eyebrow">Expected CTC band</div>
              <div className="font-display text-5xl tracking-tighter mt-3">
                {prediction ? `${prediction.expected_ctc_min}` : "—"}
                <span className="text-[#52525B] text-2xl"> – {prediction?.expected_ctc_max ?? "—"} LPA</span>
              </div>
              <div className="text-xs text-[#A1A1AA] mt-2">Confidence: {prediction?.confidence || "—"}</div>
            </div>
          </>
        )}
      </section>

      {/* Feature contributions + radar */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="pi-card p-6 lg:col-span-2" data-testid="feature-contributions">
          <div className="label-eyebrow">Feature contributions</div>
          <div className="text-sm text-[#A1A1AA] mt-1">What's driving your placement probability.</div>
          <div className="h-64 mt-4">
            {prediction && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prediction.feature_contributions} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#52525B" fontSize={11} />
                  <YAxis type="category" dataKey="feature" stroke="#A1A1AA" fontSize={11} width={110} />
                  <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                  <Bar dataKey="contribution" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="pi-card p-6" data-testid="skill-radar">
          <div className="label-eyebrow">Skill profile</div>
          <div className="h-64 mt-4">
            {radarData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" stroke="#A1A1AA" fontSize={10} />
                  <Radar dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#52525B]">Upload resume to see radar</div>
            )}
          </div>
        </div>
      </section>

      {/* Insights */}
      {prediction?.insights?.length > 0 && (
        <section className="pi-card p-6" data-testid="ai-insights">
          <div className="label-eyebrow">Actionable insights</div>
          <ul className="mt-4 space-y-3">
            {prediction.insights.map((i, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <AlertTriangle size={14} strokeWidth={1.5} className="text-[#F59E0B] shrink-0 mt-0.5" />
                <span className="text-[#EDEDED]">{i}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended companies */}
      <section className="pi-card p-6" data-testid="recommended-companies">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="label-eyebrow">Top company matches</div>
            <div className="text-sm text-[#A1A1AA] mt-1">Ranked by AI fit score (skills + CGPA + JD match).</div>
          </div>
          <Link to="/app/companies" className="text-sm text-white hover:underline inline-flex items-center gap-1" data-testid="link-all-companies">
            View all <ArrowUpRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="mt-4 border border-white/10 rounded-lg divide-y divide-white/10">
          {recs.slice(0, 5).map((r) => (
            <div key={r.job_id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{r.job_title} · <span className="text-[#A1A1AA]">{r.company_name}</span></div>
                <div className="text-xs text-[#52525B] mt-1 truncate">{r.location} · {r.ctc_range}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-lg">{r.fit_score}%</div>
                <div className="label-eyebrow">fit</div>
              </div>
            </div>
          ))}
          {recs.length === 0 && (
            <div className="p-6 text-sm text-[#52525B]">No recommendations yet — upload your resume.</div>
          )}
        </div>
      </section>
    </div>
  );
}
