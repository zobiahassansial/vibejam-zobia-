import React, { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatPage } from './components/chat/ChatPage';
import { FAQPage } from './components/FAQPage';
import { StatsPage } from './components/StatsPage';
import { AdminPage } from './components/AdminPage';
import { AboutPage } from './components/AboutPage';
import { AmbientBackground } from './components/common/AmbientBackground';
import { ToastProvider } from './components/common/Toast';
import { useChat } from './context/ChatContext';
import { useTheme } from './hooks/useTheme';
import type { NavPage } from './types';

const PAGE_PATHS: Record<Exclude<NavPage, 'admin'>, string> = {
  chat: '/', faqs: '/faqs', stats: '/statistics', about: '/about',
};

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="glass-panel max-w-md w-full rounded-3xl p-8 text-center shadow-glass">
        <p className="text-5xl font-black text-theme-primary-hover mb-3">404</p>
        <h1 className="text-lg font-bold text-theme-text mb-2">Page not found</h1>
        <p className="text-sm text-theme-muted mb-6">The page you requested does not exist.</p>
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-xl bg-theme-primary px-4 py-2 text-sm font-bold text-theme-on-primary hover:bg-theme-primary-hover">
          <Home size={15} /> Back to chat
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { setInput } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightFaqId, setHighlightFaqId] = useState<string | null>(null);
  const currentPage: NavPage = location.pathname === '/faqs' ? 'faqs'
    : location.pathname === '/statistics' ? 'stats'
    : location.pathname === '/about' ? 'about'
    : location.pathname === '/admin' ? 'admin' : 'chat';
  const handleNavigate = (page: NavPage) => navigate(page === 'admin' ? '/admin' : PAGE_PATHS[page]);
  const handleCitationClick = (faqId: string) => { setHighlightFaqId(faqId); navigate('/faqs'); };
  const handleAskInChat = (question: string) => { setInput(question); navigate('/'); };
  const isAdmin = location.pathname === '/admin';

  return (
    <div className="flex h-screen overflow-hidden bg-theme-bg text-theme-text theme-transition relative select-none">
      <AmbientBackground />
      {!isAdmin && <Sidebar currentPage={currentPage} onNavigate={handleNavigate} theme={theme} toggleTheme={toggleTheme} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />}
      <main className={`flex-1 overflow-hidden flex flex-col z-10 ${isAdmin ? '' : 'pb-16 md:pb-0'}`}>
        <Routes>
          <Route path="/" element={<ChatPage onNavigateToFaq={handleCitationClick} />} />
          <Route path="/faqs" element={<FAQPage highlightId={highlightFaqId} onAskInChat={handleAskInChat} />} />
          <Route path="/statistics" element={<StatsPage onAskFirstQuestion={() => navigate('/')} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/chat" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <ToastProvider><AppContent /></ToastProvider>;
}
