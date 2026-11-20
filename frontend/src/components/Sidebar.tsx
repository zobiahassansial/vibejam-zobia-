import React from 'react';
import {
  MessageSquare,
  HelpCircle,
  BarChart3,
  Info,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Logo } from './Logo';
import type { NavPage, Theme } from '../types';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  theme: Theme;
  toggleTheme: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const navItems: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
  { id: 'faqs', label: 'FAQs', icon: <HelpCircle size={18} /> },
  { id: 'stats', label: 'Statistics', icon: <BarChart3 size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

export function Sidebar({
  currentPage,
  onNavigate,
  theme,
  toggleTheme,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  return (
    <>
      {/* Desktop collapsible sidebar */}
      <aside
        className={`hidden md:flex flex-col z-30 transition-all duration-300 ease-in-out border-r border-theme-border bg-theme-elevated theme-transition shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-20 border-b border-theme-border ">
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-3 overflow-hidden text-left focus:outline-none"
            aria-label="Go to Chat"
          >
            <Logo size={34} showText={!collapsed} />
          </button>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-theme-faint hover:text-theme-muted  hover:bg-theme-surface-hover  transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed expand toggle button */}
        {collapsed && (
          <div className="flex justify-center py-2 border-b border-theme-border ">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg text-theme-faint hover:text-theme-primary-hover hover:bg-theme-surface-hover  transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'text-theme-primary-hover bg-theme-primary-soft shadow-[0_0_18px_var(--ring)] border border-theme-primary'
                    : 'text-theme-muted  hover:text-theme-text  hover:bg-theme-surface-hover '
                }`}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-theme-primary-hover" />
                )}
                <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 text-theme-primary-hover' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate tracking-wide">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions (Theme toggle) */}
        <div className="p-3 border-t border-theme-border ">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-theme-muted  hover:bg-theme-surface-hover  hover:text-theme-text  transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            <div className="p-1 rounded-lg bg-theme-surface-2 text-theme-muted transition-transform duration-200 group-hover:rotate-12">
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </div>
            {!collapsed && (
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Phone/Tablet) */}
      <header className="md:hidden z-30 flex items-center justify-between px-4 py-3 bg-theme-elevated theme-transition border-b border-theme-border shrink-0">
        <Logo size={30} />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-theme-muted  hover:bg-theme-surface-hover  transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} className="text-theme-warning" />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-theme-elevated theme-transition border-t border-theme-border px-3 py-2 flex items-center justify-around shadow-lg"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-theme-primary-hover  font-bold'
                  : 'text-theme-muted  hover:text-theme-text '
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 w-8 h-0.5 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
