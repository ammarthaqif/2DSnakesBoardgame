import React from 'react';
import { SNAKE_SKINS } from '../data/gameConstants';

interface SnakeSkinAvatarProps {
  skinId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCrown?: boolean;
  className?: string;
}

export const SnakeSkinAvatar: React.FC<SnakeSkinAvatarProps> = ({
  skinId,
  size = 'md',
  showCrown = false,
  className = '',
}) => {
  const skin = SNAKE_SKINS.find((s) => s.id === skinId) || SNAKE_SKINS[0];

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const svgSizes = {
    sm: 24,
    md: 32,
    lg: 44,
    xl: 64,
  };

  const dim = svgSizes[size];

  return (
    <div
      id={`snake-avatar-${skinId}-${size}`}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 shadow-md transition-transform ${sizeClasses[size]} ${className}`}
      style={{
        background: `radial-gradient(circle at 35% 35%, ${skin.headColor}, ${skin.bodyGradient[1] || skin.headColor})`,
        border: `2px solid ${skin.eyeColor}`,
      }}
    >
      {/* Snake face SVG */}
      <svg
        width={dim * 0.8}
        height={dim * 0.8}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Serpent snout */}
        <ellipse cx="16" cy="18" rx="10" ry="8" fill={skin.bodyGradient[0]} />
        <ellipse cx="16" cy="17" rx="8" ry="6" fill={skin.headColor} />

        {/* Scales pattern */}
        {skin.pattern === 'stripes' && (
          <path d="M10 14Q16 16 22 14M11 18Q16 20 21 18" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" />
        )}
        {skin.pattern === 'gold' && (
          <path d="M12 15L16 13L20 15L16 17Z" fill="#fef08a" opacity="0.8" />
        )}
        {skin.pattern === 'neon' && (
          <circle cx="16" cy="16" r="3" fill="#22d3ee" opacity="0.8" />
        )}

        {/* Nostrils */}
        <circle cx="14" cy="21" r="0.8" fill="#18181b" opacity="0.6" />
        <circle cx="18" cy="21" r="0.8" fill="#18181b" opacity="0.6" />

        {/* Eyes with slit pupils */}
        <ellipse cx="11" cy="14" rx="2.5" ry="3.5" fill={skin.eyeColor} />
        <ellipse cx="21" cy="14" rx="2.5" ry="3.5" fill={skin.eyeColor} />
        <ellipse cx="11" cy="14" rx="0.9" ry="2.8" fill="#0f172a" />
        <ellipse cx="21" cy="14" rx="0.9" ry="2.8" fill="#0f172a" />

        {/* Forked tongue */}
        <path
          d="M16 23V26M16 26L14 28M16 26L18 28"
          stroke={skin.tongueColor}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Crown badge if winner or high trophy */}
      {showCrown && (
        <span className="absolute -top-2 -right-1 text-amber-300 drop-shadow-md text-xs select-none">
          👑
        </span>
      )}
    </div>
  );
};
