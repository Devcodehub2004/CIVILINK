import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
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

const heroHighlights = [
  { label: "Citizens active", value: "12.4K" },
  { label: "Avg response time", value: "36 hrs" },
  { label: "Resolution uplift", value: "+41%" },
];

const systemCards = [
  {
    title: "Instant Reporting",
    description:
      "Geotagged reports filed in seconds and routed to the right municipal desk.",
    icon: "rocket_launch",
    detail: "Live issue intake",
    cta: "/report",
  },
  {
    title: "Community Power",
    description:
      "Collective upvotes surface urgent issues and make local priorities impossible to ignore.",
    icon: "groups",
    detail: "Citizen-backed urgency",
  },
  {
    title: "Auto Escalation",
    description:
      "Silent workflows escalate unresolved reports to higher oversight at the right time.",
    icon: "auto_awesome",
    detail: "Policy-aware automation",
  },
  {
    title: "Verified Results",
    description:
      "Progress stays transparent from filing to closure, with proof attached by the community.",
    icon: "verified",
    detail: "Outcome accountability",
  },
];

export const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 12458,
    resolved: 8942,
    active: 3516,
  });
  const [activeCommentIssueId, setActiveCommentIssueId] = useState<
    string | null
  >(null);
  const [commentContent, setCommentContent] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "/api/issues?sortBy=upvotesCount&order=desc&page=1&limit=10",
        );
        if (res.data.success) {
          const fetchedIssues = res.data.data.issues || [];
          setIssues(fetchedIssues);
          setTotalPages(res.data.data.totalPages || 1);
          setStats({
            total: res.data.data.total || 12458,
            resolved:
              res.data.data.totalResolved ||
              fetchedIssues.filter((i: any) => i.status === "RESOLVED")
                .length ||
              8942,
            active:
              res.data.data.totalActive ||
              fetchedIssues.filter((i: any) => i.status !== "RESOLVED")
                .length ||
              3516,
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
      const res = await axios.get(
        `/api/issues?sortBy=upvotesCount&order=desc&page=${nextPage}&limit=10`,
      );
      if (res.data.success) {
        setIssues((prev) => [...prev, ...(res.data.data.issues || [])]);
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

    if (!user) return navigate("/login");

    try {
      const res = await axios.post(`/api/issues/${issueId}/upvote`);
      const { upvotesCount } = res.data.data;
      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === issueId ? { ...issue, upvotesCount } : issue,
        ),
      );
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  const handleCommentSubmit = async (e: React.MouseEvent, issueId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return navigate("/login");
    if (!commentContent.trim()) return;

    try {
      const res = await axios.post(`/api/issues/${issueId}/comments`, {
        content: commentContent,
      });

      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === issueId
            ? {
                ...issue,
                commentCount: (issue.commentCount || 0) + 1,
                comments: [res.data.data, ...(issue.comments || [])],
              }
            : issue,
        ),
      );
      setCommentContent("");
      setActiveCommentIssueId(null);
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  return (
    <div className="relative mx-auto mb-24 max-w-[1440px] px-4 md:mb-0 md:px-6">
      <section className="relative overflow-hidden px-2 pb-14 pt-10 md:px-0 md:pb-24 md:pt-20">
        <div className="absolute inset-x-0 top-8 h-[28rem] rounded-[3rem] bg-white/50 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="relative"
          >
            <div className="glass-panel rounded-[2rem] p-6 md:p-10">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/75 px-4 py-2 shadow-[0_12px_30px_rgba(20,20,20,0.06)]">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-soft-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.34em] text-on-surface/60">
                  Professional civic operating layer
                </span>
              </div>

              <h1 className="display-lg max-w-4xl text-on-surface">
                Floating civic intelligence for faster local action.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-on-surface/72 md:text-lg">
                CiviLink turns scattered complaints into a visible, prioritized,
                accountable public workflow. Citizens report, communities
                amplify, and authorities respond with transparency.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  title="Create your CiviLink account"
                  className="floating-cta rounded-full bg-primary px-8 py-4 text-sm font-black uppercase tracking-[0.28em] text-on-primary shadow-[0_18px_45px_rgba(255,79,0,0.32)] transition-all duration-300 hover:-translate-y-1 hover:brightness-110"
                >
                  Get started
                </Link>
                <button
                  onClick={() =>
                    document
                      .getElementById("live-activity")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  title="View collective concerns"
                  className="rounded-full border border-on-surface/10 bg-white/70 px-8 py-4 text-sm font-black uppercase tracking-[0.28em] text-on-surface shadow-[0_16px_40px_rgba(20,20,20,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white"
                >
                  Explore issues
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroHighlights.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 * index + 0.2, duration: 0.6 }}
                    className="rounded-[1.75rem] border border-white/60 bg-white/72 p-5 shadow-[0_14px_36px_rgba(20,20,20,0.06)] backdrop-blur-xl"
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">
                      {item.label}
                    </div>
                    <div className="mt-3 text-3xl font-black tracking-[-0.06em] text-on-surface">
                      {item.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            className="relative"
          >
            <div className="glass-panel relative overflow-hidden rounded-[2.25rem] p-6 md:p-8">
              <div className="absolute right-6 top-6 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Live network
              </div>

              <div className="relative flex min-h-[420px] flex-col justify-between">
                <div>
                  <p className="label-sm text-outline">System overview</p>
                  <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em] text-on-surface md:text-4xl">
                    Reports move like signals, not paperwork.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-on-surface/65">
                    A calm interface, ambient motion, and real-time issue flows
                    make civic participation feel trustworthy and modern.
                  </p>
                </div>

                <div className="relative mt-10 grid gap-4">
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="rounded-[1.8rem] border border-white/60 bg-white/78 p-5 shadow-[0_18px_45px_rgba(20,20,20,0.08)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">
                          Active reports
                        </p>
                        <h3 className="mt-2 text-4xl font-black tracking-[-0.06em] text-on-surface">
                          {stats.active.toLocaleString()}
                        </h3>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_16px_36px_rgba(255,79,0,0.24)]">
                        <span className="material-symbols-outlined">
                          orbital
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.4,
                      }}
                      className="rounded-[1.6rem] border border-white/60 bg-white/76 p-5 shadow-[0_18px_45px_rgba(20,20,20,0.08)]"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">
                        Resolved
                      </p>
                      <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-primary">
                        {stats.resolved.toLocaleString()}
                      </p>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.9,
                      }}
                      className="rounded-[1.6rem] border border-white/60 bg-white/76 p-5 shadow-[0_18px_45px_rgba(20,20,20,0.08)]"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">
                        Total tracked
                      </p>
                      <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-on-surface">
                        {stats.total.toLocaleString()}
                      </p>
                    </motion.div>
                  </div>

                  <div className="rounded-[1.8rem] border border-dashed border-primary/25 bg-primary/6 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/70">
                          Trusted momentum
                        </p>
                        <p className="mt-2 text-sm leading-7 text-on-surface/70">
                          A professional visual system communicates confidence
                          while the data pipeline keeps everything actionable.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          document
                            .getElementById("live-activity")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white text-primary transition-transform hover:scale-105"
                        title="Scroll to issues"
                      >
                        <span className="material-symbols-outlined">south</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-10 md:py-14">
        <div className="glass-panel grid gap-5 rounded-[2rem] p-6 md:grid-cols-3 md:gap-10 md:p-8">
          <div>
            <span className="label-sm text-outline">Public signal</span>
            <p className="mt-3 text-4xl font-black tracking-[-0.06em] md:text-6xl">
              {stats.total.toLocaleString()}
            </p>
            <p className="mt-3 text-sm leading-7 text-on-surface/65">
              verified reports flowing through a single civic resolution layer.
            </p>
          </div>
          <div className="border-white/60 md:border-l md:pl-10">
            <span className="label-sm text-outline">Resolved issues</span>
            <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-primary md:text-6xl">
              {stats.resolved.toLocaleString()}
            </p>
            <p className="mt-3 text-sm leading-7 text-on-surface/65">
              outcomes delivered with public visibility and follow-through.
            </p>
          </div>
          <div className="border-white/60 md:border-l md:pl-10">
            <span className="label-sm text-outline">Community points</span>
            <p className="mt-3 text-4xl font-black tracking-[-0.06em] md:text-6xl">
              12.4K
            </p>
            <p className="mt-3 text-sm leading-7 text-on-surface/65">
              earned by advocates who report, comment, and improve local
              response.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mb-10 flex flex-col gap-3 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="label-sm text-outline">01 // MISSION</span>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.06em] md:text-5xl">
              Core systems for modern civic response
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-on-surface/65">
            Every module is designed to feel calm, premium, and trustworthy
            while quietly guiding users toward action.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {systemCards.map((card, index) => {
            const cardContent = (
              <>
                <div className="mb-10 flex items-center justify-between">
                  <div className="floating-icon flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-primary shadow-[0_18px_40px_rgba(20,20,20,0.08)]">
                    <span className="material-symbols-outlined text-3xl">
                      {card.icon}
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                    {card.detail}
                  </span>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-on-surface transition-colors group-hover:text-primary">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-on-surface/68">
                  {card.description}
                </p>

                <div className="mt-auto pt-8">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">
                    <span className="h-2 w-2 rounded-full bg-primary/70" />
                    Trusted civic flow
                  </div>
                </div>
              </>
            );

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              >
                {card.cta ? (
                  <Link
                    to={card.cta}
                    title={card.title}
                    className="group glass-panel flex h-full flex-col rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-primary/20"
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div
                    title={card.title}
                    className="group glass-panel flex h-full flex-col rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-primary/20"
                  >
                    {cardContent}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="live-activity" className="pb-24 pt-6 md:pb-32">
        <div className="mb-10 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="label-sm text-outline">02 // FEED</span>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.06em] md:text-5xl">
              Community priority feed
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-on-surface/65">
            High-signal reports rise to the top with community urgency, fast
            interaction loops, and space for constructive replies.
          </p>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {issues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.45, delay: index * 0.03 }}
              onClick={() => navigate(`/issues/${issue.id}`)}
              className="issue-card group cursor-pointer rounded-[2rem] p-6 md:p-8"
            >
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">
                    {issue.category}
                  </span>
                  <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-[-0.05em] text-on-surface transition-colors group-hover:text-primary md:text-3xl">
                    {issue.title}
                  </h3>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em]",
                    issue.status === "OPEN"
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : issue.status === "IN_PROGRESS"
                        ? "border-amber-400/20 bg-amber-400/10 text-amber-700"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {issue.status.replace("_", " ")}
                </div>
              </div>

              <p className="max-w-3xl text-base italic leading-8 text-on-surface/72">
                “{issue.description}”
              </p>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/55 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    onClick={(e) => handleUpvote(e, issue.id)}
                    title="Upvote this issue"
                    className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-[0_12px_30px_rgba(20,20,20,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary hover:text-on-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_upward
                    </span>
                    {issue.upvotesCount || 0}
                  </span>

                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      setActiveCommentIssueId(
                        activeCommentIssueId === issue.id ? null : issue.id,
                      );
                    }}
                    title="Toggle Comments"
                    className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-[0_12px_30px_rgba(20,20,20,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-on-surface/15 hover:bg-on-surface hover:text-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chat_bubble
                    </span>
                    {issue.commentCount || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-on-surface/45">
                  <span className="material-symbols-outlined text-base">
                    location_on
                  </span>
                  <span>{issue.address?.split(",")[0]}</span>
                </div>
              </div>

              {activeCommentIssueId === issue.id && (
                <div
                  className="mt-6 flex flex-col gap-6 border-t border-dashed border-on-surface/10 pt-6"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="hide-scrollbar flex max-h-64 flex-col gap-4 overflow-y-auto pr-1">
                    {issue.comments?.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 rounded-[1.5rem] border border-white/60 bg-white/65 p-3 shadow-[0_12px_30px_rgba(20,20,20,0.05)]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-surface shadow-[0_8px_20px_rgba(20,20,20,0.05)]">
                          {comment.user?.avatarUrl ? (
                            <img
                              src={comment.user.avatarUrl}
                              alt={comment.user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-sm text-on-surface/65">
                              person
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-on-surface">
                              {comment.user?.name || "Anonymous"}
                            </span>
                            {comment.user?.role === "AUTHORITY" && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                                <span className="material-symbols-outlined text-[11px]">
                                  verified_user
                                </span>
                                Official reply
                              </span>
                            )}
                            <span className="rounded-full bg-primary/8 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                              {getBadge(comment.user?.points || 0)}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/40">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm leading-7 text-on-surface/72 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {(!issue.comments || issue.comments.length === 0) && (
                      <div className="rounded-[1.5rem] border border-dashed border-on-surface/10 bg-white/45 py-6 text-center text-sm italic text-on-surface/45">
                        No comments yet. Start the conversation.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 border-t border-white/55 pt-4 sm:flex-row">
                    <input
                      type="text"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Write your thoughts..."
                      className="flex-1 rounded-full border border-white/70 bg-white/80 px-6 py-3 text-sm font-medium text-on-surface shadow-[0_12px_30px_rgba(20,20,20,0.05)] outline-none transition-all focus:-translate-y-0.5 focus:border-primary/30 focus:shadow-[0_18px_36px_rgba(20,20,20,0.08)]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleCommentSubmit(e as any, issue.id);
                      }}
                    />
                    <button
                      onClick={(e) => handleCommentSubmit(e, issue.id)}
                      title="Post your comment"
                      className="floating-cta rounded-full bg-primary px-8 py-3 text-sm font-black uppercase tracking-[0.28em] text-on-primary shadow-[0_18px_45px_rgba(255,79,0,0.32)] transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!commentContent.trim()}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {page < totalPages && (
          <div className="mt-14 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="floating-cta rounded-full border border-white/60 bg-white/85 px-10 py-4 shadow-[0_16px_40px_rgba(20,20,20,0.08)] transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="relative z-10 flex items-center gap-3">
                {loadingMore ? (
                  <span className="material-symbols-outlined animate-spin text-primary">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-180">
                    expand_more
                  </span>
                )}
                <span className="text-sm font-black uppercase tracking-[0.28em] text-on-surface">
                  {loadingMore ? "Syncing..." : "Load archived concerns"}
                </span>
              </div>
            </button>
          </div>
        )}
      </section>

      <section className="pb-32">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
          <div className="glass-panel flex min-h-[360px] flex-col justify-between rounded-[2rem] p-8 md:p-10">
            <div>
              <span className="label-sm text-outline">03 // NEXT</span>
              <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.06em] md:text-5xl">
                Ready to lead your community?
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-8 text-on-surface/68">
                Join advocates, residents, and local leaders turning civic
                friction into clear, visible progress.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-6">
              <div className="rounded-[1.5rem] border border-white/60 bg-white/75 p-4 shadow-[0_14px_36px_rgba(20,20,20,0.05)]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    mail
                  </span>
                  <input
                    className="w-full bg-transparent text-sm font-medium uppercase tracking-[0.2em] text-on-surface outline-none placeholder:text-on-surface/30"
                    placeholder="ENTER YOUR EMAIL"
                    type="email"
                  />
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary transition-transform hover:scale-105">
                    <span className="material-symbols-outlined">
                      trending_flat
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={user ? "/report" : "/register"}
                  className="floating-cta rounded-full bg-on-surface px-7 py-3 text-sm font-black uppercase tracking-[0.26em] text-surface transition-all duration-300 hover:-translate-y-1"
                >
                  {user ? "Report an issue" : "Create account"}
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-on-surface/10 bg-white/70 px-7 py-3 text-sm font-black uppercase tracking-[0.26em] text-on-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
                >
                  Member login
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="glass-panel flex items-center justify-between rounded-[2rem] p-6">
              <div>
                <span className="label-sm text-outline">System status</span>
                <div className="mt-3 text-2xl font-black uppercase tracking-[-0.04em]">
                  Network active
                </div>
              </div>
              <div className="floating-icon flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_18px_40px_rgba(255,79,0,0.24)]">
                <span className="material-symbols-outlined">sensors</span>
              </div>
            </div>

            <div className="glass-panel flex items-center justify-between rounded-[2rem] p-6">
              <div>
                <span className="label-sm text-outline">Partners</span>
                <div className="mt-3 text-2xl font-black uppercase tracking-[-0.04em]">
                  42 Municipalities
                </div>
              </div>
              <div className="floating-icon flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-[0_18px_40px_rgba(20,20,20,0.06)]">
                <span className="material-symbols-outlined">
                  account_balance
                </span>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <span className="label-sm text-outline">Trusted by</span>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {["Residents", "Volunteers", "Ward teams", "Officials"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-on-surface/60"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
