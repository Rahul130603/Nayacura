import { useId } from 'react';

const ribbon = 'M 299 178 C 362 117 405 98 458 127 C 528 164 527 260 459 282 C 408 299 360 262 299 205 C 244 153 192 108 142 124 C 71 146 66 241 133 274 C 187 301 238 242 299 178';

export function SculptureFallback() {
  const id = useId();
  const url = (name: string) => 'url(#' + id + '-' + name + ')';
  return (
    <svg className="cinematic-hero__fallback" viewBox="0 0 600 450" aria-hidden="true">
      <defs>
        <linearGradient id={id + '-glass'} x1="0" y1="0.9" x2="0.92" y2="0">
          <stop stopColor="#561185" />
          <stop offset="0.24" stopColor="#b863ef" />
          <stop offset="0.42" stopColor="#4c087a" />
          <stop offset="0.69" stopColor="#f29bc5" />
          <stop offset="1" stopColor="#8d35c9" />
        </linearGradient>
        <linearGradient id={id + '-edge'} x1="0.07" y1="0.13" x2="0.84" y2="0.9">
          <stop stopColor="#f5d6ff" />
          <stop offset="0.35" stopColor="#a54af0" />
          <stop offset="0.65" stopColor="#ffe5f4" />
          <stop offset="1" stopColor="#f29bc5" />
        </linearGradient>
        <radialGradient id={id + '-lotus'} cx="0.5" cy="1" r="1">
          <stop stopColor="#fff4fa" />
          <stop offset="0.35" stopColor="#ff9acb" />
          <stop offset="1" stopColor="#9f3f9f" stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={id + '-floor'}>
          <stop stopColor="#f169b0" stopOpacity="0.4" />
          <stop offset="1" stopColor="#9b28a2" stopOpacity="0" />
        </radialGradient>
        <filter id={id + '-blur'} x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <linearGradient id={id + '-crossing-fade'}>
          <stop stopColor="black" />
          <stop offset="0.24" stopColor="white" />
          <stop offset="0.8" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id={id + '-crossing'} maskUnits="userSpaceOnUse" x="215" y="100" width="215" height="165">
          <rect x="215" y="100" width="215" height="165" fill={url('crossing-fade')} />
        </mask>
      </defs>
      <ellipse cx="300" cy="353" rx="236" ry="58" fill={url('floor')} />
      <g fill="none" stroke="#f29bc5">
        <ellipse cx="300" cy="192" rx="271" ry="65" transform="rotate(-14 300 192)" opacity="0.5" />
        <ellipse cx="300" cy="201" rx="249" ry="56" transform="rotate(15 300 201)" opacity="0.35" />
        <ellipse cx="300" cy="351" rx="112" ry="12" opacity="0.8" />
        <ellipse cx="300" cy="351" rx="176" ry="22" opacity="0.34" />
        <ellipse cx="300" cy="351" rx="219" ry="32" opacity="0.19" />
      </g>
      <g fill="none" strokeLinecap="round">
        <path d={ribbon} stroke={url('edge')} strokeWidth="44" opacity="0.47" filter={url('blur')} />
        <path d={ribbon} stroke={url('edge')} strokeWidth="35" />
        <path d={ribbon} stroke={url('glass')} strokeWidth="31" />
        <path d={ribbon} stroke={url('edge')} strokeWidth="9" opacity="0.38" transform="translate(0 -6)" />
        <g mask={url('crossing')}>
          <path d="M 249 230 C 291 195 343 144 397 123" stroke={url('edge')} strokeWidth="35" />
          <path d="M 249 230 C 291 195 343 144 397 123" stroke={url('glass')} strokeWidth="30" />
          <path d="M 250 225 C 291 189 343 137 396 118" stroke="#ffe0f7" strokeWidth="2.8" opacity="0.72" />
        </g>
      </g>
      <g transform="translate(300 345)" fill={url('lotus')} stroke="#f7b0d8" strokeWidth="0.85">
        <path d="M0 3C-25-9-25-32 0-54C25-32 25-9 0 3Z" />
        <path d="M0 4C-28-2-39-20-38-43C-13-40 2-23 0 4Z" />
        <path d="M0 4C28-2 39-20 38-43C13-40-2-23 0 4Z" />
        <path d="M0 4C-31 8-51-6-59-27C-36-28-11-14 0 4Z" />
        <path d="M0 4C31 8 51-6 59-27C36-28 11-14 0 4Z" />
        <path d="M0 4C-14-4-13-14 0-24C13-14 14-4 0 4Z" />
      </g>
      <g fill="#ffd5f1">
        <circle cx="55" cy="253" r="2" /><circle cx="105" cy="178" r="1.4" />
        <circle cx="158" cy="95" r="1.6" /><circle cx="450" cy="91" r="1.2" />
        <circle cx="535" cy="152" r="2" /><circle cx="552" cy="224" r="1.6" />
      </g>
    </svg>
  );
}

