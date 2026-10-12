interface GaneshMarkProps {
  imageUrl?: string;
  className?: string;
}

export function GaneshMark({ imageUrl, className = "" }: GaneshMarkProps) {
  if (imageUrl) {
    return <img src={imageUrl} alt="Lord Ganesha" className={`ganesh-image ${className}`} data-testid="ganesh-custom-image" />;
  }

  return (
    <svg className={`ganesh-mark ${className}`} viewBox="0 0 180 180" fill="none" aria-label="Gold line art of Lord Ganesha" role="img" data-testid="ganesh-default-mark">
      <defs>
        <linearGradient id="ganeshGold" x1="18" y1="8" x2="160" y2="174" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8D09A" />
          <stop offset=".45" stopColor="#B9893D" />
          <stop offset="1" stopColor="#7E5626" />
        </linearGradient>
      </defs>
      <g stroke="url(#ganeshGold)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M92 20c-9 7-13 16-11 27 2 12 11 17 20 25 12 10 14 27 8 39-5 10-15 14-22 8-6-5-5-16 2-20 6-4 13-1 14 5" />
        <path d="M80 48C63 38 42 41 34 55c-8 15 4 31 22 35 12 3 20-2 26-10M102 49c13-12 34-11 43 2 10 15 0 32-18 38-9 3-16 1-23-4" />
        <path d="M68 64c-10 7-14 18-12 29 2 13 10 21 22 27M121 63c11 6 16 17 15 28-1 14-9 22-21 28" />
        <path d="M79 119c-14 8-22 19-22 33M113 118c15 8 23 19 23 34M57 152c18-10 57-10 79 0" />
        <path d="M76 91c4-5 10-5 14 0M109 90c4-5 10-5 14 0" />
        <circle cx="83" cy="92" r="1.5" fill="#A8752F" stroke="none" />
        <circle cx="116" cy="91" r="1.5" fill="#A8752F" stroke="none" />
        <path d="M96 52c-7 8-8 21-2 31" />
        <path d="M90 19c3-7 10-10 16-7-1 8-5 13-12 15" />
        <path d="M46 126c8-5 14-5 20 0M128 126c8-5 14-5 20 0" />
      </g>
      <circle cx="97" cy="37" r="3" fill="#8F2631" />
    </svg>
  );
}