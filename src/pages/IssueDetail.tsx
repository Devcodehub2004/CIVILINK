import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShareButton } from '../components/ShareButton';
import { formatTimeAgo, getBadge } from '../utils';


export const IssueDetail = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(`/api/issues/${id}/comments`, { content: newComment });
      if (res.data.success) {
        setIssue((prev: any) => ({
          ...prev,
          comments: [res.data.data, ...(prev.comments || [])]
        }));
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await axios.post(`/api/issues/${id}/upvote`);
      const { upvotesCount } = res.data.data;
      setIssue((prev: any) => ({
        ...prev,
        upvotesCount,
        _count: { ...prev._count, upvotes: upvotesCount }
      }));
    } catch (err) {
      console.error('Failed to upvote', err);
    }
  };

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await axios.get(`/api/issues/${id}`);
        if (res.data.success) {
          setIssue(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-4xl font-bold uppercase tracking-tighter">Issue Not Found</h1>
        <button onClick={() => navigate(-1)} className="label-sm border border-on-surface px-6 py-3 rounded-full">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 mb-24">
      <header className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <span className="label-sm text-outline">ISSUE REPORT // {issue.id}</span>
          <div className="px-4 py-1 rounded-full label-sm border border-primary text-primary">
            • {issue.status}
          </div>
          {issue.reporterId === JSON.parse(localStorage.getItem('user') || '{}').id && (
            <div className="flex items-center gap-4 ml-4">
              {issue.status !== 'RESOLVED' && (
                <button 
                  onClick={async () => {
                    if(window.confirm('Mark this issue as fully resolved?')) {
                      try {
                        const res = await axios.patch(`/api/issues/${issue.id}/status`, { status: 'RESOLVED' });
                        if (res.data.success) setIssue({ ...issue, status: 'RESOLVED' });
                      } catch (err) {
                        alert('Failed to resolve issue');
                      }
                    }
                  }}
                  title="Mark as Resolved"
                  className="label-sm px-4 py-2 rounded-full border border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
                  Resolve
                </button>
              )}
              <button 
                onClick={async () => {
                  if(window.confirm('Erase this record from the archive?')) {
                    try {
                      await axios.delete(`/api/issues/${issue.id}`);
                      navigate('/dashboard');
                    } catch (err) {
                      alert('Deletion failed');
                    }
                  }
                }}
                title="Delete this report"
                className="material-symbols-outlined text-primary hover:text-on-surface transition-colors"
              >
                delete
              </button>
            </div>
          )}
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-8">
          {issue.title}
        </h1>
        <div className="flex flex-wrap gap-8 items-center border-y border-on-surface/10 py-8">
          <div className="flex items-center gap-4 border-r border-on-surface/10 pr-8">
            <div className="w-12 h-12 rounded-full border-2 border-on-surface flex items-center justify-center overflow-hidden bg-surface shrink-0">
               {issue.reporter?.avatarUrl ? (
                 <img src={issue.reporter.avatarUrl} alt={issue.reporter.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="material-symbols-outlined text-2xl">person</span>
               )}
            </div>
            <div className="flex flex-col">
               <span className="label-sm text-outline">Reporter</span>
               <span className="font-bold uppercase tracking-tight">{issue.reporter?.name || 'Anonymous'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
             <span className="label-sm text-outline">Location</span>
             <span className="font-bold uppercase tracking-tight">{issue.address}</span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="label-sm text-outline">Category</span>
             <span className="font-bold uppercase tracking-tight">{issue.category}</span>
          </div>
          <div className="flex flex-col gap-1 items-end ml-auto">
             <div className="flex items-center gap-4">
               <ShareButton
                 issueId={issue.id}
                 title={issue.title}
                 description={issue.description}
                 category={issue.category}
                 variant="detail"
               />
                <button
                  onClick={handleUpvote}
                  title="Upvote this issue"
                  className="flex items-center gap-3 bg-surface hover:bg-primary hover:text-on-primary transition-all px-6 py-3 rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-none group"
                >
                  <span className="material-symbols-outlined font-black text-3xl group-hover:-translate-y-1 transition-transform">arrow_upward</span>
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="font-black text-3xl">{issue._count?.upvotes || 0}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Points (Vote)</span>
                  </div>
                </button>
                <div className="hidden sm:flex items-center gap-3 bg-surface px-6 py-3 rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_#000]">
                  <span className="material-symbols-outlined font-black text-3xl text-secondary">forum</span>
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="font-black text-3xl">{issue.comments?.length || 0}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Feedback</span>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </header>

      <section className="mb-16">
        <span className="label-sm text-outline block mb-4 uppercase">Detailed Parameterization</span>
        <p className="font-body italic text-2xl leading-relaxed opacity-80">
          "{issue.description}"
        </p>
      </section>

      {issue.imageUrl ? (
        <div className="w-full bg-on-surface/5 rounded-3xl overflow-hidden border-2 border-on-surface">
          <img src={issue.imageUrl} alt="Evidence" className="w-full object-contain max-h-[600px]" />
        </div>
      ) : (
        <div className="aspect-video w-full bg-on-surface/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-on-surface/10">
          <span className="material-symbols-outlined text-6xl opacity-20 text-on-surface">image_not_supported</span>
        </div>
      )}

      {/* Comments Section */}
      <section className="mt-16 border-t border-on-surface/10 pt-12">
        <h2 className="text-3xl font-bold uppercase tracking-tighter mb-8 bg-on-surface text-surface px-4 py-2 inline-block -rotate-1 shadow-[4px_4px_0px_#000]">Comments ({issue.comments?.length || 0})</h2>
        
        {/* Comment Input */}
        <form onSubmit={handlePostComment} className="flex gap-4 mb-12">
          <div className="w-12 h-12 rounded-full bg-surface border-2 border-on-surface flex items-center justify-center shrink-0 overflow-hidden shadow-[2px_2px_0px_#000]">
             {JSON.parse(localStorage.getItem('user') || '{}').avatarUrl ? (
               <img src={JSON.parse(localStorage.getItem('user') || '{}').avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <span className="material-symbols-outlined text-2xl font-black">person</span>
             )}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="w-full bg-surface border-2 border-on-surface p-4 font-body outline-none focus:shadow-[4px_4px_0px_#000] focus:-translate-y-1 focus:-translate-x-1 transition-all resize-none h-24 placeholder:text-on-surface/40 font-bold"
              placeholder="Add your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-1">
              <button 
                type="submit" 
                disabled={isSubmitting || !newComment.trim()}
                title="Post your comment"
                className="bg-primary text-on-primary px-8 py-3 font-black uppercase tracking-widest text-sm hover:-translate-y-1 hover:shadow-[-4px_4px_0px_var(--color-on-surface)] active:translate-y-0 active:shadow-none hover:rotate-1 transition-all disabled:opacity-50 border-2 border-on-surface"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>

        {/* Comment List */}
        <div className="flex flex-col gap-8">
          {issue.comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="w-12 h-12 rounded-full border-2 border-on-surface flex items-center justify-center shrink-0 overflow-hidden bg-surface group-hover:-rotate-6 transition-transform shadow-[2px_2px_0px_#000]">
                 {comment.user?.avatarUrl ? (
                   <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="material-symbols-outlined text-2xl font-black opacity-80">person</span>
                 )}
              </div>
              <div className="flex flex-col flex-1 bg-on-surface/5 p-4 rounded-xl border-2 border-transparent group-hover:border-on-surface/20 transition-colors">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-bold text-sm uppercase tracking-wide">{comment.user?.name || 'Anonymous'}</span>

                          <span className="label-sm opacity-50">• {formatTimeAgo(comment.createdAt)}</span>
                          <span className="text-[10px] font-bold text-secondary tracking-wider uppercase bg-secondary/10 px-2 py-0.5 rounded-full">{getBadge(comment.user?.points || 0)}</span>
                        </div>
                <p className="font-body text-base leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
          {(!issue.comments || issue.comments.length === 0) && (
            <div className="text-center py-12 px-6 border-2 border-dashed border-on-surface/20 bg-on-surface/5">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50 block">forum</span>
              <p className="font-black uppercase tracking-widest opacity-80 text-xl">Silence in the archive</p>
              <p className="font-body opacity-60 mt-2">Be the first to leave a record.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
