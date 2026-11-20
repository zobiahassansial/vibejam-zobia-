import React from 'react';
import { Logo } from './Logo';
import {
  ExternalLink,
  Cpu,
  Users,
  Shield,
  Award,
  AlertCircle,
  HelpCircle,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { APP_CONFIG } from '../config';

export function AboutPage() {
  const config = APP_CONFIG;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border  glass-panel shrink-0">
        <h1 className="font-bold text-theme-text  text-lg">About AskSE</h1>
        <p className="text-xs text-theme-muted ">
          Competition submission identity, architecture, and evaluation profile
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 max-w-5xl">
        {/* Brand Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 glass-panel border border-theme-primary bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] shadow-glass">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <Logo size={52} showText={false} />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-theme-text  tracking-tight">
                    Ask<span className="text-theme-primary-hover ">SE</span>
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-theme-primary-soft text-theme-primary-hover  border border-theme-primary font-mono">
                    Entry ID: {config.entryId}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-theme-muted  mt-1 max-w-xl leading-relaxed">
                  Grounded University Help Desk AI Assistant designed for zero hallucination, strict FAQ citations, and offline operation.
                </p>
              </div>
            </div>

            <a
              href={config.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-surface  text-theme-text  text-xs font-bold border border-theme-border  hover:border-theme-primary hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
            >
              <span>View Source Code</span>
              <ExternalLink size={13} className="text-theme-primary-hover" />
            </a>
          </div>
        </div>

        {/* AI Grounding Notice Callout */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-theme-warning-soft border border-theme-warning text-theme-warning  text-xs">
          <AlertCircle size={17} className="text-theme-warning shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5">Mandatory Notice</span>
            <p className="leading-relaxed font-medium">{config.noticeText}</p>
          </div>
        </div>

        {/* How It Works 3-Step Diagram */}
        <div className="glass-panel p-6 rounded-2xl border border-theme-border ">
          <h3 className="text-xs font-bold text-theme-text  uppercase tracking-wider mb-4">
            How AskSE Works (3-Step Grounding Pipeline)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-theme-surface  border border-theme-border  space-y-2">
              <div className="flex items-center justify-between text-theme-primary-hover ">
                <HelpCircle size={20} />
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-theme-primary-soft">01</span>
              </div>
              <h4 className="text-xs font-bold text-theme-text ">1. Question Ingestion</h4>
              <p className="text-[11px] text-theme-muted  leading-relaxed">
                User input is sanitized and checked against prompt injection patterns and language detection (English vs Roman Urdu).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-theme-surface  border border-theme-border  space-y-2">
              <div className="flex items-center justify-between text-theme-primary-hover ">
                <Search size={20} />
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-theme-primary-soft">02</span>
              </div>
              <h4 className="text-xs font-bold text-theme-text ">2. SQLite FAQ Retrieval</h4>
              <p className="text-[11px] text-theme-muted  leading-relaxed">
                Live department FAQs are retrieved from SQLite and injected into Ollama Llama 3.2 with strict schema enforcement.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-theme-surface  border border-theme-border  space-y-2">
              <div className="flex items-center justify-between text-theme-success ">
                <CheckCircle2 size={20} />
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-theme-success-soft">03</span>
              </div>
              <h4 className="text-xs font-bold text-theme-text ">3. Citation Verification</h4>
              <p className="text-[11px] text-theme-muted  leading-relaxed">
                Python verifies all cited FAQ IDs exist in the database before returning answer badges like [FAQ-03].
              </p>
            </div>
          </div>
        </div>

        {/* Competition Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Profile */}
          <div className="glass-panel p-5 rounded-2xl border border-theme-border  space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-theme-text ">
              <Users size={16} className="text-theme-primary-hover " />
              <span>Team & Members</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-theme-faint block text-[11px]">Team Name</span>
                <span className="font-semibold text-theme-text ">{config.teamName}</span>
              </div>
              <div>
                <span className="text-theme-faint block text-[11px]">Members</span>
                <ul className="list-disc list-inside space-y-1 text-theme-muted  font-medium mt-1">
                  {config.teamMembers.map((member, i) => (
                    <li key={i}>{member}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AI & Model Specs */}
          <div className="glass-panel p-5 rounded-2xl border border-theme-border  space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-theme-text ">
              <Cpu size={16} className="text-theme-accent" />
              <span>AI Engine & Tools</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-theme-faint block text-[11px]">LLM API</span>
                <span className="font-mono text-theme-text ">{config.llmApi}</span>
              </div>
              <div>
                <span className="text-theme-faint block text-[11px]">Model Detected</span>
                <span className="font-mono font-bold text-theme-primary-hover ">{config.model}</span>
              </div>
              <div>
                <span className="text-theme-faint block text-[11px]">AI Development Tools</span>
                <span className="text-theme-muted  font-medium">{config.aiDevTools}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info: Mention of /admin */}
        <div className="p-4 rounded-2xl glass-panel border border-theme-border  flex items-center justify-between text-xs text-theme-muted ">
          <div className="flex items-center gap-2">
            <Lock size={13} className="text-theme-faint" />
            <span>Administrative panel is securely accessible at <code className="font-mono font-bold text-theme-primary-hover ">/admin</code></span>
          </div>
          <span className="text-[11px] font-mono">v1.2.0 • Nov 2026</span>
        </div>
      </div>
    </div>
  );
}
