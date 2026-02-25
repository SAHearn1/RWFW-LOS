/**
 * FiveRsIcons — the five core RootWork framework icons.
 *
 * Each icon is a self-contained inline SVG that scales cleanly via className.
 * All share the brand palette:
 *   teal  #3D7A6A — primary fill
 *   sage  #6BAF8A — leaf / secondary fill
 *   olive #4A4A35 — stem / dark fill
 *   gold  #C5A059 — root / accent fill
 */

type IconProps = {
  className?: string;
};

/** Roots — hands cupping a seedling with a branching root network. */
export function RootsIcon({ className = "h-16 w-16" }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-label="Roots" className={className}>
      {/* Left hand cupping upward */}
      <path d="M6 58 C6 48 12 40 22 38 L34 37 C38 37 40 41 40 45 L40 62 C32 66 18 67 6 58Z" fill="#3D7A6A"/>
      {/* Right hand cupping upward */}
      <path d="M90 58 C90 48 84 40 74 38 L62 37 C58 37 56 41 56 45 L56 62 C64 66 78 67 90 58Z" fill="#3D7A6A"/>
      {/* Stem */}
      <line x1="48" y1="62" x2="48" y2="26" stroke="#4A4A35" strokeWidth="3" strokeLinecap="round"/>
      {/* Left leaf */}
      <path d="M48 40 C38 30 26 34 30 44 C36 42 42 40 48 40Z" fill="#6BAF8A"/>
      {/* Right leaf */}
      <path d="M48 40 C58 30 70 34 66 44 C60 42 54 40 48 40Z" fill="#6BAF8A"/>
      {/* Root network */}
      <path d="M48 62 L36 76" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 62 L48 78" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 62 L60 76" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 76 L28 84" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/>
      <path d="M36 76 L38 86" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/>
      <path d="M60 76 L58 86" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/>
      <path d="M60 76 L68 84" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/** Reflect — a head profile with leaf-thoughts emerging upward. */
export function ReflectIcon({ className = "h-16 w-16" }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-label="Reflect" className={className}>
      {/* Head profile facing right */}
      <path d="M30 80 L30 44 C30 28 38 16 52 16 C66 16 76 28 76 44 C76 58 66 66 58 70 L58 80 Z" fill="#3D7A6A"/>
      {/* Eye (negative space) */}
      <circle cx="62" cy="40" r="4" fill="#F8F7F2"/>
      {/* Leaf thought — upper left */}
      <path d="M46 16 C36 4 22 8 26 18 C32 16 40 15 46 16Z" fill="#6BAF8A"/>
      {/* Leaf thought — upper right */}
      <path d="M58 20 C54 6 68 2 72 12 C68 16 62 18 58 20Z" fill="#6BAF8A"/>
      {/* Gold thought-dot */}
      <circle cx="42" cy="10" r="3.5" fill="#C5A059" opacity="0.9"/>
      {/* Inner accent leaf */}
      <path d="M52 22 C46 14 38 18 40 24 C44 22 48 22 52 22Z" fill="#4A4A35" opacity="0.35"/>
    </svg>
  );
}

/** Relate — two facing profiles with a connecting plant growing between them. */
export function RelateIcon({ className = "h-16 w-16" }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-label="Relate" className={className}>
      {/* Left profile (facing right) */}
      <path d="M6 76 L6 42 C6 28 14 18 26 18 C38 18 44 28 44 42 C44 54 38 62 34 66 L34 76 Z" fill="#3D7A6A"/>
      <circle cx="32" cy="36" r="3.5" fill="#F8F7F2"/>
      {/* Right profile (facing left) */}
      <path d="M90 76 L90 42 C90 28 82 18 70 18 C58 18 52 28 52 42 C52 54 58 62 62 66 L62 76 Z" fill="#3D7A6A"/>
      <circle cx="64" cy="36" r="3.5" fill="#F8F7F2"/>
      {/* Central stem */}
      <line x1="48" y1="76" x2="48" y2="36" stroke="#6BAF8A" strokeWidth="3" strokeLinecap="round"/>
      {/* Left leaf on stem */}
      <path d="M48 54 C40 46 32 50 34 58 C38 56 44 54 48 54Z" fill="#6BAF8A"/>
      {/* Right leaf on stem */}
      <path d="M48 54 C56 46 64 50 62 58 C58 56 52 54 48 54Z" fill="#6BAF8A"/>
      {/* Top bud — two gold petals */}
      <path d="M48 36 C44 28 36 32 38 38 C42 37 46 36 48 36Z" fill="#C5A059" opacity="0.9"/>
      <path d="M48 36 C52 28 60 32 58 38 C54 37 50 36 48 36Z" fill="#C5A059" opacity="0.9"/>
    </svg>
  );
}

