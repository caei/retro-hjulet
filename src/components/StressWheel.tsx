import React, { useState } from 'react';
import { Claim, Category } from '../types/retro';
import { useTheme } from '../context/ThemeContext';

interface StressWheelProps {
  claims: Claim[];
  categories: Category[];
  participantName?: string;
  size?: number;
  interactive?: boolean;
  onSelectClaim?: (claim: Claim) => void;
  selectedClaimId?: string | null;
}

export const StressWheel: React.FC<StressWheelProps> = ({
  claims,
  categories,
  participantName,
  size = 440,
  interactive = true,
  onSelectClaim,
  selectedClaimId
}) => {
  const [hoveredClaimId, setHoveredClaimId] = useState<string | null>(null);

  const center = size / 2;
  const innerRadius = size * 0.18; // Donut center
  const maxOuterRadius = size * 0.44; // Outer boundary
  const radiusRange = maxOuterRadius - innerRadius;

  const categoryMap = new Map<string, Category>();
  categories.forEach(c => categoryMap.set(c.id, c));

  const totalClaims = claims.length;
  const avgScore = totalClaims > 0
    ? (claims.reduce((sum, c) => sum + c.score, 0) / totalClaims).toFixed(1)
    : '0';

  // Get score color
  const getScoreColor = (num: number) => {
    if (num <= 3.5) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (num <= 6.5) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    if (num <= 8.0) return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  // Helper for Polar to Cartesian
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  // Helper to generate SVG path for a donut wedge / kakestykke
  const describeWedge = (
    cx: number,
    cy: number,
    rIn: number,
    rOut: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startInner = polarToCartesian(cx, cy, rIn, startAngle);
    const endInner = polarToCartesian(cx, cy, rIn, endAngle);
    const startOuter = polarToCartesian(cx, cy, rOut, startAngle);
    const endOuter = polarToCartesian(cx, cy, rOut, endAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', startInner.x, startInner.y,
      'L', startOuter.x, startOuter.y,
      'A', rOut, rOut, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
      'L', endInner.x, endInner.y,
      'A', rIn, rIn, 0, largeArcFlag, 0, startInner.x, startInner.y,
      'Z'
    ].join(' ');
  };

  const activeClaim = claims.find(c => c.id === (hoveredClaimId || selectedClaimId));

  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col items-center select-none w-full max-w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, maxWidth: '100%', aspectRatio: '1/1' }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
        >
          <defs>
            <radialGradient id={`wheelGlow-${size}`} cx="50%" cy="50%" r="50%">
              {isLight ? (
                <>
                  <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
                  <stop offset="85%" stopColor="#e2e8f0" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                  <stop offset="85%" stopColor="#0f172a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
                </>
              )}
            </radialGradient>
            <filter id="glow-slice" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background circle */}
          <circle cx={center} cy={center} r={maxOuterRadius} fill={`url(#wheelGlow-${size})`} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Concentric Guide Rings (Scores: 2, 4, 6, 8, 10) */}
          {[2, 4, 6, 8, 10].map(level => {
            const r = innerRadius + (level / 10) * radiusRange;
            return (
              <g key={level}>
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                  strokeOpacity={level === 10 ? '0.8' : '0.4'}
                  strokeDasharray={level === 10 ? undefined : '2 4'}
                />
                <text
                  x={center + 4}
                  y={center - r + 11}
                  fill="#64748b"
                  fontSize={size < 350 ? '8' : '9'}
                  fontFamily="monospace"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Slices (Kakestykker) */}
          {totalClaims === 0 ? (
            <g>
              <circle
                cx={center}
                cy={center}
                r={(innerRadius + maxOuterRadius) / 2}
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />
              <text
                x={center}
                y={center + maxOuterRadius * 0.65}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={size < 350 ? '11' : '13'}
                className="font-medium"
              >
                Ingen påstander lagt til ennå
              </text>
            </g>
          ) : (
            claims.map((claim, index) => {
              const sliceAngle = 360 / totalClaims;
              const startAngle = index * sliceAngle;
              const endAngle = (index + 1) * sliceAngle;
              const gap = totalClaims > 1 ? 1.5 : 0;

              // Radius is scaled by score (1 to 10)
              const scoreRatio = Math.max(0.15, Math.min(1, claim.score / 10));
              const sliceOuterRadius = innerRadius + scoreRatio * radiusRange;

              const cat = categoryMap.get(claim.categoryId);
              const color = cat ? cat.color : '#6366F1';
              const isHovered = hoveredClaimId === claim.id;
              const isSelected = selectedClaimId === claim.id;
              const highlight = isHovered || isSelected;

              const pathData = describeWedge(
                center,
                center,
                innerRadius + 2,
                highlight ? Math.min(maxOuterRadius + 4, sliceOuterRadius + 4) : sliceOuterRadius,
                startAngle + gap,
                endAngle - gap
              );

              // Center point for label / icon
              const midAngle = startAngle + sliceAngle / 2;
              const labelPos = polarToCartesian(
                center,
                center,
                innerRadius + (scoreRatio * radiusRange * 0.65),
                midAngle
              );

              return (
                <g
                  key={claim.id}
                  className={interactive ? 'cursor-pointer transition-all duration-200' : ''}
                  onMouseEnter={() => interactive && setHoveredClaimId(claim.id)}
                  onMouseLeave={() => interactive && setHoveredClaimId(null)}
                  onClick={() => interactive && onSelectClaim?.(claim)}
                >
                  <path
                    d={pathData}
                    fill={color}
                    fillOpacity={highlight ? 0.95 : 0.75}
                    stroke={highlight ? '#ffffff' : color}
                    strokeWidth={highlight ? 2.5 : 1}
                    filter={highlight ? 'url(#glow-slice)' : undefined}
                    className="transition-all duration-150"
                  />
                  {/* Score badge on slice if slice is wide enough */}
                  {sliceAngle > 18 && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={size < 350 ? '9' : '11'}
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-md select-none"
                    >
                      {claim.score}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Center Donut Core */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill={isLight ? "#ffffff" : "#0b0f19"}
            stroke={isLight ? "#cbd5e1" : "#334155"}
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Center text: Average score and claim count */}
          <text
            x={center}
            y={center - 10}
            textAnchor="middle"
            fill={isLight ? "#64748b" : "#94a3b8"}
            fontSize={size < 350 ? '10' : '11'}
            fontWeight="700"
            className="uppercase tracking-wider"
          >
            Snitt stress
          </text>
          <text
            x={center}
            y={center + 16}
            textAnchor="middle"
            fill={isLight ? "#0f172a" : "#f8fafc"}
            fontSize={size < 350 ? '22' : '28'}
            fontWeight="800"
            fontFamily="monospace"
          >
            {avgScore}
          </text>
          <text
            x={center}
            y={center + 32}
            textAnchor="middle"
            fill={isLight ? "#475569" : "#64748b"}
            fontSize={size < 350 ? '9' : '10'}
            fontWeight="600"
          >
            {totalClaims} {totalClaims === 1 ? 'påstand' : 'påstander'}
          </text>
        </svg>

        {/* Center score pill indicator when hovered or idle */}
        {activeClaim && (
          <div className="absolute top-2 inset-x-2 pointer-events-none flex justify-center">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2 shadow-xl max-w-xs text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{
                    backgroundColor: categoryMap.get(activeClaim.categoryId)?.color || '#6366F1'
                  }}
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 truncate">
                  {categoryMap.get(activeClaim.categoryId)?.name || 'Kategori'}
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400">
                  Stress: {activeClaim.score}/10
                </span>
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-100 font-medium line-clamp-2">
                "{activeClaim.text}"
              </p>
            </div>
          </div>
        )}
      </div>

      {participantName && (
        <div className="mt-2 text-center">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">{participantName} sitt stresshjul</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {totalClaims} kakestykker &bull; Snitt: <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">{avgScore}</span>/10
          </p>
        </div>
      )}
    </div>
  );
};
