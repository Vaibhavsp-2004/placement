import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Upload, FileText, Sparkles } from "lucide-react";

const SAMPLE = `John Doe
Computer Science · Final Year · CGPA 8.6

SKILLS: Python, FastAPI, React, TypeScript, SQL, Docker, AWS, Machine Learning, Pandas, scikit-learn

EXPERIENCE
- SDE Intern @ Lumen Labs (Jun-Aug 2024): Shipped 3 features in React/TS, improved page-load 28%.
- Open Source: Contributed to Hugging Face transformers (2 PRs merged).

PROJECTS
- Resume AI Analyzer — FastAPI + Claude + React. ATS scoring for 500+ resumes.
- Stock Predictor — XGBoost model, AUC 0.82, deployed on Streamlit.
- Realtime Chat App — Socket.io + Redis Pub/Sub, 1k concurrent users.

CERTIFICATIONS
- AWS Cloud Practitioner (2024)
- Coursera Deep Learning Specialization

EDUCATION
- B.Tech CSE, IIIT Hyderabad, 2021-2025`;

export default function ResumeAnalysis() {
  const [text, setText] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/resume/me");
        if (data) setResume(data);
      } catch {}
    })();
  }, []);

  const analyze = async () => {
    if (text.trim().length < 30) {
      toast.error("Paste your resume text first");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/resume/analyze", { raw_text: text });
      setResume(data);
      toast.success("Resume analyzed");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/resume/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(data);
      toast.success("Resume parsed");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8" data-testid="resume-page">
      <header>
        <div className="label-eyebrow">/ Resume intelligence</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Resume analysis</h1>
        <p className="text-sm text-[#A1A1AA] mt-2">Upload a PDF or paste raw text. Claude Sonnet 4.5 extracts structured data and scores ATS-friendliness.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="pi-card p-6">
          <div className="label-eyebrow">Paste resume text</div>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste your full resume content here…"
            className="pi-input w-full mt-4 px-3 py-2.5 text-sm h-72 resize-none font-mono"
            data-testid="resume-text-input"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={analyze} disabled={loading} className="btn-primary inline-flex items-center gap-2" data-testid="analyze-resume-button">
              <Sparkles size={14} strokeWidth={1.5} />
              {loading ? "Analyzing…" : "Analyze with AI"}
            </button>
            <button type="button" onClick={() => setText(SAMPLE)} className="btn-secondary text-sm" data-testid="load-sample-button">Load sample</button>
          </div>
        </div>

        <div className="pi-card p-6">
          <div className="label-eyebrow">Upload PDF</div>
          <label className="mt-4 flex flex-col items-center justify-center border border-dashed border-white/15 rounded-lg p-10 cursor-pointer hover:border-white/30 transition" data-testid="resume-upload-dropzone">
            <Upload size={20} strokeWidth={1.4} className="text-[#A1A1AA]" />
            <div className="text-sm text-white mt-3">{uploading ? "Uploading…" : "Drop PDF or click to upload"}</div>
            <div className="text-xs text-[#52525B] mt-1">PDF · max 5MB</div>
            <input type="file" accept=".pdf,.txt" className="hidden" onChange={onFile} data-testid="resume-file-input" />
          </label>
          <p className="text-xs text-[#52525B] mt-4">Tip: Plain text usually parses faster and more accurately than complex multi-column PDFs.</p>
        </div>
      </section>

      {resume && (
        <section className="space-y-4" data-testid="resume-result">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: "ATS Score", v: resume.ats_score },
              { k: "Keywords", v: resume.keyword_score },
              { k: "Format", v: resume.format_score },
              { k: "Action Verbs", v: resume.action_verb_score },
            ].map((m) => (
              <div key={m.k} className="pi-card p-5">
                <div className="label-eyebrow">{m.k}</div>
                <div className="font-display text-3xl mt-2">{m.v}<span className="text-[#52525B] text-base">/100</span></div>
              </div>
            ))}
          </div>

          <div className="pi-card p-6">
            <div className="label-eyebrow">AI Summary</div>
            <p className="text-sm text-[#EDEDED] mt-3 leading-relaxed">{resume.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pi-card p-6">
              <div className="label-eyebrow">Skills detected</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {resume.skills.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 border border-white/10 rounded-full capitalize">{s}</span>
                ))}
                {resume.skills.length === 0 && <span className="text-sm text-[#52525B]">None detected.</span>}
              </div>
            </div>
            <div className="pi-card p-6">
              <div className="label-eyebrow">Missing keywords</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {resume.missing_keywords.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 border border-[#F59E0B]/30 text-[#F59E0B] rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pi-card p-6">
            <div className="label-eyebrow">Improvements</div>
            <ul className="mt-3 space-y-2">
              {resume.improvements.map((i, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <FileText size={14} className="text-[#A1A1AA] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>

          {resume.projects?.length > 0 && (
            <div className="pi-card p-6">
              <div className="label-eyebrow">Projects detected</div>
              <div className="mt-3 space-y-3">
                {resume.projects.map((p, i) => (
                  <div key={i} className="border border-white/5 rounded-md p-3">
                    <div className="text-sm text-white">{p.name}</div>
                    <div className="text-xs text-[#A1A1AA] mt-1">{p.description}</div>
                    {p.tech?.length > 0 && (
                      <div className="text-xs text-[#52525B] mt-2 font-mono">{p.tech.join(" · ")}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
