import type { Category } from "@/lib/types";

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function hexToRgb(hex: string) {
  const num = parseInt(hex.replace("#", ""), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
}

const ICON_PATHS: Record<Category, { viewBox: string; render: (stroke: string) => React.ReactNode }> = {
  shoes: {
    viewBox: "0 0 240 140",
    render: (stroke) => (
      <g fill="none" stroke={stroke} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 116 Q12 96 34 88 L58 56 Q78 36 112 40 L168 45 Q202 50 218 80 Q228 98 217 112 Q211 121 196 121 Z" />
        <path d="M18 116 Q120 133 224 110" />
        <path d="M72 52 L88 92" />
        <path d="M98 44 L112 90" />
        <path d="M124 43 L136 88" />
      </g>
    ),
  },
  bags: {
    viewBox: "0 0 240 240",
    render: (stroke) => (
      <g fill="none" stroke={stroke} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="42" y="96" width="156" height="114" rx="12" />
        <path d="M78 96 C78 48 162 48 162 96" />
        <path d="M42 138 L198 138" />
      </g>
    ),
  },
  glasses: {
    viewBox: "0 0 240 140",
    render: (stroke) => (
      <g fill="none" stroke={stroke} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="68" cy="72" r="40" />
        <circle cx="172" cy="72" r="40" />
        <path d="M108 66 Q120 56 132 66" />
        <path d="M28 62 L4 48" />
        <path d="M212 62 L236 48" />
      </g>
    ),
  },
};

interface ProductVisualProps {
  category: Category;
  colorHex: string;
  seed: string;
  variant?: 0 | 1;
  className?: string;
}

export default function ProductVisual({
  category,
  colorHex,
  seed,
  variant = 0,
  className = "",
}: ProductVisualProps) {
  const hash = hashString(seed + variant);
  const angle = 25 + (hash % 130);
  const isLight = relativeLuminance(colorHex) > 0.6;
  const gradientA = colorHex;
  const gradientB = isLight ? shade(colorHex, -28) : shade(colorHex, variant === 0 ? 34 : -22);
  const strokeColor = isLight ? "rgba(10,10,10,0.82)" : "rgba(255,255,255,0.88)";
  const icon = ICON_PATHS[category];
  const rotate = variant === 1 ? (hash % 10) - 5 : 0;
  const scale = variant === 1 ? 1.08 : 1;
  const gradId = `grad-${seed}-${variant}`;

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={gradId} gradientTransform={`rotate(${angle})`}>
          <stop offset="0%" stopColor={gradientA} />
          <stop offset="100%" stopColor={gradientB} />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${gradId})`} />
      <circle
        cx={80 + (hash % 60)}
        cy={320 - (hash % 40)}
        r={140}
        fill={isLight ? "rgba(10,10,10,0.04)" : "rgba(255,255,255,0.06)"}
      />
      <g transform={`translate(200 200) rotate(${rotate}) scale(${scale}) translate(-120 -70)`}>
        <svg x="0" y="0" width="240" height="140" viewBox={icon.viewBox}>
          {icon.render(strokeColor)}
        </svg>
      </g>
    </svg>
  );
}
