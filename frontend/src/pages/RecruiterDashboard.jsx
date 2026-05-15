import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";
import { Link } from "react-router-dom";

const empty = {
  title: "", company_name: "", location: "Remote", description: "",
  required_skills: "", min_cgpa: 6.0, ctc_min: 5.0, ctc_max: 15.0, role_type: "Full-time",
};

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/jobs/mine");
      setJobs(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/jobs", {
        ...form,
        required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        min_cgpa: parseFloat(form.min_cgpa),
        ctc_min: parseFloat(form.ctc_min),
        ctc_max: parseFloat(form.ctc_max),
      });
      toast.success("Job posted");
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-8" data-testid="recruiter-dashboard">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="label-eyebrow">/ Recruiter workspace</div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">My jobs</h1>
          <p className="text-sm text-[#A1A1AA] mt-2">Post openings and shortlist candidates by AI fit score.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary inline-flex items-center gap-2" data-testid="toggle-job-form">
          <Plus size={14} strokeWidth={1.5} />
          {showForm ? "Cancel" : "New job"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={submit} className="pi-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="job-form">
          <div className="md:col-span-2">
            <label className="label-eyebrow block mb-2">Title</label>
            <input required value={form.title} onChange={set("title")} className="pi-input w-full px-3 py-2.5 text-sm" data-testid="job-title-input" />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Company</label>
            <input required value={form.company_name} onChange={set("company_name")} className="pi-input w-full px-3 py-2.5 text-sm" data-testid="job-company-input" />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Location</label>
            <input value={form.location} onChange={set("location")} className="pi-input w-full px-3 py-2.5 text-sm" data-testid="job-location-input" />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Role type</label>
            <select value={form.role_type} onChange={set("role_type")} className="pi-input w-full px-3 py-2.5 text-sm">
              <option style={{background:"#0A0A0A"}}>Full-time</option>
              <option style={{background:"#0A0A0A"}}>Internship</option>
              <option style={{background:"#0A0A0A"}}>Contract</option>
            </select>
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Min CGPA</label>
            <input type="number" step="0.1" value={form.min_cgpa} onChange={set("min_cgpa")} className="pi-input w-full px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">CTC min (LPA)</label>
            <input type="number" step="0.5" value={form.ctc_min} onChange={set("ctc_min")} className="pi-input w-full px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">CTC max (LPA)</label>
            <input type="number" step="0.5" value={form.ctc_max} onChange={set("ctc_max")} className="pi-input w-full px-3 py-2.5 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="label-eyebrow block mb-2">Required skills (comma separated)</label>
            <input required value={form.required_skills} onChange={set("required_skills")} placeholder="python, react, sql" className="pi-input w-full px-3 py-2.5 text-sm" data-testid="job-skills-input" />
          </div>
          <div className="md:col-span-2">
            <label className="label-eyebrow block mb-2">Description</label>
            <textarea required value={form.description} onChange={set("description")} className="pi-input w-full px-3 py-2.5 text-sm h-32 resize-none" data-testid="job-desc-input" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="btn-primary" data-testid="submit-job-button">
              {loading ? "Posting…" : "Post job"}
            </button>
          </div>
        </form>
      )}

      <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10">
        {jobs.length === 0 && <div className="p-8 text-sm text-[#52525B]">No jobs yet. Click "New job" to post one.</div>}
        {jobs.map((j) => (
          <div key={j.id} className="p-5 flex items-center gap-4 hover:bg-white/[0.02] transition" data-testid={`my-job-${j.id}`}>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white">{j.title}</div>
              <div className="text-xs text-[#A1A1AA] mt-1">{j.company_name} · {j.location} · {j.ctc_min}-{j.ctc_max} LPA</div>
            </div>
            <Link to={`/app/shortlist?job=${j.id}`} className="btn-secondary text-xs inline-flex items-center gap-1.5" data-testid={`shortlist-${j.id}`}>
              <Users size={13} strokeWidth={1.5}/> Shortlist
            </Link>
            <button onClick={() => del(j.id)} className="btn-secondary text-xs inline-flex items-center gap-1.5" data-testid={`delete-${j.id}`}>
              <Trash2 size={13} strokeWidth={1.5}/> Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
