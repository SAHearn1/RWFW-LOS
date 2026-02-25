type Props = {
  className?: string;
  /** Show the full wordmark (icon + "RootWork" text). Default: icon only. */
  wordmark?: boolean;
};

/**
 * RootworkMark — the brand icon mark (plant stem + leaves + gold roots).
 * Renders as an inline SVG; scales cleanly at any size via className.
 * Pass wordmark={true} for the full header lock-up.
 */
export default function RootworkMark({ className = "h-8 w-auto", wordmark = false }: Props) {
  if (wordmark) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 32 36" fill="none" aria-hidden="true" className="h-full w-auto flex-shrink-0">
          {/* stem */}
          <line x1="16" y1="28" x2="16" y2="10" stroke="#4A4A35" strokeWidth="2.5" strokeLinecap="round"/>
          {/* left leaf */}
          <path d="M16 19 C9 12 3 16 6 22 C10 20 14 19 16 19Z" fill="#6BAF8A"/>
          {/* right leaf */}
          <path d="M16 19 C23 12 29 16 26 22 C22 20 18 19 16 19Z" fill="#6BAF8A"/>
          {/* roots */}
          <path d="M16 28 L9 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M16 28 L16 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M16 28 L23 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <span className="font-serif text-lg font-semibold tracking-tight text-rootwork-ink">
          RootWork
        </span>
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 32 36"
      fill="none"
      aria-label="RootWork"
      className={className}
    >
      {/* stem */}
      <line x1="16" y1="28" x2="16" y2="10" stroke="#4A4A35" strokeWidth="2.5" strokeLinecap="round"/>
      {/* left leaf */}
      <path d="M16 19 C9 12 3 16 6 22 C10 20 14 19 16 19Z" fill="#6BAF8A"/>
      {/* right leaf */}
      <path d="M16 19 C23 12 29 16 26 22 C22 20 18 19 16 19Z" fill="#6BAF8A"/>
      {/* roots */}
      <path d="M16 28 L9 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 28 L16 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 28 L23 36" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
