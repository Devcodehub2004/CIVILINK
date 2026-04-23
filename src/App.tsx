import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AmbientBubbles } from "./components/AmbientBubbles";

// Pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { IssueDetail } from "./pages/IssueDetail";
import { ReportIssue } from "./pages/ReportIssue";
import { Profile } from "./pages/Profile";
import { Leaderboard } from "./pages/Leaderboard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="relative min-h-screen overflow-hidden bg-surface text-on-surface font-sans selection:bg-on-surface selection:text-surface flex flex-col transition-colors duration-500">
          <AmbientBubbles />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(255,79,0,0.16),transparent_58%)]" />
          <Navbar />
          <main className="relative z-10 flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
              <Route path="/ranking" element={<Leaderboard />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportIssue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          <footer className="relative z-10 border-t border-on-surface/10 bg-white/55 px-6 py-12 text-center backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4">
              <div className="flex items-center gap-3 rounded-full border border-on-surface/10 bg-white/70 px-5 py-2 shadow-[0_12px_40px_rgba(20,20,20,0.06)]">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-soft-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface/60">
                  Civic network online
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                © 2026 CiviLink — Intelligent Civic Action
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
