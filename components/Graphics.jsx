"use client";
import React from "react";

// かわいいマスコット（丸い鳥）。正解時に happy で喜ぶ。
export function Mascot({ happy }) {
  return (
    <svg width="46" height="46" viewBox="0 0 100 100" className={happy ? "mascotHappy" : "mascotFloat"}>
      <ellipse cx="50" cy="58" rx="34" ry="32" fill="#FFD36E" />
      <ellipse cx="50" cy="62" rx="22" ry="20" fill="#FFF1CF" />
      <circle cx="40" cy="50" r="5" fill="#4A3B2F" />
      <circle cx="60" cy="50" r="5" fill="#4A3B2F" />
      <circle cx="41.5" cy="48.5" r="1.6" fill="#fff" />
      <circle cx="61.5" cy="48.5" r="1.6" fill="#fff" />
      <path d="M44 60 Q50 66 56 60" stroke="#E8845B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <polygon points="50,56 46,61 54,61" fill="#F2913D" />
      <path d="M30 30 Q40 20 46 32" stroke="#FFD36E" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M70 30 Q60 20 54 32" stroke="#FFD36E" strokeWidth="7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// 花丸（手書き風のぐるぐる＋花びら）。size で大きさを変えられる。
export function Hanamaru({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220">
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x = 110 + Math.cos(a) * 78;
        const y = 110 + Math.sin(a) * 78;
        return <circle key={i} cx={x} cy={y} r="20" fill="#FF8FA3" opacity="0.9" />;
      })}
      <circle cx="110" cy="110" r="70" fill="#FFD8E0" />
      <g fill="none" stroke="#E8513C" strokeWidth="9" strokeLinecap="round">
        <circle cx="110" cy="110" r="60" strokeDasharray="350 40" />
        <circle cx="110" cy="110" r="44" strokeDasharray="250 36" />
      </g>
    </svg>
  );
}
