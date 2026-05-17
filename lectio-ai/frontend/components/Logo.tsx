import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * LectioAI — rasmiy logo komponenti.
 * SVG-based, istalgan o'lchamda sifat yo'qotmaydi.
 * hover va scale animatsiyasini className orqali bering.
 */
const Logo: React.FC<LogoProps> = ({ size = 40, className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="LectioAI Logo"
      role="img"
      style={{ flexShrink: 0 }}
    >
      <defs>
        {/* Asosiy amber-orange gradient */}
        <linearGradient id="logoMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#e8941a" />
        </linearGradient>

        {/* Yuqori porloq shine */}
        <linearGradient id="logoShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
          <stop offset="60%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>

        {/* Issiq drop-shadow */}
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="6"
            floodColor="#F5A623"
            floodOpacity={0.45}
          />
        </filter>

        <clipPath id="logoClip">
          <rect x="4" y="4" width="92" height="92" rx="22" ry="22" />
        </clipPath>
      </defs>

      {/* Shadow + asosiy fon */}
      <rect
        x="4" y="4" width="92" height="92"
        rx="22" ry="22"
        fill="url(#logoMain)"
        filter="url(#logoShadow)"
      />

      {/* Gloss shine overlay */}
      <rect
        x="4" y="4" width="92" height="92"
        rx="22" ry="22"
        fill="url(#logoShine)"
        clipPath="url(#logoClip)"
      />

      {/* "L" harfi */}
      <text
        x="50" y="72"
        fontFamily="'Georgia', 'Times New Roman', serif"
        fontSize="58"
        fontWeight="bold"
        textAnchor="middle"
        fill="#1a0800"
        opacity={0.88}
      >
        L
      </text>
    </svg>
  );
};

export default Logo;
