// FlipNumber.tsx (Simplified - assumes keyframes are loaded globally)
"use client";

import { useEffect, useState, useRef } from "react";

interface FlipNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function FlipNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className = "",
}: FlipNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsFlipping(true);

      // Start the flip animation
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 150); 

      const resetTimer = setTimeout(() => {
        setIsFlipping(false);
      }, 300); 

      prevValueRef.current = value;

      return () => {
        clearTimeout(timer);
        clearTimeout(resetTimer);
      };
    }
  }, [value]);

  const formattedValue = `${prefix}${displayValue.toFixed(decimals)}${suffix}`;

  return (
    <div className={`inline-block ${className}`}>
      <div
        className={`
          transition-all duration-300
          ${isFlipping ? "animate-pulse-glow" : ""} // Changed class name for clarity
        `}
        style={{
          display: "inline-block",
        }}
      >
        {formattedValue.split("").map((char, index) => (
          <span
            key={`${index}-${char}-${displayValue}`}
            className={`
              inline-block
              ${isFlipping ? "animate-flip-digit" : ""}
            `}
            style={{
              animationDelay: `${index * 30}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}