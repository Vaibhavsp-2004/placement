import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  LayoutDashboard, FileText, Building2, MessageSquare,
  BarChart3, Briefcase, Users
} from "lucide-react";

const linkBase = "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition";

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role;

  const items = [];
  items.push({ to: "/app", label: "Overview", icon: LayoutDashboard, end: true, testId: "side-overview" });

  if (role === "student") {
    items.push({ to: "/app/resume", label: "Resume", icon: FileText, testId: "side-resume" });
    items.push({ to: "/app/companies", label: "Companies", icon: Building2, testId: "side-companies" });
    items.push({ to: "/app/interview", label: "Interview Coach", icon: MessageSquare, testId: "side-interview" });
  }
  if (role === "recruiter") {
    items.push({ to: "/app/jobs", label: "My Jobs", icon: Briefcase, testId: "side-jobs" });
    items.push({ to: "/app/shortlist", label: "Shortlist", icon: Users, testId: "side-shortlist" });
  }
  if (role === "coordinator") {
    items.push({ to: "/app/analytics", label: "Analytics", icon: BarChart3, testId: "side-analytics" });
    items.push({ to: "/app/companies", label: "Companies", icon: Building2, testId: "side-companies" });
  }

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-white/10 px-4 py-6 sticky top-16 h-[calc(100vh-4rem)]">
      <div className="label-eyebrow mb-3 px-3">Workspace</div>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ to, label, icon: Icon, end, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={testId}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? "bg-white/5 text-white border border-white/10" : "text-[#A1A1AA] hover:text-white hover:bg-white/5 border border-transparent"}`
            }
          >
            <Icon size={15} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <div className="pi-card p-3">
          <div className="text-xs text-[#A1A1AA]">Signed in as</div>
          <div className="text-sm text-white truncate" title={user.email}>{user.name}</div>
          <div className="text-[11px] text-[#52525B] mt-0.5 font-mono uppercase">{user.role}</div>
        </div>
      </div>
    </aside>
  );
}
