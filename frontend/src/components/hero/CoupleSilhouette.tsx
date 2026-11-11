import { useId } from 'react';

/**
 * CoupleSilhouette Component
 * Renders the intimate, artistic silhouette of two adults (man on left, woman on right)
 * facing each other in tender profile, framed within a glowing celestial halo.
 *
 * Matching the exact visual reference:
 * - Authentic, graceful human profile silhouettes
 * - Man: defined brow, straight nose, lips, jawline, masculine shoulders
 * - Woman: delicate nose, gentle lips, soft chin, flowing hair
 * - Luminous rim-lighting along their facial contours
 * - Celestial halo circle encircling their heads and upper torsos
 */
export function CoupleSilhouette() {
  const id = useId();

  return (
    <div className="cinematic-hero__silhouette-wrap" aria-hidden="true">
      <svg
        className="cinematic-hero__silhouette"
        viewBox="0 0 520 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle plum body gradient fills */}
          <linearGradient id={`${id}-body-left`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#2c0e3a" stopOpacity="0.88" />
            <stop offset="55%" stopColor="#1e0928" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#120719" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`${id}-body-right`} x1="0.9" y1="0" x2="0.1" y2="1">
            <stop offset="0%" stopColor="#2e0f3d" stopOpacity="0.88" />
            <stop offset="55%" stopColor="#20092b" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#120719" stopOpacity="0" />
          </linearGradient>

          {/* Luminous rim-light gradients (rose pink to royal violet) */}
          <linearGradient id={`${id}-rim-left`} x1="0.5" y1="0" x2="1" y2="0.9">
            <stop offset="0%" stopColor="#ffd4eb" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#ff8ec8" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#c084fc" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`${id}-rim-right`} x1="0.5" y1="0" x2="0" y2="0.9">
            <stop offset="0%" stopColor="#ffd4eb" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#ff8ec8" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#c084fc" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
          </linearGradient>

          {/* Celestial Halo Ring Gradient */}
          <linearGradient id={`${id}-halo`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="22%" stopColor="#ff9ecb" stopOpacity="0.88" />
            <stop offset="55%" stopColor="#c084fc" stopOpacity="0.6" />
            <stop offset="85%" stopColor="#7e22ce" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
          </linearGradient>

          {/* Ambient atmosphere inside halo */}
          <radialGradient id={`${id}-halo-ambient`} cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#ff8ec8" stopOpacity="0.16" />
            <stop offset="45%" stopColor="#a855f7" stopOpacity="0.09" />
            <stop offset="80%" stopColor="#581c87" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#120719" stopOpacity="0" />
          </radialGradient>

          {/* Soft bloom filter */}
          <filter id={`${id}-halo-bloom`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient atmospheric radiance inside halo */}
        <circle cx="255" cy="165" r="155" fill={`url(#${id}-halo-ambient)`} />

        {/* Luminous Celestial Halo Ring */}
        <circle
          className="cinematic-hero__halo"
          cx="255"
          cy="165"
          r="150"
          fill="none"
          stroke={`url(#${id}-halo)`}
          strokeWidth="1.6"
          filter={`url(#${id}-halo-bloom)`}
        />

        {/* Inner delicate halo trace */}
        <circle
          cx="255"
          cy="165"
          r="148.5"
          fill="none"
          stroke="#ffbade"
          strokeOpacity="0.25"
          strokeWidth="0.75"
        />

        {/* MAN SILHOUETTE (Left - Facing Right) */}
        <g>
          {/* Man's Body Fill */}
          <path
            d="M 90 410
               C 105 345 125 295 155 250
               C 172 225 185 205 180 185
               C 160 145 155 105 185 75
               C 200 60 218 62 232 72
               C 238 88 238 100 236 108
               C 233 112 232 116 235 120
               C 238 123 245 125 244 128
               C 240 131 234 133 234 136
               C 236 138 238 140 237 142
               C 234 144 233 146 234 148
               C 236 150 237 153 234 156
               C 231 159 233 164 235 168
               C 225 174 218 182 215 192
               C 218 208 225 230 232 255
               C 242 290 256 340 268 410
               Z"
            fill={`url(#${id}-body-left)`}
          />

          {/* Luminous Rim Light Contouring Man's Profile */}
          <path
            d="M 232 72
               C 238 88 238 100 236 108
               C 233 112 232 116 235 120
               C 238 123 245 125 244 128
               C 240 131 234 133 234 136
               C 236 138 238 140 237 142
               C 234 144 233 146 234 148
               C 236 150 237 153 234 156
               C 231 159 233 164 235 168
               C 225 174 218 182 215 192
               C 218 208 225 230 232 255"
            fill="none"
            stroke={`url(#${id}-rim-left)`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* WOMAN SILHOUETTE (Right - Facing Left) */}
        <g>
          {/* Woman's Body Fill */}
          <path
            d="M 420 410
               C 405 345 385 295 355 250
               C 340 228 335 208 340 185
               C 360 145 365 105 335 75
               C 320 60 302 62 288 72
               C 282 88 282 100 284 108
               C 287 112 288 116 285 120
               C 282 123 275 125 276 128
               C 280 131 286 133 286 136
               C 284 138 282 140 283 142
               C 286 144 287 146 286 148
               C 284 150 283 153 286 156
               C 289 159 287 164 285 168
               C 295 174 302 182 305 192
               C 302 208 295 230 288 255
               C 278 290 264 340 252 410
               Z"
            fill={`url(#${id}-body-right)`}
          />

          {/* Luminous Rim Light Contouring Woman's Profile */}
          <path
            d="M 288 72
               C 282 88 282 100 284 108
               C 287 112 288 116 285 120
               C 282 123 275 125 276 128
               C 280 131 286 133 286 136
               C 284 138 282 140 283 142
               C 286 144 287 146 286 148
               C 284 150 283 153 286 156
               C 289 159 287 164 285 168
               C 295 174 302 182 305 192
               C 302 208 295 230 288 255"
            fill="none"
            stroke={`url(#${id}-rim-right)`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
