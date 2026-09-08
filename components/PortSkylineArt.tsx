const CONTAINER_COLORS = ["#9AA3EC", "#1C6E71", "#E7B15C", "#E7EAE1", "#291B8D"];

const CRANE_X = [1000, 1110, 1230, 1350, 1460, 1560];

function Crane({ x, scale = 1, opacity = 0.68 }: { x: number; scale?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} 660) scale(${scale})`} opacity={opacity}>
      {/* portal legs */}
      <path
        d="M-55,0 L-16,-380 L16,-380 L55,0"
        fill="none"
        stroke="#050B18"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* cross bracing */}
      <line x1="-46" y1="-90" x2="46" y2="-90" stroke="#050B18" strokeWidth="4" />
      <line x1="-36" y1="-190" x2="36" y2="-190" stroke="#050B18" strokeWidth="4" />
      <line x1="-26" y1="-290" x2="26" y2="-290" stroke="#050B18" strokeWidth="4" />
      <line x1="-55" y1="0" x2="16" y2="-380" stroke="#050B18" strokeWidth="2.5" opacity="0.7" />
      <line x1="55" y1="0" x2="-16" y2="-380" stroke="#050B18" strokeWidth="2.5" opacity="0.7" />
      {/* mast to boom */}
      <line x1="0" y1="-380" x2="0" y2="-430" stroke="#050B18" strokeWidth="7" strokeLinecap="round" />
      {/* main boom, reaching toward the ship */}
      <path d="M0,-430 L-230,-458" stroke="#050B18" strokeWidth="8" strokeLinecap="round" />
      {/* counter jib + counterweight */}
      <path d="M0,-430 L95,-412" stroke="#050B18" strokeWidth="7" strokeLinecap="round" />
      <rect x="88" y="-420" width="26" height="18" fill="#050B18" />
      {/* machine house */}
      <rect x="-14" y="-452" width="30" height="18" fill="#050B18" />
      {/* hoist cables + spreader */}
      <line x1="-150" y1="-450" x2="-150" y2="-270" stroke="#050B18" strokeWidth="2" />
      <line x1="-128" y1="-448" x2="-128" y2="-270" stroke="#050B18" strokeWidth="2" />
      <rect x="-158" y="-270" width="38" height="12" fill="#050B18" />
    </g>
  );
}

/**
 * A dusk-lit container-port scene: gantry cranes on the horizon, a laden
 * container ship in the foreground, sun glow, and water reflections.
 * Illustrated (not a photo) so it stays crisp at any size with no
 * licensing concerns — swap for a licensed photograph later if preferred.
 */
export default function PortSkylineArt({ className = "" }: { className?: string }) {
  const rows = 3;
  const cols = 17;
  const cellW = 27;
  const cellH = 24;
  const gap = 3;
  const startX = 95;
  const baseY = 596;

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of a container ship arriving at a port beneath gantry cranes at dusk"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#08142A" />
          <stop offset="45%" stopColor="#152559" />
          <stop offset="75%" stopColor="#213a7c" />
          <stop offset="100%" stopColor="#33509e" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFDA9E" stopOpacity="0.65" />
          <stop offset="55%" stopColor="#FFB870" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFB870" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c4380" />
          <stop offset="100%" stopColor="#081428" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1600" height="900" fill="url(#sky)" />
      <circle cx="1230" cy="360" r="360" fill="url(#sun)" />

      {/* cranes on the horizon */}
      {CRANE_X.map((x, i) => (
        <Crane key={x} x={x} scale={0.82 + (i % 3) * 0.07} opacity={0.6 + (i % 2) * 0.15} />
      ))}

      {/* water */}
      <rect x="0" y="650" width="1600" height="250" fill="url(#water)" />
      {Array.from({ length: 10 }).map((_, i) => (
        <path
          key={i}
          d={`M0,${700 + i * 18} q40,-6 80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0`}
          stroke="#5A72B8"
          strokeOpacity={0.12 - i * 0.008}
          strokeWidth="1.5"
          fill="none"
        />
      ))}

      {/* ship hull */}
      <path d="M55,650 L100,596 L555,596 L660,552 L705,650 Z" fill="#081428" />
      {/* bridge */}
      <rect x="590" y="500" width="66" height="96" fill="#081428" />
      <rect x="600" y="512" width="14" height="14" fill="#33509e" opacity="0.5" />
      <rect x="622" y="512" width="14" height="14" fill="#33509e" opacity="0.5" />
      <rect x="632" y="480" width="10" height="24" fill="#081428" />

      {/* deck containers */}
      {Array.from({ length: rows }).flatMap((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const x = startX + col * (cellW + gap);
          const y = baseY - row * (cellH + gap) - cellH;
          const color = CONTAINER_COLORS[(row * 5 + col * 3) % CONTAINER_COLORS.length];
          if (row === 2 && (col < 2 || col > 13)) return null;
          if (col > 15 && row > 0) return null;
          return <rect key={`${row}-${col}`} x={x} y={y} width={cellW} height={cellH} fill={color} opacity={0.88} />;
        })
      )}

      {/* waterline foam under hull */}
      <path
        d="M40,652 q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0"
        stroke="#9AA3EC"
        strokeOpacity="0.4"
        strokeWidth="2"
        fill="none"
      />

      {/* small tug boat */}
      <path d="M770,640 L790,616 L840,616 L850,640 Z" fill="#081428" opacity="0.75" />
      <rect x="812" y="600" width="12" height="16" fill="#081428" opacity="0.75" />
    </svg>
  );
}
