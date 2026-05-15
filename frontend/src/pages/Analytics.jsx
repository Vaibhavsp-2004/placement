import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, FunnelChart, Funnel, LabelList, Cell, Legend
} from "recharts";
import { AlertTriangle } from "lucide-react";

const KPI = ({ label, value, suffix = "" }) => (
  <div className="pi-card p-5">
    <div className="label-eyebrow">{label}</div>
    <div className="font-display text-3xl mt-2">{value}<span className="text-[#52525B] text-base">{suffix}</span></div>
  </div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/analytics/overview");
        setData(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[#52525B]">Loading analytics…</div>;
  if (!data) return <div className="text-sm text-[#EF4444]">Failed to load analytics.</div>;

  const { kpis, branch_distribution, skill_heatmap, funnel, at_risk, ctc_trend } = data;

  const funnelData = funnel.map((f, i) => ({ ...f, fill: ["#6366F1", "#4F46E5", "#3B82F6", "#10B981", "#A1A1AA"][i] }));

  return (
    <div className="space-y-8" data-testid="analytics-page">
      <header>
        <div className="label-eyebrow">/ Placement analytics</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Placement intelligence dashboard</h1>
        <p className="text-sm text-[#A1A1AA] mt-2">Live signals across students, drives, and outcomes.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPI label="Students" value={kpis.total_students} />
        <KPI label="Jobs posted" value={kpis.total_jobs} />
        <KPI label="Resumes" value={kpis.total_resumes} />
        <KPI label="Interviews" value={kpis.total_interviews} />
        <KPI label="Placement rate" value={kpis.placement_rate} suffix="%" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="pi-card p-6">
          <div className="label-eyebrow">Placement funnel</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="#EDEDED" stroke="none" fontSize={12} dataKey="stage" />
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pi-card p-6">
          <div className="label-eyebrow">Branch distribution</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branch_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="branch" stroke="#A1A1AA" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#52525B" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="pi-card p-6 lg:col-span-2">
          <div className="label-eyebrow">Skill demand vs supply</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skill_heatmap}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="skill" stroke="#A1A1AA" fontSize={10} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis stroke="#52525B" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 11 }} />
                <Bar dataKey="demand" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="supply" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pi-card p-6">
          <div className="label-eyebrow">CTC trend</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ctc_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="#A1A1AA" fontSize={11} />
                <YAxis stroke="#52525B" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Line type="monotone" dataKey="avg_ctc" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="pi-card p-6" data-testid="at-risk-section">
        <div className="label-eyebrow">At-risk students</div>
        <div className="text-sm text-[#A1A1AA] mt-1">Students likely to need intervention based on CGPA + engagement signals.</div>
        <div className="mt-4 border border-white/10 rounded-lg divide-y divide-white/10">
          {at_risk.length === 0 && <div className="p-6 text-sm text-[#52525B]">No at-risk students detected.</div>}
          {at_risk.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle size={16} className="text-[#F59E0B] shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{s.name}</div>
                  <div className="text-xs text-[#52525B] truncate">{s.branch || "—"} · CGPA {s.cgpa || "—"}</div>
                </div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                {s.reasons.map((r) => (
                  <span key={r} className="text-[11px] px-2 py-0.5 border border-[#F59E0B]/30 text-[#F59E0B] rounded-full ml-1">{r}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
