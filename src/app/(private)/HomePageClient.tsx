'use client';

import { useState, useEffect } from 'react';
import WalletTutorial from '@/components/WalletTutorial';

interface HomePageClientProps {
  showTutorial: boolean;
  children: React.ReactNode;
}

export default function HomePageClient({ showTutorial, children }: HomePageClientProps) {
  const [displayTutorial, setDisplayTutorial] = useState(false);

  useEffect(() => {
    // Small delay to let the page load before showing tutorial
    if (showTutorial) {
      const timer = setTimeout(() => {
        setDisplayTutorial(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showTutorial]);

  const handleTutorialComplete = () => {
    setDisplayTutorial(false);
  };

  return (
    <>
      {children}
      {displayTutorial && <WalletTutorial onComplete={handleTutorialComplete} />}
    </>
  );
}
