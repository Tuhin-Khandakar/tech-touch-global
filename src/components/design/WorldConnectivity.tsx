'use client'

import { motion } from 'framer-motion'

// ── City positions in 520×420 viewBox ────────────────────────
// The "globe" is centred at (260, 210), radius ≈ 185
const CITIES = [
  { id: 'dhaka',   x: 345, y: 218, label: 'Dhaka',         primary: true  },
  { id: 'london',  x: 110, y: 102, label: 'London',         primary: false },
  { id: 'delhi',   x: 300, y: 196, label: 'Delhi',          primary: false },
  { id: 'beijing', x: 415, y: 140, label: 'Beijing',        primary: false },
  { id: 'kl',      x: 392, y: 280, label: 'Kuala Lumpur',   primary: false },
  { id: 'dubai',   x: 238, y: 178, label: 'Dubai',          primary: false },
] as const

// Cubic-bezier arcs from each city → Dhaka
const CONNECTIONS = [
  { id: 'london',  d: 'M110,102 C 190,60 270,110 345,218'  },
  { id: 'delhi',   d: 'M300,196 C 318,205 332,212 345,218' },
  { id: 'beijing', d: 'M415,140 C 395,168 372,196 345,218' },
  { id: 'kl',      d: 'M392,280 C 374,258 360,240 345,218' },
  { id: 'dubai',   d: 'M238,178 C 274,192 308,206 345,218' },
] as const

// Faint latitude arcs
const LATITUDES = [
  'M 90,148 Q 260,130 430,148',   // ~35°N
  'M 76,210 Q 260,210 444,210',   // Equator
  'M 90,272 Q 260,290 430,272',   // ~35°S
  'M 118,100 Q 260,78  402,100',  // ~60°N
]

// Faint meridian curves
const MERIDIANS = [
  'M 160,28  Q 155,210 160,392',   // ~60°E
  'M 258,24  Q 255,210 258,396',   // ~90°E
  'M 356,28  Q 358,210 356,392',   // ~120°E
]

// ── Easing helper ─────────────────────────────────────────────
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function WorldConnectivity() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 65% 55%, rgba(37,99,235,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Main SVG */}
      <svg
        viewBox="0 0 520 420"
        className="w-full h-full max-w-[560px] max-h-[450px]"
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        {/* Globe boundary circle */}
        <motion.circle
          cx={260} cy={210} r={185}
          fill="none"
          stroke="rgba(148,163,184,0.10)"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        />

        {/* Latitude arcs */}
        {LATITUDES.map((d, i) => (
          <motion.path
            key={i} d={d}
            fill="none"
            stroke="rgba(148,163,184,0.08)"
            strokeWidth={0.8}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 + i * 0.05 }}
          />
        ))}

        {/* Meridian arcs */}
        {MERIDIANS.map((d, i) => (
          <motion.path
            key={i} d={d}
            fill="none"
            stroke="rgba(148,163,184,0.08)"
            strokeWidth={0.8}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
          />
        ))}

        {/* Connection paths */}
        {CONNECTIONS.map((c, i) => (
          <motion.path
            key={c.id}
            d={c.d}
            fill="none"
            stroke="url(#conn-gradient)"
            strokeWidth={1.2}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 1.4, delay: 0.8 + i * 0.18, ease: EASE_OUT }}
          />
        ))}

        {/* Gradient definition for connections */}
        <defs>
          <linearGradient id="conn-gradient" gradientUnits="userSpaceOnUse"
            x1="110" y1="102" x2="345" y2="218">
            <stop offset="0%"   stopColor="#2563EB" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="dhaka-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#06B6D4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"   />
          </radialGradient>
        </defs>

        {/* Animated traveling dots along each connection */}
        {CONNECTIONS.map((c, i) => (
          <motion.circle
            key={`dot-${c.id}`}
            r={2.5}
            fill="#06B6D4"
            style={{
              offsetPath: `path('${c.d}')`,
              offsetDistance: '0%',
            } as React.CSSProperties}
            animate={{ offsetDistance: ['0%', '100%'] } as Record<string, string[]>}
            transition={{
              duration: 3,
              delay: 1.2 + i * 0.4,
              repeat: Infinity,
              repeatDelay: 2 + i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* City nodes */}
        {CITIES.map((city, i) => (
          <motion.g
            key={city.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.1, ease: EASE_OUT }}
          >
            {/* Pulse rings (Dhaka only) */}
            {city.primary && (
              <>
                <circle
                  cx={city.x} cy={city.y} r={4}
                  fill="none" stroke="#06B6D4" strokeWidth={1.2}
                  opacity={0.7}
                  className="city-pulse"
                />
                <circle
                  cx={city.x} cy={city.y} r={4}
                  fill="none" stroke="#06B6D4" strokeWidth={1}
                  opacity={0.5}
                  className="city-pulse-delayed"
                />
                {/* Glow disc */}
                <circle
                  cx={city.x} cy={city.y} r={28}
                  fill="url(#dhaka-glow)"
                />
              </>
            )}

            {/* Dot */}
            <circle
              cx={city.x} cy={city.y}
              r={city.primary ? 5 : 3.5}
              fill={city.primary ? '#06B6D4' : '#2563EB'}
            />
            <circle
              cx={city.x} cy={city.y}
              r={city.primary ? 2.5 : 1.8}
              fill="#fff"
            />

            {/* City label */}
            <text
              x={city.x + (city.primary ? 0 : (city.x > 260 ? 8 : -8))}
              y={city.y + (city.primary ? 18 : (city.y < 210 ? -9 : 15))}
              textAnchor={city.primary ? 'middle' : (city.x > 260 ? 'start' : 'end')}
              fill="rgba(148,163,184,0.75)"
              fontSize={city.primary ? '10' : '8.5'}
              fontFamily="var(--font-body)"
              fontWeight="500"
              letterSpacing="0.03em"
            >
              {city.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
