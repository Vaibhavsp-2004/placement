import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function Shortlist() {
  const loc = useLocation();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/jobs/mine");
        setJobs(data);
        const q = new URLSearchParams(loc.search).get("job");
        const initial = q && data.find((j) => j.id === q) ? q : (data[0]?.id || "");
        setJobId(initial);
      } catch {}
    })();
  }, [loc.search]);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.post("/match/shortlist", { job_id: jobId });
        setCandidates(data);
      } catch (err) {
        toast.error("Failed to load candidates");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  return (
    <div className="space-y-6" data-testid="shortlist-page">
      <header>
        <div className="label-eyebrow">/ AI Shortlist</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Candidate ranking</h1>
        <p className="text-sm text-[#A1A1AA] mt-2">Top applicants for this role, ranked by AI fit score (skills + CGPA + resume strength).</p>
      </header>

      <div className="flex items-center gap-3">
        <label className="label-eyebrow">Job</label>
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="pi-input px-3 py-2 text-sm" data-testid="shortlist-job-select">
          {jobs.map((j) => <option key={j.id} value={j.id} style={{background:"#0A0A0A"}}>{j.title} — {j.company_name}</option>)}
        </select>
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wider text-[#52525B] border-b border-white/10 bg-[#0A0A0A]">
          <div className="col-span-4">Candidate</div>
          <div className="col-span-2">Branch</div>
          <div className="col-span-1">CGPA</div>
          <div className="col-span-2">ATS</div>
          <div className="col-span-1 text-right">Fit</div>
          <div className="col-span-2 text-right">Skills matched</div>
        </div>
        {loading && <div className="p-8 text-sm text-[#52525B]">Computing fit scores…</div>}
        {!loading && candidates.length === 0 && <div className="p-8 text-sm text-[#52525B]">No applicants yet for this job.</div>}
        {!loading && candidates.map((c) => (
          <div key={c.user_id} className="grid grid-cols-12 px-4 py-3 items-center border-b border-white/5 hover:bg-white/[0.02] text-sm" data-testid={`candidate-${c.user_id}`}>
            <div className="col-span-4 min-w-0">
              <div className="text-white truncate">{c.name}</div>
              <div className="text-xs text-[#52525B] truncate">{c.email}</div>
            </div>
            <div className="col-span-2 text-[#A1A1AA] text-xs truncate">{c.branch || "—"}</div>
            <div className="col-span-1 text-[#A1A1AA]">{c.cgpa || "—"}</div>
            <div className="col-span-2">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#6366F1]" style={{ width: `${c.ats_score}%` }} />
              </div>
              <div className="text-[10px] text-[#52525B] mt-1 font-mono">{c.ats_score}/100</div>
            </div>
            <div className="col-span-1 text-right font-display text-xl">{c.fit_score}</div>
            <div className="col-span-2 text-right text-xs text-[#A1A1AA] truncate">{c.matched_skills.slice(0, 3).join(", ") || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
