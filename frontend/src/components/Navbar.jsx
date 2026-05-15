import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Sparkles, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  const onLogout = () => {
    logout();
    nav("/");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-[#050505]/70 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to={user ? "/app" : "/"} className="flex items-center gap-2" data-testid="brand-link">
          <div className="w-7 h-7 rounded-md border border-white/15 flex items-center justify-center">
            <Sparkles size={14} className="text-[#EDEDED]" strokeWidth={1.5} />
          </div>
          <span className="font-display text-[15px] tracking-tight text-white">
            Placement<span className="text-[#A1A1AA]">.intel</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm text-[#A1A1AA]">
          {!user && (
            <>
              <a href="#features" className="px-3 py-2 hover:text-white transition">Features</a>
              <a href="#agents" className="px-3 py-2 hover:text-white transition">AI Agents</a>
              <a href="#how" className="px-3 py-2 hover:text-white transition">How it works</a>
            </>
          )}
          {user && (
            <Link to="/app" className={`px-3 py-2 ${location.pathname.startsWith("/app") ? "text-white" : "hover:text-white"} transition`} data-testid="nav-dashboard">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Link to="/login" className="btn-secondary text-sm" data-testid="nav-login">Sign in</Link>
              <Link to="/signup" className="btn-primary text-sm" data-testid="nav-signup">Get started</Link>
            </>
          )}
          {user && (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-md text-xs text-[#A1A1AA]">
                <span className="dot-pulse" />
                <span className="font-mono uppercase tracking-wider">{user.role}</span>
              </div>
              <button onClick={onLogout} className="btn-secondary text-sm flex items-center gap-2" data-testid="nav-logout">
                <LogOut size={14} strokeWidth={1.5} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
