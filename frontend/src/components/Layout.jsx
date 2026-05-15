import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../lib/auth";

export default function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16 flex max-w-7xl mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
