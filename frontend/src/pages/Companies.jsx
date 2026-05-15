import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { MapPin, Briefcase, Check, Send } from "lucide-react";

export default function Companies() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [recs, setRecs] = useState({});
  const [applied, setApplied] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);

  const load = async () => {
    try {
      const [j, r, a] = await Promise.allSettled([
        api.get("/jobs"),
        user.role === "student" ? api.get("/match/recommendations") : Promise.resolve({ value: { data: [] } }),
        user.role === "student" ? api.get("/applications/me") : Promise.resolve({ value: { data: [] } }),
      ]);
      const jobs = j.status === "fulfilled" ? j.value.data : [];
      setItems(jobs);
      if (user.role === "student" && r.status === "fulfilled") {
        const map = {};
        (r.value.data || []).forEach((m) => { map[m.job_id] = m; });
        setRecs(map);
      }
      if (user.role === "student" && a.status === "fulfilled") {
        setApplied(new Set((a.value.data || []).map((x) => x.job_id)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user.role]);

  const apply = async (jobId) => {
    setApplyingId(jobId);
    try {
      await api.post(`/applications/${jobId}`);
      setApplied((prev) => new Set(prev).add(jobId));
      toast.success("Application submitted");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to apply");
    } finally {
      setApplyingId(null);
    }
  };

  const withdraw = async (jobId) => {
    setApplyingId(jobId);
    try {
      await api.delete(`/applications/${jobId}`);
      setApplied((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      toast.success("Application withdrawn");
    } catch {
      toast.error("Failed to withdraw");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="companies-page">
      <header>
        <div className="label-eyebrow">/ Job board</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Companies & openings</h1>
        <p className="text-sm text-[#A1A1AA] mt-2">
          {user.role === "student" ? "Ranked by personalized AI fit score. Click Apply to express interest." : "All active job postings across the platform."}
        </p>
      </header>

      <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10">
        {loading && <div className="p-8 text-sm text-[#52525B]">Loading…</div>}
        {!loading && items.length === 0 && <div className="p-8 text-sm text-[#52525B]">No jobs yet.</div>}
        {items.map((j) => {
          const m = recs[j.id];
          const hasApplied = applied.has(j.id);
          return (
            <div key={j.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition" data-testid={`job-row-${j.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base text-white font-medium">{j.title}</h3>
                  <span className="text-xs px-2 py-0.5 border border-white/10 rounded-full text-[#A1A1AA] font-mono">{j.role_type}</span>
                  {hasApplied && (
                    <span className="text-[11px] px-2 py-0.5 border border-[#10B981]/40 text-[#10B981] rounded-full inline-flex items-center gap-1">
                      <Check size={10} strokeWidth={2}/>Applied
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#A1A1AA] mt-1">{j.company_name}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#52525B] mt-2">
                  <span className="inline-flex items-center gap-1"><MapPin size={11} strokeWidth={1.5}/>{j.location}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase size={11} strokeWidth={1.5}/>{j.ctc_min}-{j.ctc_max} LPA · Min CGPA {j.min_cgpa}</span>
                </div>
                <p className="text-sm text-[#A1A1AA] mt-3 line-clamp-2">{j.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {j.required_skills.slice(0, 8).map((s) => (
                    <span key={s} className={`text-[11px] px-2 py-0.5 rounded-full capitalize border ${m && m.matched_skills.includes(s) ? "border-[#10B981]/40 text-[#10B981]" : "border-white/10 text-[#A1A1AA]"}`}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 md:flex-col md:items-end shrink-0">
                {user.role === "student" && m && (
                  <div className="md:text-right">
                    <div className="font-display text-3xl">{m.fit_score}%</div>
                    <div className="label-eyebrow">AI Fit</div>
                  </div>
                )}
                {user.role === "student" && (
                  hasApplied ? (
                    <button
                      onClick={() => withdraw(j.id)}
                      disabled={applyingId === j.id}
                      className="btn-secondary text-sm inline-flex items-center gap-1.5"
                      data-testid={`withdraw-${j.id}`}
                    >
                      Withdraw
                    </button>
                  ) : (
                    <button
                      onClick={() => apply(j.id)}
                      disabled={applyingId === j.id}
                      className="btn-primary text-sm inline-flex items-center gap-1.5"
                      data-testid={`apply-${j.id}`}
                    >
                      <Send size={13} strokeWidth={1.5}/>
                      {applyingId === j.id ? "Applying…" : "Apply"}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
