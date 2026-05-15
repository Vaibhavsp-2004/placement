import React from "react";
import { useAuth } from "../lib/auth";
import StudentDashboard from "./StudentDashboard";
import RecruiterDashboard from "./RecruiterDashboard";
import Analytics from "./Analytics";

export default function DashboardSwitch() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "student") return <StudentDashboard />;
  if (user.role === "recruiter") return <RecruiterDashboard />;
  if (user.role === "coordinator") return <Analytics />;
  return <div className="text-sm text-[#A1A1AA]">No dashboard for role {user.role}</div>;
}