/** Rise — a plant with a deep root network reaching toward a golden bud. */
export function RiseIcon({ className = "h-16 w-16" }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-label="Rise" className={className}>
      {/* Root network */}
      <path d="M48 74 L34 88" stroke="#C5A059" strokeWidth="3" strokeLinecap="round"/>
      <path d="M48 74 L48 90" stroke="#C5A059" strokeWidth="3" strokeLinecap="round"/>
      <path d="M48 74 L62 88" stroke="#C5A059" strokeWidth="3" strokeLinecap="round"/>
      <path d="M34 88 L24 90" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/>
      <path d="M62 88 L72 90" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/>
      {/* Rising stem */}
      <line x1="48" y1="74" x2="48" y2="22" stroke="#4A4A35" strokeWidth="3" strokeLinecap="round"/>
      {/* Lower branch — left */}
      <path d="M48 56 C36 48 24 52 26 62 C32 59 40 57 48 56Z" fill="#6BAF8A"/>
      {/* Lower branch — right */}
      <path d="M48 56 C60 48 72 52 70 62 C64 59 56 57 48 56Z" fill="#6BAF8A"/>
      {/* Upper branch — left */}
      <path d="M48 40 C40 32 28 36 30 44 C36 42 42 40 48 40Z" fill="#3D7A6A"/>
      {/* Upper branch — right */}
      <path d="M48 40 C56 32 68 36 66 44 C60 42 54 40 48 40Z" fill="#3D7A6A"/>
      {/* Golden bud + rays */}
      <circle cx="48" cy="18" r="6" fill="#C5A059"/>
      <line x1="48" y1="8" x2="48" y2="14" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="58" y1="11" x2="54" y2="16" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="38" y1="11" x2="42" y2="16" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/** Radiate — a lotus center with sage petals and gold rays emanating outward. */
export function RadiateIcon({ className = "h-16 w-16" }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-label="Radiate" className={className}>
      {/* Gold rays */}
      <line x1="48" y1="6" x2="48" y2="20" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="76" y1="14" x2="67" y2="25" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="88" y1="42" x2="74" y2="46" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="80" y1="72" x2="68" y2="64" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="14" x2="29" y2="25" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="8" y1="42" x2="22" y2="46" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="16" y1="72" x2="28" y2="64" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Outer sage petals */}
      <path d="M48 56 C42 44 36 40 38 28 C44 34 48 44 48 56Z" fill="#6BAF8A"/>
      <path d="M48 56 C54 44 60 40 58 28 C52 34 48 44 48 56Z" fill="#6BAF8A"/>
      <path d="M48 56 C36 54 28 60 24 72 C32 68 40 62 48 56Z" fill="#6BAF8A"/>
      <path d="M48 56 C60 54 68 60 72 72 C64 68 56 62 48 56Z" fill="#6BAF8A"/>
      {/* Inner teal petals */}
      <path d="M48 54 C44 46 40 44 42 36 C46 40 48 47 48 54Z" fill="#3D7A6A"/>
      <path d="M48 54 C52 46 56 44 54 36 C50 40 48 47 48 54Z" fill="#3D7A6A"/>
      <path d="M48 54 C40 52 36 56 34 64 C38 60 43 57 48 54Z" fill="#3D7A6A"/>
      <path d="M48 54 C56 52 60 56 62 64 C58 60 53 57 48 54Z" fill="#3D7A6A"/>
      {/* Center */}
      <circle cx="48" cy="52" r="8" fill="#4A4A35"/>
      <circle cx="48" cy="52" r="4" fill="#C5A059"/>
    </svg>
  );
}

/** Full collection ordered for display: Roots → Reflect → Relate → Rise → Radiate */
export const FIVE_RS = [
  { id: "roots",   label: "Roots",   Icon: RootsIcon,   description: "Ground yourself in what matters — the roots of purpose, identity, and belonging." },
  { id: "reflect", label: "Reflect", Icon: ReflectIcon, description: "Turn inward. Make meaning from experience through honest, unhurried thought." },
  { id: "relate",  label: "Relate",  Icon: RelateIcon,  description: "Learning is relational. Build trust, share perspectives, and grow together." },
  { id: "rise",    label: "Rise",    Icon: RiseIcon,    description: "Apply what you know to reach new levels of understanding and capability." },
  { id: "radiate", label: "Radiate", Icon: RadiateIcon, description: "Share your growth. What you learn, teach. What you build, offer." },
] as const;
