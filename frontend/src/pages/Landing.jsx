import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import NetworkBackground from "../components/NetworkBackground";
import {
  FileText, Brain, Target, MessageSquare, BarChart3, Briefcase,
  ArrowRight, Sparkles, ShieldCheck
} from "lucide-react";

const features = [
  { icon: FileText, title: "Resume Intelligence", desc: "PDF parsing, ATS scoring, keyword & action-verb analysis powered by Claude Sonnet 4.5." },
  { icon: Brain, title: "Placement Prediction", desc: "Weighted feature model surfaces probability, expected CTC, and prioritized growth levers." },
  { icon: Target, title: "Company Matching", desc: "Fit scores combining skill overlap, CGPA gating, and JD semantics." },
  { icon: MessageSquare, title: "AI Interview Coach", desc: "Adaptive technical and behavioral mocks with STAR-format feedback and scoring." },
  { icon: BarChart3, title: "Placement Analytics", desc: "Funnel, branch heatmaps, at-risk detection, CTC trends — built for coordinators." },
  { icon: Briefcase, title: "Recruiter Pipeline", desc: "Post JDs, auto-shortlist candidates by AI fit score and ATS strength." },
];

const agents = [
  { code: "01", title: "Resume Review Agent", line: "Extracts structured data, scores ATS, recommends improvements." },
  { code: "02", title: "Interview Coach Agent", line: "Multi-turn mock interviews with adaptive difficulty and STAR scoring." },
  { code: "03", title: "Placement Mentor Agent", line: "Career guidance, roadmap suggestions, prep resources." },
  { code: "04", title: "Skill Gap Analyzer", line: "Detects missing skills against your target companies." },
  { code: "05", title: "Company Matching Agent", line: "Ranks job openings by personalized fit score." },
];

export default function Landing() {
  return (
    <div className="min-h-screen grain">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 md:px-10 overflow-hidden">
        <NetworkBackground density={42} />
        <div className="relative max-w-6xl mx-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-2 px-3 py-1 border border-white/10 rounded-full w-fit text-xs text-[#A1A1AA]"
          >
            <Sparkles size={12} strokeWidth={1.5} />
            <span className="font-mono uppercase tracking-wider">AI placement OS · v1.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl tracking-tighter font-medium leading-[1.02] mt-6 max-w-4xl"
          >
            Placement intelligence,<br />
            <span className="text-[#A1A1AA]">engineered end-to-end.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 text-base md:text-lg text-[#A1A1AA] max-w-2xl leading-relaxed"
          >
            One platform for students, placement cells, and recruiters. AI-driven resume analysis,
            company matching, placement prediction, and interview prep — built like a serious product, not a course project.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2" data-testid="hero-cta-signup">
              Start free
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
            <Link to="/login" className="btn-secondary inline-flex items-center gap-2" data-testid="hero-cta-login">
              Sign in
            </Link>
          </motion.div>

          <div className="mt-16 grid grid-cols-3 max-w-2xl gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden">
            {[
              { k: "Avg ATS lift", v: "+34%" },
              { k: "Match precision", v: "0.86" },
              { k: "Time-to-shortlist", v: "<10s" },
            ].map((s) => (
              <div key={s.k} className="bg-[#050505] p-5">
                <div className="font-display text-2xl">{s.v}</div>
                <div className="label-eyebrow mt-1">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="label-eyebrow">/ Capabilities</div>
          <h2 className="font-display text-3xl md:text-5xl tracking-tighter mt-3 max-w-3xl">
            Everything a placement cell needs, unified under one product surface.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden mt-12">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="bg-[#050505] p-8 group hover:bg-[#0A0A0A] transition-colors"
              >
                <f.icon size={20} strokeWidth={1.4} className="text-[#A1A1AA] group-hover:text-white transition" />
                <h3 className="font-display text-lg mt-6">{f.title}</h3>
                <p className="text-sm text-[#A1A1AA] mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="py-24 px-6 md:px-10 bg-[#0A0A0A] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="label-eyebrow">/ Modular AI Agents</div>
          <h2 className="font-display text-3xl md:text-5xl tracking-tighter mt-3 max-w-3xl">
            Five focused agents. One coherent system of intelligence.
          </h2>

          <div className="mt-12 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10">
            {agents.map((a) => (
              <div key={a.code} className="flex items-center justify-between p-6 md:p-8 hover:bg-white/[0.02] transition group">
                <div className="flex items-center gap-6 min-w-0">
                  <span className="font-mono text-xs text-[#52525B] tracking-wider">{a.code}</span>
                  <div className="min-w-0">
                    <div className="font-display text-lg md:text-xl truncate">{a.title}</div>
                    <div className="text-sm text-[#A1A1AA] mt-1 truncate">{a.line}</div>
                  </div>
                </div>
                <ArrowRight size={16} strokeWidth={1.5} className="text-[#52525B] group-hover:text-white group-hover:translate-x-1 transition shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden">
          {[
            { n: "01", t: "Upload resume", d: "PDF or paste. Claude parses skills, projects, certifications instantly." },
            { n: "02", t: "Get placement plan", d: "See your probability, fit companies, and a personalized improvement roadmap." },
            { n: "03", t: "Train with AI", d: "Run adaptive mock interviews and apply with one click to ranked openings." },
          ].map((s) => (
            <div key={s.n} className="bg-[#050505] p-8">
              <div className="label-eyebrow">step {s.n}</div>
              <div className="font-display text-2xl mt-4">{s.t}</div>
              <div className="text-sm text-[#A1A1AA] mt-2 leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-4xl mx-auto pi-card p-10 md:p-16 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#6366F1]/10 blur-3xl" />
          <ShieldCheck size={20} className="text-[#A1A1AA]" strokeWidth={1.4} />
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-6">
            Ready when you are.
          </h2>
          <p className="text-[#A1A1AA] mt-4 max-w-xl">
            Demo accounts pre-loaded for student, coordinator, and recruiter. Sign up or sign in to explore the platform end-to-end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-primary" data-testid="cta-bottom-signup">Create account</Link>
            <Link to="/login" className="btn-secondary" data-testid="cta-bottom-login">Use demo accounts</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 px-6 text-xs text-[#52525B] text-center font-mono uppercase tracking-wider">
        Placement.intel · built with Emergent
      </footer>
    </div>
  );
}
