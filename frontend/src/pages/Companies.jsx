import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { MapPin, Briefcase } from "lucide-react";

export default function Companies() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [recs, setRecs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [j, r] = await Promise.allSettled([
          api.get("/jobs"),
          user.role === "student" ? api.get("/match/recommendations") : Promise.resolve({ value: { data: [] } }),
        ]);
        const jobs = j.status === "fulfilled" ? j.value.data : [];
        setItems(jobs);
        if (user.role === "student" && r.status === "fulfilled") {
          const map = {};
          (r.value.data || []).forEach((m) => { map[m.job_id] = m; });
          setRecs(map);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user.role]);

  return (
    <div className="space-y-6" data-testid="companies-page">
      <header>
        <div className="label-eyebrow">/ Job board</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Companies & openings</h1>
        <p className="text-sm text-[#A1A1AA] mt-2">{user.role === "student" ? "Ranked by personalized AI fit score." : "All active job postings across the platform."}</p>
      </header>

      <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10">
        {loading && <div className="p-8 text-sm text-[#52525B]">Loading…</div>}
        {!loading && items.length === 0 && <div className="p-8 text-sm text-[#52525B]">No jobs yet.</div>}
        {items.map((j) => {
          const m = recs[j.id];
          return (
            <div key={j.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition" data-testid={`job-row-${j.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base text-white font-medium">{j.title}</h3>
                  <span className="text-xs px-2 py-0.5 border border-white/10 rounded-full text-[#A1A1AA] font-mono">{j.role_type}</span>
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
              {user.role === "student" && m && (
                <div className="md:text-right shrink-0">
                  <div className="font-display text-3xl">{m.fit_score}%</div>
                  <div className="label-eyebrow">AI Fit</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
