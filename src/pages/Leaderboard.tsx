import React, { useState, useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import axios from "axios";

// Helper function to keep style consistency with Landing
function getBadge(points: number) {
  if (points >= 100) return "🌟 Community Leader";
  if (points >= 50) return "🔥 Active Voice";
  if (points >= 10) return "✨ Verified Citizen";
  return "🌱 New Member";
}

const TiltCard = ({ user, rank, delay }: { user: any; rank: number; delay: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useMotionTemplate`${mouseYSpring}deg`;
  const rotateY = useMotionTemplate`${mouseXSpring}deg`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 20); // Max rotation degrees
    y.set(yPct * -20);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isTop3 = rank <= 3;
  const issuesCount = user._count?.reportedIssues || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, type: "spring", bounce: 0.4 }}
      style={{ perspective: 1200 }}
      className={`relative w-full ${isTop3 ? "col-span-full md:col-span-1" : "col-span-full"}`}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`group relative flex items-center justify-between rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_16px_40px_rgba(20,20,20,0.06)] backdrop-blur-2xl transition-colors hover:border-primary/30 hover:bg-white/90 ${
          isTop3 ? "flex-col text-center p-8 min-h-[300px]" : "flex-row"
        }`}
      >
        <div 
          style={{ transform: "translateZ(50px)" }}
          className={`absolute text-[8rem] font-black leading-none tracking-tighter text-black/[0.03] transition-colors group-hover:text-primary/10 ${
            isTop3 ? "top-4 right-6" : "right-8 top-1/2 -translate-y-1/2"
          }`}
        >
          {rank}
        </div>

        <div className={`flex items-center gap-5 ${isTop3 ? "flex-col" : "flex-row"}`} style={{ transform: "translateZ(30px)" }}>
          <div className={`relative flex items-center justify-center overflow-hidden rounded-full border-2 bg-gradient-to-br from-primary/20 to-white shadow-[0_8px_20px_rgba(20,20,20,0.05)] ${
            isTop3 ? "h-24 w-24 border-primary/30" : "h-14 w-14 border-on-surface/10"
          }`}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className={`font-bold uppercase text-surface ${isTop3 ? "text-3xl" : "text-xl"} bg-on-surface w-full h-full flex items-center justify-center`}>
                {user.name?.[0] || "C"}
              </span>
            )}
            
            {rank === 1 && (
              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-lg shadow-lg">
                👑
              </div>
            )}
          </div>
          
          <div className={`${isTop3 ? "flex flex-col items-center" : "flex flex-col items-start"}`}>
            <h3 className={`font-black uppercase tracking-[0.05em] text-on-surface ${isTop3 ? "text-2xl mt-2" : "text-xl"}`}>
              {user.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-primary/8 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {getBadge(user.points)}
              </span>
            </div>
          </div>
        </div>

        <div 
          style={{ transform: "translateZ(40px)" }}
          className={`flex flex-col justify-center rounded-[1.5rem] bg-surface px-5 py-3 shadow-[inset_0_2px_10px_rgba(20,20,20,0.04)] ${
            isTop3 ? "mt-6 w-full items-center" : "items-end"
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface/40">
            Complaints Registered
          </span>
          <span className={`font-black text-on-surface ${isTop3 ? "text-4xl" : "text-2xl"}`}>
            {issuesCount}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const Leaderboard = () => {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await axios.get("/api/users/ranking");
        if (res.data.success) {
          setCitizens(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching citizen ranking", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  return (
    <div className="relative mx-auto min-h-screen max-w-[1200px] px-4 pb-24 pt-24 md:px-6 md:pt-32">
      {/* Background blur */}
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[30rem] w-full max-w-4xl -translate-x-1/2 rounded-[full] bg-white/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          <span className="material-symbols-outlined text-[14px]">
            social_leaderboard
          </span>
          Citizen Ranking
        </span>
        <h1 className="display-sm mt-4 text-on-surface">
          Top Local Advocates
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-on-surface/60">
          Celebrating the citizens who are actively making our city better by reporting issues and driving local action.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Top 3 Podium */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* 2nd Place */}
            {citizens[1] && (
              <div className="md:mt-12">
                <TiltCard user={citizens[1]} rank={2} delay={0.2} />
              </div>
            )}
            
            {/* 1st Place */}
            {citizens[0] && (
              <div className="md:-mt-4">
                <TiltCard user={citizens[0]} rank={1} delay={0.1} />
              </div>
            )}
            
            {/* 3rd Place */}
            {citizens[2] && (
              <div className="md:mt-20">
                <TiltCard user={citizens[2]} rank={3} delay={0.3} />
              </div>
            )}
          </div>

          {/* Rest of the list */}
          {citizens.length > 3 && (
            <div className="mt-8 flex flex-col gap-4">
              {citizens.slice(3).map((user, idx) => (
                <TiltCard 
                  key={user.id} 
                  user={user} 
                  rank={idx + 4} 
                  delay={0.4 + (idx * 0.05)} 
                />
              ))}
            </div>
          )}

          {citizens.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/40 bg-white/30 py-20 text-center">
              <span className="material-symbols-outlined mb-4 text-5xl text-on-surface/20">
                group_off
              </span>
              <p className="text-sm font-bold uppercase tracking-[0.1em] text-on-surface/40">
                No active citizens found yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
