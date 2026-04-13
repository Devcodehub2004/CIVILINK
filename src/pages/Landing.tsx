import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function getBadge(points: number) {
  if (points >= 100) return "🌟 Community Leader";
  if (points >= 50) return "🔥 Active Voice";
  if (points >= 10) return "✨ Verified Citizen";
  return "🌱 New Member";
}

export const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 12458, resolved: 8942, active: 3516 });
  const [activeCommentIssueId, setActiveCommentIssueId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/issues?sortBy=upvotesCount&order=desc&page=1&limit=10');
        if (res.data.success) {
          const fetchedIssues = res.data.data.issues || [];
          setIssues(fetchedIssues);
          setTotalPages(res.data.data.totalPages || 1);
          setStats({
            total: res.data.data.total || 12458,
            resolved: res.data.data.totalResolved || fetchedIssues.filter((i: any) => i.status === 'RESOLVED').length || 8942,
            active: res.data.data.totalActive || fetchedIssues.filter((i: any) => i.status !== 'RESOLVED').length || 3516
          });
        }
      } catch (err) {
        console.error("Failed to fetch issues", err);
      }
    };
    fetchData();
  }, []);

  const loadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await axios.get(`/api/issues?sortBy=upvotesCount&order=desc&page=${nextPage}&limit=10`);
      if (res.data.success) {
        setIssues(prev => [...prev, ...(res.data.data.issues || [])]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUpvote = async (e: React.MouseEvent, issueId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    try {
      const res = await axios.post(`/api/issues/${issueId}/upvote`);
      const { upvotesCount } = res.data.data;
      setIssues(prevIssues => prevIssues.map(issue => {
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
    if (!user) return navigate('/login');
    if (!commentContent.trim()) return;

    try {
      const res = await axios.post(`/api/issues/${issueId}/comments`, { content: commentContent });
      setIssues(prevIssues => prevIssues.map(issue => {
        if (issue.id === issueId) {
          return { 
            ...issue, 
            commentCount: (issue.commentCount || 0) + 1,
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
    <div className="max-w-[1440px] mx-auto px-6 mb-24 md:mb-0">
      {/* Hero Section */}
      <section className="pt-20 pb-12 md:pt-32 md:pb-24 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-10"
          >
            <h1 className="display-lg text-on-surface">
              Empowering<br/>Civic Action
            </h1>
          </motion.div>
          <div className="lg:col-span-2 flex justify-end">
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={() => document.getElementById('live-activity')?.scrollIntoView({ behavior: 'smooth' })}
                title="Scroll Down"
                className="w-16 h-16 border border-primary text-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl">arrow_downward</span>
              </motion.div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <p className="font-body italic text-xl md:text-2xl leading-relaxed text-on-surface">
              "A decentralized platform for citizens to report issues, hold authorities accountable, and build better communities together."
            </p>
          </div>
          <div className="md:col-span-7 flex flex-wrap gap-4 items-start md:justify-end">
            <Link to="/register" title="Create your Civilink account" className="rounded-full bg-primary text-on-primary px-10 py-5 font-bold uppercase tracking-widest hover:brightness-110 hover:scale-105 transition-all duration-200">
              Get Started
            </Link>
            <button 
              onClick={() => document.getElementById('live-activity')?.scrollIntoView({ behavior: 'smooth' })}
              title="View collective concerns"
              className="rounded-full border-2 border-on-surface text-on-surface px-10 py-5 font-bold uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-all duration-200"
            >
              Explore Issues
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-on-surface">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-2">
            <span className="label-sm text-outline">Total Reports</span>
            <span className="text-5xl md:text-7xl font-bold tracking-tighter">{stats.total.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-2 border-on-surface/20 md:border-l md:pl-12">
            <span className="label-sm text-outline">Resolved</span>
            <span className="text-5xl md:text-7xl font-bold tracking-tighter text-primary">{stats.resolved.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-2 border-on-surface/20 md:border-l md:pl-12">
            <span className="label-sm text-outline">Community Points</span>
            <span className="text-5xl md:text-7xl font-bold tracking-tighter">12.4K</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="flex justify-between items-baseline mb-16">
          <h2 className="text-4xl font-bold uppercase tracking-tighter">Our Core Systems</h2>
          <span className="label-sm text-outline">01 // MISSION</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-on-surface border border-on-surface">
          {/* Asset 1: Instant Reporting */}
          <Link 
            to="/report"
            title="Read more about Instant Reporting"
            className="bg-surface p-10 group hover:bg-primary/5 transition-colors duration-300 flex flex-col items-center text-center no-underline relative overflow-hidden"
          >
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                <div className="absolute inset-0 border-2 border-primary rounded-full animate-pulse-ring"></div>
                <div className="absolute inset-0 border-2 border-primary rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 relative overflow-hidden animate-float">
                    <span className="material-symbols-outlined text-4xl">rocket_launch</span>
                    <div className="absolute top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shine"></div>
                </div>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-primary transition-colors">Instant Reporting</h3>
            <p className="text-sm opacity-70 leading-relaxed">Geotagged reports filed in seconds directly to relevant municipal departments.</p>
          </Link>

          {/* Asset 2: Community Power */}
          <div 
            onClick={() => document.getElementById('live-activity')?.scrollIntoView({ behavior: 'smooth' })}
            title="Upvote and prioritize community issues"
            className="bg-surface p-10 group hover:bg-primary/5 transition-colors duration-300 flex flex-col items-center text-center no-underline relative overflow-hidden cursor-pointer"
          >
            <div className="relative w-32 h-32 flex items-center justify-center mb-8 animate-scale-pulse">
                <div className="absolute -top-2 -left-2 w-12 h-12 bg-primary/10 rounded-full blur-xl"></div>
                <div className="w-20 h-20 bg-surface border-2 border-primary rounded-full flex items-center justify-center text-primary shadow-lg">
                    <span className="material-symbols-outlined text-4xl">groups</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-surface shadow-md">
                    <span className="material-symbols-outlined text-sm">electric_bolt</span>
                </div>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-primary transition-colors">Community Power</h3>
            <p className="text-sm opacity-70 leading-relaxed">Upvote local concerns to prioritize community needs in the legislative pipeline.</p>
          </div>

          {/* Asset 3: Auto Escalation */}
          <div 
            title="System-wide triggers ensure unresponsive reports reach higher oversight automatically."
            className="bg-surface p-10 group hover:bg-primary/5 transition-colors duration-300 flex flex-col items-center text-center relative overflow-hidden cursor-default"
          >
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                <div className="absolute bottom-4 flex items-end gap-2 h-16">
                    <div className="w-2 bg-primary/20 rounded-full bar-1"></div>
                    <div className="w-2 bg-primary/40 rounded-full bar-2"></div>
                    <div className="w-2 bg-primary/60 rounded-full bar-3"></div>
                    <div className="w-2 bg-primary rounded-full bar-4"></div>
                </div>
                <div className="w-16 h-16 bg-surface border-2 border-on-surface/10 rounded-2xl flex items-center justify-center text-primary shadow-xl relative z-10 transition-transform group-hover:rotate-12 group-hover:scale-110 duration-300">
                    <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                </div>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-primary transition-colors">Auto Escalation</h3>
            <p className="text-sm opacity-70 leading-relaxed">System-wide triggers ensure unresponsive reports reach higher oversight automatically.</p>
          </div>

          {/* Asset 4: Verified Results */}
          <div 
            title="Transparent tracking from initial report to final resolution, verified by the community."
            className="bg-surface p-10 group hover:bg-primary/5 transition-colors duration-300 flex flex-col items-center text-center relative overflow-hidden cursor-default"
          >
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                <div className="absolute inset-0 border border-dashed border-primary/40 rounded-full animate-rotate-slow"></div>
                <div className="w-20 h-20 bg-surface border-2 border-primary rounded-[24px] flex items-center justify-center text-primary shadow-xl relative z-10">
                    <span className="material-symbols-outlined text-4xl">verified</span>
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center text-white border-4 border-surface shadow-lg z-20">
                    <span className="material-symbols-outlined text-xl">check</span>
                </div>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-primary transition-colors">Verified Results</h3>
            <p className="text-sm opacity-70 leading-relaxed">Transparent tracking from initial report to final resolution, verified by the community.</p>
          </div>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section id="live-activity" className="pb-32 max-w-4xl mx-auto mt-24">
        <div className="flex justify-between items-baseline mb-12">
          <h2 className="text-4xl font-bold uppercase tracking-tighter">Community Priority</h2>
          <span className="label-sm text-outline">02 // FEED</span>
        </div>
        
        <div className="flex flex-col gap-6">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => navigate(`/issues/${issue.id}`)}
              className="group p-8 bg-surface border-2 border-on-surface hover:bg-primary/5 rounded-xl transition-all duration-300 block cursor-pointer shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="label-sm font-bold opacity-60 block mb-2">{issue.category}</span>
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{issue.title}</h3>
                </div>
                <div className={cn(
                  "px-4 py-1 rounded-full label-sm border-2 font-black shadow-[2px_2px_0px_#000]",
                  issue.status === 'OPEN' ? "text-primary border-primary bg-primary/10" :
                    issue.status === 'IN_PROGRESS' ? "text-secondary border-secondary bg-secondary/10" : "text-on-surface border-on-surface bg-surface-tint/10"
                )}>
                  • {issue.status}
                </div>
              </div>
              <p className="font-body italic opacity-80 line-clamp-3 mb-6 text-lg group-hover:text-on-surface transition-colors">
                "{issue.description}"
              </p>
              
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 pt-6 mt-2 border-t font-black border-on-surface/10 group-hover:border-on-surface/30">
                <div className="flex items-center gap-4 label-sm transition-opacity">
                  <span 
                    onClick={(e) => handleUpvote(e, issue.id)}
                    title="Upvote this issue"
                    className="flex items-center gap-2 cursor-pointer hover:bg-primary hover:text-on-primary hover:border-primary border-2 border-on-surface/20 transition-all active:scale-95 bg-surface px-4 py-2 rounded-full shadow-[2px_2px_0px_#000]"
                  >
                    <span className="material-symbols-outlined text-[18px] font-black">arrow_upward</span>
                    {issue.upvotesCount || 0}
                  </span>
                  <span 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user) { navigate('/login'); return; }
                      setActiveCommentIssueId(activeCommentIssueId === issue.id ? null : issue.id);
                    }}
                    title="Toggle Comments"
                    className="flex items-center gap-2 cursor-pointer hover:bg-secondary hover:text-surface hover:border-secondary border-2 border-on-surface/20 transition-all active:scale-95 bg-surface px-4 py-2 rounded-full shadow-[2px_2px_0px_#000]"
                  >
                    <span className="material-symbols-outlined text-[18px] font-black">chat_bubble</span>
                    {issue.commentCount || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="text-sm tracking-widest uppercase">{issue.address?.split(',')[0]}</span>
                </div>
              </div>

              {activeCommentIssueId === issue.id && (
                <div 
                  className="mt-6 pt-6 border-t-2 border-dashed border-on-surface/10 flex flex-col gap-6"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                >
                  {/* Inline Comments List */}
                  <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2">
                    {issue.comments?.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full border border-on-surface/20 flex items-center justify-center shrink-0 overflow-hidden bg-surface shadow-[1px_1px_0px_#000]">
                           {comment.user?.avatarUrl ? (
                             <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover" />
                           ) : (
                             <span className="material-symbols-outlined text-sm font-black opacity-80">person</span>
                           )}
                        </div>
                        <div className="flex flex-col flex-1 bg-on-surface/5 p-3 rounded-lg border border-transparent hover:border-on-surface/20 transition-colors">
                          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                            <span className="font-black text-xs tracking-tight uppercase">{comment.user?.name || 'Anonymous'}</span>
                            {comment.user?.role === 'AUTHORITY' && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#10B981]/20">
                                <span className="material-symbols-outlined text-[10px]">verified_user</span> Official Reply
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-secondary tracking-wider uppercase bg-secondary/10 px-2 py-0.5 rounded-full">{getBadge(comment.user?.points || 0)}</span>
                            <span className="text-[10px] font-bold text-on-surface/50 tracking-wider uppercase ml-1">{formatTimeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {(!issue.comments || issue.comments.length === 0) && (
                      <div className="text-center py-4 text-on-surface/50 font-body italic text-sm">
                        No comments yet. Start the conversation!
                      </div>
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="flex flex-col sm:flex-row gap-4 border-t border-on-surface/10 pt-4">
                    <input 
                      type="text" 
                      value={commentContent}
                      onChange={e => setCommentContent(e.target.value)}
                      placeholder="Write your thoughts..."
                      className="flex-1 bg-surface border-2 border-on-surface rounded-full px-6 py-3 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#000] focus:-translate-y-1 transition-all shadow-[2px_2px_0px_transparent]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommentSubmit(e as any, issue.id);
                      }}
                    />
                    <button 
                      onClick={(e) => handleCommentSubmit(e, issue.id)}
                      title="Post your comment"
                      className="bg-primary text-on-primary border-2 border-on-surface shadow-[4px_4px_0px_#000] px-8 py-3 rounded-full font-black uppercase tracking-widest text-sm hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-0 active:shadow-none transition-all shrink-0 disabled:opacity-50"
                      disabled={!commentContent.trim()}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        {page < totalPages && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="group relative px-12 py-6 bg-surface border-2 border-on-surface rounded-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-y-0 active:shadow-none"
            >
              <div className="relative z-10 flex items-center gap-3">
                {loadingMore ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">expand_more</span>
                )}
                <span className="font-black uppercase tracking-widest text-sm">
                  {loadingMore ? 'Syncing...' : 'Load Archived Concerns'}
                </span>
              </div>
            </button>
          </div>
        )}
      </section>

      {/* Newsletter / Bento Hero End */}
      <section className="mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
          <div className="bg-on-surface text-surface p-12 rounded-xl flex flex-col justify-between min-h-[400px]">
            <h2 className="text-5xl font-bold uppercase tracking-tighter leading-none">Ready to lead<br/>your community?</h2>
            <div className="flex flex-col gap-6">
              <p className="font-body italic text-xl opacity-80">Join 12k+ advocates making real change happen.</p>
              <div className="relative border-b border-surface/30 focus-within:border-primary transition-colors pb-2">
                <input className="w-full bg-transparent border-none outline-none py-2 text-xs tracking-widest uppercase placeholder:text-surface/40" placeholder="ENTER YOUR EMAIL" type="email"/>
                <button className="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary hover:scale-110 transition-transform">trending_flat</button>
              </div>
            </div>
          </div>
          <div className="grid grid-rows-2 gap-8">
            <div className="bg-surface-container p-8 rounded-xl border border-on-surface/10 flex items-center justify-between">
              <div>
                <span className="label-sm text-outline block mb-2">SYSTEM STATUS</span>
                <div className="text-2xl font-bold uppercase tracking-tight">Network Active</div>
              </div>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">sensors</span>
              </div>
            </div>
            <div className="bg-surface-container-high p-8 rounded-xl border border-on-surface/10 flex items-center justify-between">
              <div>
                <span className="label-sm text-outline block mb-2">PARTNERS</span>
                <div className="text-2xl font-bold uppercase tracking-tight">42 Municipalities</div>
              </div>
              <div className="w-12 h-12 border-2 border-primary rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">account_balance</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
