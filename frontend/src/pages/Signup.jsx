import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

const ROLES = [
  { id: "student", label: "Student", desc: "Track placement, analyze resume" },
  { id: "coordinator", label: "Coordinator", desc: "Manage drives & analytics" },
  { id: "recruiter", label: "Recruiter", desc: "Post jobs, shortlist talent" },
];

export default function Signup() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "student",
    branch: "", cgpa: "", company: "",
  });
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const nav = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        branch: form.role === "student" ? form.branch || null : null,
        cgpa: form.role === "student" && form.cgpa ? parseFloat(form.cgpa) : null,
        company: form.role === "recruiter" ? form.company || null : null,
      };
      const { data } = await api.post("/auth/register", payload);
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}`);
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-16 px-6 max-w-2xl mx-auto">
        <div className="label-eyebrow">/ Create account</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Get started in seconds.</h1>

        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          <div>
            <label className="label-eyebrow block mb-3">Role</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  type="button" key={r.id}
                  onClick={() => setForm((f) => ({ ...f, role: r.id }))}
                  data-testid={`role-${r.id}-button`}
                  className={`text-left p-4 border rounded-md transition ${
                    form.role === r.id ? "border-white/40 bg-white/[0.04]" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="text-sm text-white">{r.label}</div>
                  <div className="text-xs text-[#A1A1AA] mt-1">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-eyebrow block mb-2">Full name</label>
              <input required value={form.name} onChange={set("name")} className="pi-input w-full px-3 py-2.5 text-sm" data-testid="signup-name-input" />
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Email</label>
              <input required type="email" value={form.email} onChange={set("email")} className="pi-input w-full px-3 py-2.5 text-sm" data-testid="signup-email-input" />
            </div>
            <div className="md:col-span-2">
              <label className="label-eyebrow block mb-2">Password</label>
              <input required minLength={6} type="password" value={form.password} onChange={set("password")} className="pi-input w-full px-3 py-2.5 text-sm" data-testid="signup-password-input" />
            </div>

            {form.role === "student" && (
              <>
                <div>
                  <label className="label-eyebrow block mb-2">Branch</label>
                  <input value={form.branch} onChange={set("branch")} placeholder="Computer Science" className="pi-input w-full px-3 py-2.5 text-sm" data-testid="signup-branch-input" />
                </div>
                <div>
                  <label className="label-eyebrow block mb-2">CGPA</label>
                  <input type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={set("cgpa")} placeholder="8.4" className="pi-input w-full px-3 py-2.5 text-sm" data-testid="signup-cgpa-input" />
                </div>
              </>
            )}
            {form.role === "recruiter" && (
              <div className="md:col-span-2">
                <label className="label-eyebrow block mb-2">Company</label>
                <input value={form.company} onChange={set("company")} placeholder="Acme AI" className="pi-input w-full px-3 py-2.5 text-sm" data-testid="signup-company-input" />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto" data-testid="signup-submit-button">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="mt-8 text-sm text-[#A1A1AA]">
          Already registered? <Link to="/login" className="text-white hover:underline" data-testid="link-login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
