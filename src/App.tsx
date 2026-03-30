import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { IssueDetail } from './pages/IssueDetail';
import { ReportIssue } from './pages/ReportIssue';
import { Profile } from './pages/Profile';
import { AuthorityDashboard } from './pages/AuthorityDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-on-surface selection:text-surface flex flex-col transition-colors duration-500">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/report" element={
                <ProtectedRoute>
                  <ReportIssue />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Authority Route */}
              <Route path="/authority" element={
                <ProtectedRoute>
                  <AuthorityDashboard />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          <footer className="py-12 border-t border-[#141414] text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
              © 2026 CiviLink — Intelligent Civic Action
            </p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
