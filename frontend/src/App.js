import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Layout from "./components/Layout";
import DashboardSwitch from "./pages/DashboardSwitch";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import Companies from "./pages/Companies";
import Interview from "./pages/Interview";
import Analytics from "./pages/Analytics";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import Shortlist from "./pages/Shortlist";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<DashboardSwitch />} />
            <Route path="resume" element={<ResumeAnalysis />} />
            <Route path="companies" element={<Companies />} />
            <Route path="interview" element={<Interview />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="jobs" element={<RecruiterDashboard />} />
            <Route path="shortlist" element={<Shortlist />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0A0A0A",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#EDEDED",
          },
        }}
      />
    </div>
  );
}

export default App;
