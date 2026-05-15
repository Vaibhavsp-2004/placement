import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}`);
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setEmail(`${role}@demo.com`);
    setPassword("demo1234");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 px-6 max-w-md mx-auto">
        <div className="label-eyebrow">/ Sign in</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Welcome back.</h1>
        <p className="text-[#A1A1AA] mt-2 text-sm">Use a demo account or your own credentials.</p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label className="label-eyebrow block mb-2">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="pi-input w-full px-3 py-2.5 text-sm" placeholder="you@school.edu"
              data-testid="login-email-input"
            />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="pi-input w-full px-3 py-2.5 text-sm" placeholder="••••••••"
              data-testid="login-password-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full" data-testid="login-submit-button">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="hairline my-8" />
        <div className="label-eyebrow mb-3">Demo accounts</div>
        <div className="grid grid-cols-3 gap-2">
          {["student", "coordinator", "recruiter"].map((r) => (
            <button key={r} type="button" onClick={() => fillDemo(r)} className="btn-secondary text-xs capitalize" data-testid={`demo-${r}-button`}>
              {r}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#52525B] mt-3 font-mono">password: demo1234</p>

        <div className="mt-8 text-sm text-[#A1A1AA]">
          New here? <Link to="/signup" className="text-white hover:underline" data-testid="link-signup">Create account</Link>
        </div>
      </div>
    </div>
  );
}
