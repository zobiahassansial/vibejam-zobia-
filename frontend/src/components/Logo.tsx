interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 32, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative group shrink-0">
        {/* Subtle glow aura */}
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-30 blur-sm group-hover:opacity-75 transition duration-500" />
        
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--primary)" />
              <stop offset="0.6" stopColor="var(--primary-hover)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
          {/* Subtle geometric lines */}
          <path d="M4 12 L36 12" stroke="var(--on-primary)" strokeOpacity="0.12" strokeWidth="1" />
          <path d="M4 28 L36 28" stroke="var(--on-primary)" strokeOpacity="0.12" strokeWidth="1" />
          {/* Speech bubble tail */}
          <path d="M9 28 L5 35 L15 31" fill="var(--primary-hover)" />
          {/* SE mark */}
          <text
            x="6"
            y="26"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="800"
            fontSize="17"
            fill="var(--on-primary)"
            letterSpacing="-0.5"
          >
            SE
          </text>
          {/* Ask pulsing status dot */}
          <circle cx="31" cy="9" r="3.5" fill="var(--accent)" fillOpacity="0.5" />
          <circle cx="31" cy="9" r="2" fill="var(--on-primary)" />
        </svg>
      </div>

      {showText && (
        <span className="font-extrabold text-xl tracking-tight text-theme-text  select-none">
          Ask<span className="bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">SE</span>
        </span>
      )}
    </div>
  );
}
