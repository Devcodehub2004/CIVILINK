import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "HOME", path: "/", icon: "home" },
    { label: "EXPLORE", path: "/issues", icon: "explore" },
    { label: "REPORT", path: "/report", icon: "add_circle" },
    {
      label: user ? "PROFILE" : "LOGIN",
      path: user ? "/dashboard" : "/login",
      icon: "person",
    },
  ];

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        try {
          const res = await axios.get(
            `/api/issues?search=${searchQuery}&limit=5`,
          );
          if (res.data.success) {
            setSearchResults(res.data.data.issues || []);
          }
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchResults([]);
    setSearchQuery("");
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-[60] px-3 pt-3 md:px-6 md:pt-5">
        <nav className="mx-auto flex w-full max-w-[1440px] items-center justify-between rounded-[28px] border border-white/50 bg-white/70 px-4 py-3 shadow-[0_16px_60px_rgba(20,20,20,0.08)] backdrop-blur-2xl md:px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-primary/15 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
              <img
                src="/logo.svg"
                alt="CiviLink Logo"
                className="relative h-10 object-contain transition-transform duration-300 group-hover:scale-105 md:h-12"
              />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-on-surface/45">
                Civic intelligence
              </p>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-on-surface">
                CiviLink Network
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3 rounded-full border border-on-surface/8 bg-surface/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                title={link.label}
                className={cn(
                  "rounded-full px-5 py-2.5 text-xs font-black tracking-[0.25em] transition-all duration-300",
                  location.pathname === link.path
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                    : "text-outline hover:bg-white hover:text-on-surface",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="relative flex items-center gap-2 md:gap-3">
            <div className="relative hidden sm:block">
              <div
                className={cn(
                  "flex items-center rounded-full border border-transparent bg-surface-container/80 backdrop-blur-xl transition-all duration-300 overflow-hidden",
                  isSearchOpen
                    ? "w-40 sm:w-52 md:w-72 px-4 opacity-100 border-on-surface/10 shadow-[0_12px_40px_rgba(20,20,20,0.08)]"
                    : "w-0 px-0 opacity-0",
                )}
              >
                <span className="material-symbols-outlined text-base text-on-surface/40">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search reports, roads, water..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none px-2 py-2.5 text-sm placeholder:text-outline/50"
                />
              </div>

              {isSearchOpen && (searchResults.length > 0 || isSearching) && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-[70] w-72 overflow-hidden rounded-[24px] border border-white/60 bg-white/85 shadow-[0_18px_60px_rgba(20,20,20,0.12)] backdrop-blur-2xl md:w-80">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-6">
                      <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                        progress_activity
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {searchResults.map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => {
                            navigate(`/issues/${issue.id}`);
                            setIsSearchOpen(false);
                            setSearchResults([]);
                            setSearchQuery("");
                          }}
                          className="group flex flex-col items-start border-b border-on-surface/5 px-5 py-4 text-left transition-colors hover:bg-primary/5 last:border-none"
                        >
                          <span className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                            {issue.category}
                          </span>
                          <span className="w-full truncate text-sm font-black uppercase tracking-[0.08em] text-on-surface group-hover:text-primary">
                            {issue.title}
                          </span>
                          <div className="mt-1 flex items-center gap-1 opacity-45">
                            <span className="material-symbols-outlined text-[12px]">
                              location_on
                            </span>
                            <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em]">
                              {issue.address}
                            </span>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          navigate("/issues");
                          setIsSearchOpen(false);
                        }}
                        className="bg-on-surface px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-surface transition-colors hover:bg-primary"
                      >
                        Explore all archive
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) {
                  setSearchQuery("");
                  setSearchResults([]);
                }
              }}
              title={isSearchOpen ? "Close Search" : "Open Search"}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/80 text-on-surface shadow-[0_10px_30px_rgba(20,20,20,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-on-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">
                {isSearchOpen ? "close" : "search"}
              </span>
            </button>

            {user && (
              <div className="relative hidden md:block shrink-0">
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  title="Profile Menu"
                  className="flex items-center gap-2 rounded-full border border-white/50 bg-white/80 p-1.5 pr-3 shadow-[0_10px_30px_rgba(20,20,20,0.08)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-on-surface/10 bg-gradient-to-br from-primary/20 to-white">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-on-surface text-sm font-bold uppercase text-surface">
                        {user.name?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="max-w-24 truncate text-[11px] font-black uppercase tracking-[0.2em] text-on-surface/45">
                      Account
                    </p>
                    <p className="max-w-24 truncate text-xs font-bold uppercase tracking-[0.12em] text-on-surface">
                      {user.name || "Citizen"}
                    </p>
                  </div>
                  <span
                    className="material-symbols-outlined text-on-surface/60 transition-transform duration-300"
                    style={{
                      transform: isProfileDropdownOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-4 flex w-60 flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(20,20,20,0.12)] backdrop-blur-2xl">
                    <div className="border-b border-on-surface/5 p-5">
                      <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-on-surface">
                        {user.name}
                      </p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.15em] text-on-surface/45">
                        {user.email || "Civic Advocate"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 p-2">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate("/dashboard");
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:bg-on-surface/5"
                      >
                        <span className="material-symbols-outlined text-lg opacity-70">
                          dashboard
                        </span>
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:bg-on-surface/5"
                      >
                        <span className="material-symbols-outlined text-lg opacity-70">
                          manage_accounts
                        </span>
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                          navigate("/");
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold uppercase tracking-[0.14em] text-error transition-colors hover:bg-error/10"
                      >
                        <span className="material-symbols-outlined text-lg">
                          logout
                        </span>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      <nav className="md:hidden fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 justify-around items-center rounded-full border border-white/60 bg-white/80 px-3 py-3 shadow-[0_18px_60px_rgba(20,20,20,0.14)] backdrop-blur-2xl">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              title={link.label}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center rounded-full px-3 py-2 transition-all duration-300",
                isActive
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                  : "text-on-surface opacity-65 hover:opacity-100 hover:text-primary",
              )}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
