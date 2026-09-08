/**
 * A very low-key decorative graphic: a dotted "world map" texture (two
 * loose landmass blobs, not geographically literal) plus a small crane +
 * ship silhouette, both faint enough to sit behind the profile section's
 * headline without competing with it.
 */
export default function WorldMapPortArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 760 420"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <pattern id="wmDots" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#123A57" />
        </pattern>
      </defs>

      {/* loose landmass blobs, dot-textured */}
      <path
        d="M40,120 C10,90 40,40 110,35 C170,30 210,55 260,50 C310,45 330,90 300,120 C340,140 320,190 270,185 C230,180 210,210 160,205 C100,200 60,175 55,150 C30,150 20,135 40,120 Z"
        fill="url(#wmDots)"
        opacity="0.55"
      />
      <path
        d="M360,60 C400,20 470,15 520,45 C580,35 650,55 680,95 C710,130 690,175 650,180 C660,215 620,245 575,230 C540,255 480,245 460,210 C410,215 370,185 375,150 C340,140 335,90 360,60 Z"
        fill="url(#wmDots)"
        opacity="0.55"
      />
      <path
        d="M480,240 C520,225 570,240 580,275 C610,280 615,320 585,335 C590,365 550,380 520,360 C490,375 455,355 460,325 C430,315 435,280 465,270 C460,250 465,245 480,240 Z"
        fill="url(#wmDots)"
        opacity="0.4"
      />

      {/* small port scene, bottom-right */}
      <g opacity="0.55" stroke="#123A57" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* cranes */}
        {[560, 620, 675].map((x, i) => (
          <g key={x} transform={`translate(${x} 340) scale(${0.8 + i * 0.06})`}>
            <path d="M-30,0 L-9,-140 L9,-140 L30,0" />
            <line x1="0" y1="-140" x2="0" y2="-160" />
            <path d="M0,-160 L-70,-172" />
            <path d="M0,-160 L32,-152" />
          </g>
        ))}
        {/* hull */}
        <path d="M420,340 L445,315 L560,315 L580,300 L600,340 Z" fill="#123A57" fillOpacity="0.5" stroke="none" />
        {/* containers */}
        <rect x="450" y="298" width="16" height="17" fill="#123A57" fillOpacity="0.5" stroke="none" />
        <rect x="468" y="298" width="16" height="17" fill="#123A57" fillOpacity="0.5" stroke="none" />
        <rect x="486" y="298" width="16" height="17" fill="#123A57" fillOpacity="0.5" stroke="none" />
        {/* waterline */}
        <path d="M400,342 h220" strokeWidth="1.5" opacity="0.6" />
      </g>
    </svg>
  );
}
