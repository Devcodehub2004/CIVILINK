import React, { useState, useRef, useEffect } from 'react';

interface ShareButtonProps {
  issueId: string;
  title: string;
  description?: string;
  category?: string;
  /** 'card' = compact inline icon for dashboard cards, 'detail' = larger button for issue detail */
  variant?: 'card' | 'detail';
  className?: string;
}

const PLATFORMS = [
  {
    name: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
    getUrl: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
  {
    name: 'X',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#000000',
    getUrl: (url: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#1877F2',
    getUrl: (url: string, _text: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: '#0A66C2',
    getUrl: (url: string, _text: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

export const ShareButton: React.FC<ShareButtonProps> = ({
  issueId,
  title,
  description,
  category,
  variant = 'card',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const issueUrl = `${window.location.origin}/issues/${issueId}`;
  const shareText = `🚨 Civic Issue: ${title}${category ? ` [${category}]` : ''}${description ? ` — "${description.slice(0, 100)}${description.length > 100 ? '...' : ''}"` : ''}\n\nHelp raise awareness on CiviLink 👇`;

  const handleShare = (e: React.MouseEvent, platform: typeof PLATFORMS[0]) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(platform.getUrl(issueUrl, shareText), '_blank', 'noopener,noreferrer,width=600,height=500');
    setOpen(false);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(issueUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = issueUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  // ─── Card variant (inline icon in dashboard cards) ───
  if (variant === 'card') {
    return (
      <div className="relative inline-flex items-center" ref={menuRef}>
        <button
          onClick={toggleMenu}
          title="Share this report"
          className={className || "flex items-center gap-1.5 cursor-pointer text-on-surface/40 group-hover:text-surface/60 hover:text-primary transition-all hover:scale-110 active:scale-95 group/btn"}
        >
          <span className="material-symbols-outlined text-[18px] group-hover/btn:rotate-12 transition-transform">share</span>
        </button>

        {open && (
          <div
            className="absolute bottom-full mb-3 right-0 z-[100] bg-white/90 backdrop-blur-2xl border border-on-surface/10 shadow-[0_20px_60px_rgba(20,20,20,0.15)] p-2 rounded-2xl animate-share-pop origin-bottom min-w-[220px]"
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            <span className="label-sm text-on-surface/30 block px-4 py-2 uppercase tracking-[0.2em] text-[8px]">Network // Share</span>
            <div className="flex flex-col gap-1 mt-1">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.name}
                  onClick={(e) => handleShare(e, platform)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-primary/5 transition-all text-left group/platform"
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform group-hover/platform:scale-110 group-hover/platform:-rotate-6"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platform.icon}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-on-surface group-hover/platform:text-primary transition-colors">{platform.name}</span>
                  </div>
                  <span className="material-symbols-outlined text-xs opacity-0 group-hover/platform:opacity-100 group-hover/platform:translate-x-1 transition-all">north_east</span>
                </button>
              ))}
              <div className="h-px bg-on-surface/5 mx-2 my-1" />
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 transition-all text-left group/copy"
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center bg-on-surface/10 group-hover/copy:bg-primary/20 transition-all">
                  <span className="material-symbols-outlined text-sm text-on-surface group-hover/copy:text-primary">
                    {copied ? 'check' : 'link'}
                  </span>
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-on-surface group-hover/copy:text-primary transition-colors">
                  {copied ? 'Copied' : 'Copy Link'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Detail variant (prominent button on issue detail page) ───
  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={toggleMenu}
        title="Share this report"
        className={className || "flex items-center gap-4 bg-white/70 backdrop-blur-xl hover:bg-white hover:shadow-[0_15px_45px_rgba(255,79,0,0.15)] transition-all px-8 py-4 rounded-[20px] border border-on-surface/10 hover:border-primary/30 group relative overflow-hidden"}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="material-symbols-outlined font-black text-2xl text-primary group-hover:rotate-12 transition-transform relative z-10">share</span>
        <div className="flex flex-col items-start leading-none text-left relative z-10">
          <span className="font-black text-sm uppercase tracking-[0.1em] text-on-surface">Share Impact</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">Viral awareness</span>
        </div>
      </button>

      {open && (
        <div
          className="absolute top-full mt-4 right-0 z-[100] bg-white/95 backdrop-blur-3xl border border-on-surface/10 shadow-[0_30px_90px_rgba(20,20,20,0.2)] p-3 rounded-[28px] animate-share-pop min-w-[260px]"
          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        >
          <div className="px-4 py-3 mb-2">
            <span className="label-sm text-primary/60 block uppercase tracking-[0.25em] text-[9px]">Global Broadcast</span>
            <h5 className="font-black uppercase tracking-widest text-sm text-on-surface mt-1">Spread the Word</h5>
          </div>
          
          <div className="flex flex-col gap-1">
            {PLATFORMS.map(platform => (
              <button
                key={platform.name}
                onClick={(e) => handleShare(e, platform)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-primary/5 transition-all text-left group/detail"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl transition-all group-hover/detail:scale-110 group-hover/detail:rotate-6"
                    style={{ backgroundColor: platform.color, boxShadow: `0 8px 20px -5px ${platform.color}66` }}
                  >
                    {platform.icon}
                  </span>
                  <span className="text-sm font-black uppercase tracking-widest text-on-surface group-hover/detail:text-primary transition-colors">{platform.name}</span>
                </div>
                <span className="material-symbols-outlined opacity-0 group-hover/detail:opacity-100 group-hover/detail:translate-x-1 transition-all text-primary">chevron_right</span>
              </button>
            ))}
            <div className="h-px bg-on-surface/5 mx-4 my-2" />
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-primary/5 transition-all text-left group/copy"
            >
              <span className="w-11 h-11 rounded-full flex items-center justify-center bg-on-surface/5 group-hover/copy:bg-primary/10 transition-all">
                <span className="material-symbols-outlined text-on-surface group-hover/copy:text-primary transition-colors">
                  {copied ? 'check_circle' : 'content_copy'}
                </span>
              </span>
              <span className="text-sm font-black uppercase tracking-widest text-on-surface group-hover/copy:text-primary transition-colors">
                {copied ? 'Link Copied' : 'Copy Resource URL'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
