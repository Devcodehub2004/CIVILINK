import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'HOME', path: '/', icon: 'home' },
    { label: 'EXPLORE', path: '/issues', icon: 'explore' },
    { label: 'REPORT', path: '/report', icon: 'add_circle' },
    { label: user ? 'PROFILE' : 'LOGIN', path: user ? '/dashboard' : '/login', icon: 'person' },
  ];

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
        console.log(`Searching for: ${searchQuery}`);
        try {
          const res = await axios.get(`/api/issues?search=${searchQuery}&limit=5`);
          if (res.data.success) {
            setSearchResults(res.data.data.issues || []);
          }
        } catch (err) {
          console.error('Search failed', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close search and results on navigation
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchResults([]);
    setSearchQuery('');
  }, [location.pathname]);

  return (
    <>
      {/* TopAppBar */}
      <header className="bg-surface border-b border-on-surface sticky top-0 z-[60]">
        <nav className="flex justify-between items-center w-full px-6 py-4 max-w-[1440px] mx-auto">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.svg" alt="CiviLink Logo" className="h-10 md:h-12 object-contain group-hover:scale-105 transition-transform origin-left" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                title={link.label}
                className={cn(
                  "text-sm font-bold tracking-[0.15em] px-5 py-2.5 rounded-full transition-all duration-300",
                  location.pathname === link.path 
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105" 
                    : "text-outline hover:bg-on-surface/5 hover:text-on-surface active:scale-95"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section / Search */}
          <div className="flex items-center gap-2 md:gap-4 relative">
            <div className="relative">
              <div className={cn(
                "flex items-center bg-surface-container rounded-full transition-all duration-300 overflow-hidden",
                isSearchOpen ? "w-32 sm:w-48 md:w-64 px-4 opacity-100" : "w-0 opacity-0 px-0"
              )}>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search reports..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm py-2 placeholder:text-outline/50" 
                />
              </div>

              {/* Search Results Dropdown - Moved outside overflow-hidden container */}
              {isSearchOpen && (searchResults.length > 0 || isSearching) && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-64 md:w-80 bg-surface border-2 border-on-surface rounded-2xl shadow-[8px_8px_0px_#000] z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {isSearching ? (
                    <div className="p-6 flex items-center justify-center">
                      <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
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
                            setSearchQuery('');
                          }}
                          className="flex flex-col items-start p-5 hover:bg-primary/5 text-left border-b-2 border-on-surface/5 last:border-none transition-colors group"
                        >
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">{issue.category}</span>
                          <span className="text-sm font-black uppercase truncate w-full group-hover:text-primary transition-colors">{issue.title}</span>
                          <div className="flex items-center gap-1 mt-1 opacity-40">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            <span className="text-[10px] font-bold uppercase truncate">{issue.address}</span>
                          </div>
                        </button>
                      ))}
                      <button 
                        onClick={() => {
                          navigate('/issues');
                          setIsSearchOpen(false);
                        }}
                        className="p-4 bg-on-surface text-surface text-center text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-colors"
                      >
                        Explore All Archive
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
                  setSearchQuery('');
                  setSearchResults([]);
                }
              }}
              title={isSearchOpen ? "Close Search" : "Open Search"}
              className="material-symbols-outlined text-xl md:text-2xl hover:bg-primary hover:text-on-primary p-2 md:p-3 rounded-full transition-colors active:scale-95 shrink-0"
            >
              {isSearchOpen ? 'close' : 'search'}
            </button>
            {user && (
              <div className="relative hidden md:block shrink-0">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  title="Profile Menu"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-on-surface flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="bg-on-surface text-surface w-full h-full flex items-center justify-center text-xs md:text-sm font-bold uppercase">
                        {user.name?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-on-surface opacity-60 transition-transform duration-300" style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-4 w-56 bg-surface border border-on-surface/10 rounded-xl shadow-xl shadow-on-surface/5 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-on-surface/5">
                      <p className="font-bold text-on-surface truncate">{user.name}</p>
                      <p className="text-xs opacity-60 truncate">{user.email || 'Civic Advocate'}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <button 
                        onClick={() => { setIsProfileDropdownOpen(false); navigate('/dashboard'); }}
                        className="flex items-center gap-3 px-3 py-2 text-left hover:bg-on-surface/5 rounded-lg transition-colors text-sm font-bold uppercase tracking-widest"
                      >
                        <span className="material-symbols-outlined text-lg opacity-70">dashboard</span>
                        Dashboard
                      </button>
                      <button 
                        onClick={() => { setIsProfileDropdownOpen(false); navigate('/profile'); }}
                        className="flex items-center gap-3 px-3 py-2 text-left hover:bg-on-surface/5 rounded-lg transition-colors text-sm font-bold uppercase tracking-widest"
                      >
                        <span className="material-symbols-outlined text-lg opacity-70">manage_accounts</span>
                        Settings
                      </button>

                      <button 
                        onClick={() => { setIsProfileDropdownOpen(false); logout(); navigate('/'); }}
                        className="flex items-center gap-3 px-3 py-2 text-left hover:bg-error/10 text-error rounded-lg transition-colors text-sm font-bold uppercase tracking-widest"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
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

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-surface/80 backdrop-blur-xl border-t border-on-surface">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              title={link.label}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300 px-4 py-2 rounded-full",
                isActive 
                  ? "bg-primary text-on-primary scale-105" 
                  : "text-on-surface opacity-60 hover:opacity-100 hover:text-primary"
              )}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] mt-1">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
