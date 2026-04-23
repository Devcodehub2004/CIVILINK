import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ShareButton } from '../components/ShareButton';

import { cn, formatTimeAgo } from '../utils';


export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [myIssues, setMyIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  const [activeCommentIssueId, setActiveCommentIssueId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'upvotesCount'>('createdAt');

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        setLoading(true);
        // Now filtering by reporterId on the backend for proper pagination
        const res = await axios.get(`/api/issues?reporterId=${user.id}&sortBy=${sortBy}&order=desc&page=${page}&limit=5`);
        if (res.data.success) {
          setMyIssues(res.data.data.issues || []);
          setTotalPages(res.data.data.totalPages || 1);
          setTotalCount(res.data.data.total || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyIssues();
  }, [sortBy, page, user.id]);

  const handleUpvote = async (e: React.MouseEvent, issueId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(`/api/issues/${issueId}/upvote`);
      const { upvotesCount } = res.data.data;
      
      setMyIssues(prevIssues => prevIssues.map(issue => {
        if (issue.id === issueId) {
          return { ...issue, upvotesCount };
        }
        return issue;
      }));
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleCommentSubmit = async (e: React.MouseEvent, issueId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!commentContent.trim()) return;

    try {
      const res = await axios.post(`/api/issues/${issueId}/comments`, { content: commentContent });
      
      setMyIssues(prevIssues => prevIssues.map(issue => {
        if (issue.id === issueId) {
          return { 
            ...issue, 
            comments: [res.data.data, ...(issue.comments || [])] 
          };
        }
        return issue;
      }));
      setCommentContent('');
      setActiveCommentIssueId(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-20 mb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
        <div>
          <span className="label-sm text-outline">DASHBOARD</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mt-2">
            Welcome back,<br />{user.name}.
          </h1>
        </div>
        <Link
          to="/report"
          title="Create a new incident report"
          className="bg-primary text-on-primary px-10 py-5 rounded-full font-bold uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Report New Issue
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Section */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-10 bg-surface-container border border-on-surface/5 rounded-xl">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-24 h-24 bg-on-surface text-surface rounded-full flex items-center justify-center text-4xl font-bold mb-6 ring-4 ring-primary ring-offset-4 ring-offset-surface">
                {user.name[0]}
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight">{user.name}</h3>
              <span className="label-sm text-outline mt-1">{user.role || 'CIVIC ADVOCATE'}</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end p-6 bg-surface rounded-xl border border-on-surface/5 group hover:border-primary transition-colors">
                <span className="label-sm text-outline">Reputation</span>
                <span className="text-3xl font-bold tracking-tighter text-primary group-hover:scale-110 transition-transform">{user.points || 0} PTS</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-surface rounded-xl border border-on-surface/5">
                  <span className="label-sm text-outline">Reports</span>
                  <div className="text-2xl font-bold tracking-tighter mt-1">{totalCount}</div>
                </div>
                <div className="p-6 bg-surface rounded-xl border border-on-surface/5">
                  <span className="label-sm text-outline">Resolved</span>
                  <div className="text-2xl font-bold tracking-tighter mt-1">{myIssues.filter(i => i.status === 'RESOLVED').length}</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { logout(); navigate('/'); }}
              title="Securely log out"
              className="w-full mt-6 bg-error/10 text-error border border-error/20 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-error hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Log Out
            </button>
          </div>

          <div className="p-8 bg-surface-container border border-on-surface/5 rounded-xl hidden lg:block">
            <span className="label-sm text-outline block mb-4 uppercase">Global Impact Status</span>
            <div className="flex gap-1 mb-4 h-3">
              <div className="flex-1 bg-primary"></div>
              <div className="flex-1 bg-primary"></div>
              <div className="flex-1 bg-on-surface/20"></div>
              <div className="flex-1 bg-on-surface/20"></div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Identification // Analysis // Execution // Resolution</p>
          </div>
        </div>

        {/* Reports Archive */}
        <div className="lg:col-span-8">
          <div className="flex justify-between items-baseline mb-8">
            <h4 className="text-2xl font-bold uppercase tracking-tighter">Active Archive</h4>
            <div className="flex gap-4">
              <button 
                onClick={() => setSortBy('createdAt')}
                className={`label-sm px-4 py-1 rounded-full transition-colors ${sortBy === 'createdAt' ? 'bg-primary text-on-primary font-bold shadow-[2px_2px_0px_#000] -translate-y-0.5' : 'text-outline border border-on-surface/20 hover:text-on-surface'}`}
              >
                Newest
              </button>
              <button 
                onClick={() => setSortBy('upvotesCount')}
                title="Sort by most upvoted"
                className={`label-sm px-4 py-1 rounded-full transition-colors flex items-center gap-1 ${sortBy === 'upvotesCount' ? 'bg-primary text-on-primary font-bold shadow-[2px_2px_0px_#000] -translate-y-0.5' : 'text-outline border border-on-surface/20 hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                Top Priority
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-24">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : myIssues.length > 0 ? (
            <div className="flex flex-col gap-6">
              {myIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => navigate(`/issues/${issue.id}`)}
                  className="group p-8 bg-surface border border-on-surface/10 hover:border-on-surface hover:bg-on-surface hover:text-surface rounded-xl transition-all duration-300 block cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="label-sm opacity-50 block mb-2">{issue.category}</span>
                      <h3 className="text-2xl font-bold uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{issue.title}</h3>
                    </div>
                    <div className={cn(
                      "px-4 py-1 rounded-full label-sm border",
                      issue.status === 'OPEN' ? "text-primary border-primary" :
                        issue.status === 'IN_PROGRESS' ? "text-secondary border-secondary" : "text-surface-tint border-surface-tint"
                    )}>
                      • {issue.status}
                    </div>
                  </div>
                  <p className="font-body italic opacity-60 line-clamp-2 mb-6 text-lg group-hover:text-surface/80">
                    "{issue.description}"
                  </p>
                  {issue.reporterId === user?.id && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm('Strike this report from the list?')) {
                          try {
                            await axios.delete(`/api/issues/${issue.id}`);
                            window.location.reload();
                          } catch (err) {
                            alert('Failed to delete');
                          }
                        }
                      }}
                      title="Permanently remove this report"
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-on-surface transition-colors mb-4 relative z-30"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Archive Report
                    </button>
                  )}
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 pt-6 border-t border-on-surface/10 group-hover:border-surface/20">
                    <div className="flex items-center gap-6 label-sm opacity-40 group-hover:opacity-60">
                      <span 
                        onClick={(e) => handleUpvote(e, issue.id)}
                        title="Upvote this report"
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors hover:scale-110 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">thumb_up</span>
                        {issue.upvotesCount || 0}
                      </span>
                      <span 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveCommentIssueId(activeCommentIssueId === issue.id ? null : issue.id);
                        }}
                        title="Comment on this report"
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors hover:scale-110 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        {issue.comments?.length || 0}
                      </span>
                      <ShareButton
                        issueId={issue.id}
                        title={issue.title}
                        description={issue.description}
                        category={issue.category}
                        variant="card"
                      />
                    </div>
                    <span className="label-sm opacity-40 group-hover:opacity-60">{formatTimeAgo(issue.createdAt)} AGO</span>
                  </div>

                  {activeCommentIssueId === issue.id && (
                    <div 
                      className="mt-6 pt-6 border-t border-on-surface/10"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <input 
                          type="text" 
                          value={commentContent}
                          onChange={e => setCommentContent(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 bg-surface-container border border-on-surface/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary group-hover:text-on-surface group-hover:bg-surface"
                        />
                        <button 
                          onClick={(e) => handleCommentSubmit(e, issue.id)}
                          className="bg-primary text-on-primary px-6 py-2 rounded-full label-sm hover:scale-105 transition-transform shrink-0"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-8 border-t border-on-surface/5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="w-12 h-12 flex items-center justify-center border border-on-surface/20 rounded-full hover:bg-on-surface hover:text-surface transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className="label-sm font-black tracking-widest opacity-60">PAGE {page} / {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="w-12 h-12 flex items-center justify-center border border-on-surface/20 rounded-full hover:bg-on-surface hover:text-surface transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-24 border-2 border-dashed border-on-surface/10 rounded-xl opacity-40">
              <span className="material-symbols-outlined text-6xl mb-4">move_to_inbox</span>
              <p className="font-bold uppercase tracking-widest text-sm">No active reports</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
