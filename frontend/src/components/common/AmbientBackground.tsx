export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Blob 1: Cyan / Blue */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-theme-primary-soft blur-[100px] animate-blob"
        style={{ animationDuration: '14s' }}
      />
      {/* Blob 2: Indigo / Violet */}
      <div
        className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-theme-primary-soft  blur-[120px] animate-blob"
        style={{ animationDuration: '18s', animationDelay: '2s' }}
      />
      {/* Blob 3: Violet / Fuchsia */}
      <div
        className="absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] rounded-full bg-theme-violet-soft blur-[110px] animate-blob"
        style={{ animationDuration: '16s', animationDelay: '4s' }}
      />
      {/* Subtle background mesh grid */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
    </div>
  );
}

