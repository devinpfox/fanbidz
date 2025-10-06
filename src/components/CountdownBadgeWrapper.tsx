// components/CountdownBadgeWrapper.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically load CountdownBadge without SSR
const CountdownBadge = dynamic(() => import("./CountdownBadge"), { ssr: false });

export default CountdownBadge;
