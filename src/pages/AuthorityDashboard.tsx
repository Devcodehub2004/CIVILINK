import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AuthorityDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.role !== 'AUTHORITY' && user?.role !== 'ADMIN') {
      navigate('/');
    } else {
      fetchIssues();
    }
  }, [user, navigate, page]);

  const fetchIssues = async () => {
    try {
      const res = await axios.get(`/api/issues?sortBy=createdAt&order=desc&page=${page}&limit=9`);
      if (res.data.success) {
        setIssues(res.data.data.issues || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await axios.patch(`/api/issues/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setIssues(issues.map(i => i.id === id ? { ...i, status: newStatus } : i));
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Error updating status');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-2xl animate-pulse tracking-widest">Loading Records...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
      <header className="mb-16 border-b-4 border-on-surface pb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="material-symbols-outlined text-5xl md:text-7xl">admin_panel_settings</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Gov Panel</h1>
        </div>
        <p className="text-xl font-bold opacity-60">Manage community reports and officially update resolution statuses.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {issues.map(issue => (
          <div key={issue.id} className="border-4 border-on-surface p-6 flex flex-col shadow-[8px_8px_0px_#000] bg-surface relative overflow-hidden group transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000]">
            {/* Status Strip */}
            <div className={`absolute top-0 left-0 w-full h-2 ${
              issue.status === 'RESOLVED' ? 'bg-[#10B981]' : 
              issue.status === 'IN_PROGRESS' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
            }`} />
            
            <div className="flex justify-between items-start mb-4 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50 bg-on-surface/5 px-2 py-1 rounded-sm">{issue.category}</span>
              <span className="text-sm font-black uppercase tracking-tight">{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
            
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 line-clamp-2 leading-none hover:underline cursor-pointer" onClick={() => navigate(`/issues/${issue.id}`)}>
              {issue.title}
            </h2>
            <p className="font-bold opacity-70 mb-6 flex items-center gap-1 text-sm truncate bg-on-surface/5 px-3 py-2 rounded-lg">
              <span className="material-symbols-outlined text-sm shrink-0">location_on</span> <span className="truncate">{issue.address}</span>
            </p>

            <div className="mt-auto pt-6 border-t border-on-surface/10 flex flex-col gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center justify-between">
                <span>Update Status</span>
                <span className="material-symbols-outlined text-[14px]">edit_document</span>
              </label>
              <div className="flex gap-2">
                <select 
                  value={issue.status} 
                  onChange={(e) => updateStatus(issue.id, e.target.value)}
                  title="Update Issue Status"
                  className={`flex-1 bg-surface border-2 font-black uppercase text-sm p-3 outline-none focus:shadow-[4px_4px_0px_#000] transition-all cursor-pointer appearance-none ${
                    issue.status === 'RESOLVED' ? 'border-[#10B981] text-[#10B981]' : 
                    issue.status === 'IN_PROGRESS' ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-[#EF4444] text-[#EF4444]'
                  }`}
                  style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <button 
                  onClick={() => navigate(`/issues/${issue.id}`)}
                  className="bg-on-surface text-surface px-4 py-3 font-black flex items-center justify-center hover:opacity-80 transition-opacity"
                  title="View Full Issue Detail"
                >
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {issues.length === 0 && (
          <div className="col-span-full text-center py-24 border-4 border-dashed border-on-surface/20">
            <span className="material-symbols-outlined text-6xl opacity-30 mb-4 block">done_all</span>
            <p className="font-black text-2xl uppercase tracking-widest opacity-50">No issues found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-16 pt-8 border-t-4 border-on-surface/10">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="w-16 h-16 flex items-center justify-center border-4 border-on-surface font-black uppercase text-sm hover:bg-on-surface hover:text-surface transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Index</span>
            <span className="text-xl font-black uppercase tracking-widest">
              {page.toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}
            </span>
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="w-16 h-16 flex items-center justify-center border-4 border-on-surface font-black uppercase text-sm hover:bg-on-surface hover:text-surface transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};
