export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 mb-4 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-theme-primary-hover  border border-theme-primary flex items-center justify-center shrink-0">
        <span className="w-2 h-2 rounded-full bg-theme-accent animate-ping" />
      </div>

      <div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-sm shadow-glass-sm flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-theme-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-theme-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-theme-violet animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs font-medium text-theme-muted  ml-1">
          AskSE is thinking...
        </span>
      </div>
    </div>
  );
}
