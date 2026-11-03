import React, { useState } from 'react';
import { SpiderCategory } from '../types/retro';
import { useTheme } from '../context/ThemeContext';

interface SpiderChartProps {
  categories: SpiderCategory[];
  size?: number;
  interactive?: boolean;
  onSelectCategory?: (category: SpiderCategory) => void;
  selectedCategoryId?: string | null;
}

export const SpiderChart: React.FC<SpiderChartProps> = ({
  categories,
  size = 500,
  interactive = true,
  onSelectCategory,
  selectedCategoryId
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  const numAxes = categories.length;
  if (numAxes < 3) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/40"
        style={{ width: size, height: size, maxWidth: '100%' }}
      >
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-200">Trenger minst 3 kategorier for edderkoppdiagram</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Legg til fleire kategorier eller kjør KI-gruppering.</p>
        </div>
      </div>
    );
  }

  const center = size / 2;
  const radius = size * 0.38; // Max radius for level 10
  const angleStep = (2 * Math.PI) / numAxes;

  // Level grid values (1-10 scale)
  const levels = [2, 4, 6, 8, 10];

  // Helper to convert polar to x,y
  const getCoordinates = (index: number, score: number, maxRadius = radius) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (Math.max(0, Math.min(10, score)) / 10) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate polygon points for data
  const dataPoints = categories.map((cat, idx) => getCoordinates(idx, cat.averageScore));
  const polygonPath = dataPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Overall average
  const totalAvg = (categories.reduce((acc, c) => acc + c.averageScore, 0) / categories.length).toFixed(1);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, maxWidth: '100%', aspectRatio: '1/1' }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
        >
          <defs>
            <radialGradient id="spiderWebBgDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#0f172a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </radialGradient>

            <radialGradient id="spiderWebBgLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#f1f5f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.95" />
            </radialGradient>

            <linearGradient id="spiderAreaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={isLight ? "0.75" : "0.6"} />
              <stop offset="50%" stopColor="#c084fc" stopOpacity={isLight ? "0.6" : "0.4"} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={isLight ? "0.75" : "0.6"} />
            </linearGradient>

            <filter id="spiderGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill={isLight ? "url(#spiderWebBgLight)" : "url(#spiderWebBgDark)"}
            stroke={isLight ? "#cbd5e1" : "#334155"}
            strokeWidth="1.5"
          />

          {/* Web grid polygons for levels 2, 4, 6, 8, 10 */}
          {levels.map((lvl) => {
            const points = categories.map((_, i) => getCoordinates(i, lvl));
            const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
            return (
              <g key={lvl}>
                <path
                  d={path}
                  fill="none"
                  stroke={isLight ? "#cbd5e1" : "#334155"}
                  strokeWidth="1"
                  strokeDasharray={lvl === 10 ? undefined : '3 3'}
                  strokeOpacity={lvl === 10 ? '0.9' : '0.6'}
                />
                {/* Level indicator along top axis */}
                <text
                  x={center + 5}
                  y={center - (lvl / 10) * radius + 11}
                  fill={isLight ? "#1e293b" : "#94a3b8"}
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* Axis lines and Category Labels */}
          {categories.map((cat, idx) => {
            const axisEnd = getCoordinates(idx, 10);
            const isSelected = selectedCategoryId === cat.id;
            const isHovered = hoveredCatId === cat.id;
            const isHigh = cat.isHighFocus || cat.averageScore >= 6.5;

            // Compute label placement further out
            const labelDist = radius + 28;
            const angle = idx * angleStep - Math.PI / 2;
            const labelX = center + labelDist * Math.cos(angle);
            const labelY = center + labelDist * Math.sin(angle);

            // Determine text anchor based on position
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (Math.abs(Math.cos(angle)) > 0.3) {
              textAnchor = Math.cos(angle) > 0 ? 'start' : 'end';
            }

            // Colors adapting cleanly to Light vs Dark theme
            let labelColor: string;
            let scoreColor: string;

            if (isLight) {
              if (isSelected || isHovered) {
                labelColor = '#312e81'; // dark indigo
                scoreColor = '#1e1b4b';
              } else if (isHigh) {
                labelColor = '#991b1b'; // dark bold red
                scoreColor = '#b91c1c';
              } else {
                labelColor = '#0f172a'; // deep slate
                scoreColor = '#1e293b'; // dark slate
              }
            } else {
              if (isSelected || isHovered) {
                labelColor = '#ffffff';
                scoreColor = '#a5b4fc';
              } else if (isHigh) {
                labelColor = '#f87171';
                scoreColor = '#fca5a5';
              } else {
                labelColor = '#f1f5f9';
                scoreColor = cat.color || '#818cf8';
              }
            }

            return (
              <g
                key={cat.id}
                className={interactive ? 'cursor-pointer group' : ''}
                onMouseEnter={() => interactive && setHoveredCatId(cat.id)}
                onMouseLeave={() => interactive && setHoveredCatId(null)}
                onClick={() => interactive && onSelectCategory?.(cat)}
              >
                {/* Spoke line from center */}
                <line
                  x1={center}
                  y1={center}
                  x2={axisEnd.x}
                  y2={axisEnd.y}
                  stroke={isHigh ? (isLight ? '#dc2626' : '#ef4444') : (isLight ? '#94a3b8' : '#475569')}
                  strokeWidth={isHigh ? 1.8 : 1}
                  strokeOpacity={isHigh ? 0.9 : 0.6}
                />

                {/* Outer category label */}
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <text
                    x={0}
                    y={-2}
                    textAnchor={textAnchor}
                    fill={labelColor}
                    fontSize={size < 400 ? '11' : '12.5'}
                    fontWeight={isHigh || isSelected ? '800' : '700'}
                    className="transition-colors duration-150"
                  >
                    {isHigh ? '🚨 ' : ''}{cat.name}
                  </text>
                  <text
                    x={0}
                    y={13}
                    textAnchor={textAnchor}
                    fill={scoreColor}
                    fontSize="10.5"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    Score: {cat.averageScore.toFixed(1)}/10
                    {cat.claimIds ? ` (${cat.claimIds.length})` : ''}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Radar Filled Shape */}
          <path
            d={polygonPath}
            fill="url(#spiderAreaGrad)"
            stroke={isLight ? "#7c3aed" : "#a855f7"}
            strokeWidth={isLight ? "3" : "2.5"}
            filter="url(#spiderGlow)"
            className="transition-all duration-300"
          />

          {/* Data point markers on vertices */}
          {categories.map((cat, idx) => {
            const pt = dataPoints[idx];
            const isHigh = cat.isHighFocus || cat.averageScore >= 6.5;
            const isHovered = hoveredCatId === cat.id;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <g
                key={`pt-${cat.id}`}
                className={interactive ? 'cursor-pointer' : ''}
                onMouseEnter={() => interactive && setHoveredCatId(cat.id)}
                onMouseLeave={() => interactive && setHoveredCatId(null)}
                onClick={() => interactive && onSelectCategory?.(cat)}
              >
                {/* Pulsing ring if high focus - limited to exactly 2 pulse waves */}
                {isHigh && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 13 : 9}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeOpacity="0.85"
                    className="animate-ping"
                    style={{
                      animationIterationCount: 2,
                      animationDuration: '1.2s',
                      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
                      animationFillMode: 'forwards'
                    }}
                  />
                )}
                {/* Main point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected || isHovered ? 8 : 6}
                  fill={cat.color || '#7c3aed'}
                  stroke={isHigh ? "#ef4444" : "#ffffff"}
                  strokeWidth={isHigh ? 3 : 2.5}
                  className="transition-all duration-150 drop-shadow-md"
                />
              </g>
            );
          })}

          {/* Center Hub */}
          <circle
            cx={center}
            cy={center}
            r={19}
            fill={isLight ? "#ffffff" : "#0b0f19"}
            stroke={isLight ? "#94a3b8" : "#475569"}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          <text
            x={center}
            y={center + 4}
            textAnchor="middle"
            fill={isLight ? "#0f172a" : "#e2e8f0"}
            fontSize="11"
            fontWeight="800"
            fontFamily="monospace"
          >
            {totalAvg}
          </text>
        </svg>
      </div>

      {/* Center score pill indicator when hovered or selected */}
      {selectedCategoryId && (
        <div className="mt-3 flex items-center justify-center">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-1.5 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Valgt kategori: {categories.find(c => c.id === selectedCategoryId)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
