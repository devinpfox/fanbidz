'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase';

interface WalletTutorialProps {
  onComplete: () => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowDirection: 'left' | 'right' | 'top' | 'bottom';
}

type MockView = 'closed' | 'open' | 'modal';

export default function WalletTutorial({ onComplete }: WalletTutorialProps) {
  const supabase = createClientComponentClient<Database>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [mockView, setMockView] = useState<MockView>('closed');

  const steps = [
    {
      title: "Welcome to JustBidz!",
      description: "To purchase items, you need coins. 1 coin = $1. Let's show you how to add them!",
      targetSelector: null,
      centered: true,
      mockView: 'closed' as MockView,
    },
    {
      title: "Your Wallet Tab",
      description: "This is your wallet tab. Click it to open and see your balance!",
      targetSelector: '.tutorial-mock-tab',
      mockView: 'closed' as MockView,
    },
    {
      title: "Your Balance",
      description: "Here's your current coin balance. You can drag this widget up and down!",
      targetSelector: '.tutorial-mock-balance',
      mockView: 'open' as MockView,
    },
    {
      title: "Add Coins Button",
      description: "Click this button to deposit coins into your wallet.",
      targetSelector: '.tutorial-mock-add-btn',
      mockView: 'open' as MockView,
    },
    {
      title: "Quick Presets",
      description: "Use these buttons for quick deposits, or enter a custom amount below!",
      targetSelector: '.tutorial-mock-presets',
      mockView: 'modal' as MockView,
    },
    {
      title: "You're All Set!",
      description: "That's it! Add some coins and start bidding. Happy shopping!",
      targetSelector: null,
      centered: true,
      mockView: 'open' as MockView,
    },
  ];

  const step = steps[currentStep];

  // Hide real wallet during tutorial and update mock view
  useEffect(() => {
    const walletContainer = document.querySelector('.wallet-widget-container') as HTMLElement;

    if (walletContainer) {
      walletContainer.style.display = 'none';
    }

    // Update mock view based on step
    setMockView(step.mockView);

    return () => {
      // Show real wallet when tutorial unmounts
      if (walletContainer) {
        walletContainer.style.display = '';
      }
    };
  }, [step.mockView]);

  // Calculate tooltip position based on target element
  // MOBILE-SAFE tooltip position calculator
useEffect(() => {
  if (!step.targetSelector) {
    setTooltipPosition(null);
    return;
  }

  let isCancelled = false;

  const measure = () => {
    const el = document.querySelector(step.targetSelector as string) as HTMLElement | null;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;

    return rect;
  };

  const computePosition = () => {
    const rect = measure();
    if (!rect) return; // try again later

    const isMobile = window.innerWidth < 768;
    const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 320;
    const tooltipHeight = 200;
    const gap = isMobile ? 12 : 20;

    let pos: TooltipPosition;

    if (isMobile) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow > tooltipHeight + gap) {
        pos = {
          left: Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, rect.left + rect.width / 2 - tooltipWidth / 2)),
          top: rect.bottom + gap,
          arrowDirection: "top",
        };
      } else if (spaceAbove > tooltipHeight + gap) {
        pos = {
          left: Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, rect.left + rect.width / 2 - tooltipWidth / 2)),
          top: rect.top - tooltipHeight - gap,
          arrowDirection: "bottom",
        };
      } else {
        // Fallback for cramped screens
        pos = {
          left: (window.innerWidth - tooltipWidth) / 2,
          top: window.innerHeight - tooltipHeight - 80,
          arrowDirection: "top",
        };
      }
    } else {
      // desktop logic
      if (rect.left > window.innerWidth / 2) {
        pos = {
          left: rect.left - tooltipWidth - gap,
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          arrowDirection: "right",
        };
      } else {
        pos = {
          left: rect.right + gap,
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          arrowDirection: "left",
        };
      }

      if (pos.top < 20) pos.top = 20;
      if (pos.top + tooltipHeight > window.innerHeight - 20) {
        pos.top = window.innerHeight - tooltipHeight - 20;
      }
    }

    if (!isCancelled) setTooltipPosition(pos);
  };

  // ✔ Wait for layout, transforms, AND animation frames  
  const RAFmeasure = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!isCancelled) computePosition();
        }, 40);
      });
    });
  };

  // Initial run
  RAFmeasure();

  // Recalc on resize
  window.addEventListener("resize", RAFmeasure);

  // Recalc after mockView animations finish
  const animTimeout = setTimeout(() => {
    RAFmeasure();
  }, 300);

  return () => {
    isCancelled = true;
    clearTimeout(animTimeout);
    window.removeEventListener("resize", RAFmeasure);
  };
}, [currentStep, step.targetSelector, mockView]);


  const handleSkip = async () => {
    setIsExiting(true);
    await markTutorialComplete();
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const markTutorialComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        // @ts-expect-error - Type inference issue with @supabase/auth-helpers-nextjs v0.10.0
        .update({ first_time: false })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating tutorial status:', error);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  // Render mock wallet widget
  const renderMockWallet = () => {
    // Always show wallet except on first centered step
    if (step.centered && currentStep === 0) return null;

    return (
      <div className="fixed left-0 top-[25vh] md:top-[20vh] z-[150] transition-all duration-300" style={{ transform: 'translateY(-50%)' }}>
        {/* Closed tab view */}
        {mockView === 'closed' && (
          <div className="flex items-center animate-in fade-in duration-300">
            <div
              className="flex items-center transition-transform duration-300 ease-out"
              style={{ transform: 'translateX(-100%)' }}
            >
              <div className="flex items-center gap-2 md:gap-3 rounded-r-full bg-white border border-gray-100 shadow-lg pl-3 md:pl-5 pr-2 py-2 scale-90 md:scale-100 origin-left">
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-0.5">
                    WALLET
                  </span>
                  <div className="flex items-baseline gap-1 md:gap-1.5">
                    <span className="text-[22px] md:text-[26px] font-bold text-black tracking-tight tabular-nums leading-none">
                      0
                    </span>
                    <span className="text-[10px] md:text-[11px] font-medium text-gray-400 uppercase tracking-[0.08em] pb-0.5">
                      COINS
                    </span>
                  </div>
                </div>
                <button className="tutorial-mock-add-btn relative flex items-center gap-1.5 md:gap-2 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white rounded-[22px] pl-2.5 md:pl-3 pr-3 md:pr-4 py-2 md:py-2.5 shadow-md">
                  <div className="flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-full bg-white/25 border-2 border-white shrink-0">
                    <svg width="12" height="12" className="md:w-[14px] md:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[13px] md:text-[15px] font-bold leading-none">Add</span>
                    <span className="text-[13px] md:text-[15px] font-bold leading-none">Coins</span>
                  </div>
                </button>
              </div>
            </div>
            <button className="tutorial-mock-tab absolute left-full top-1/2 -translate-y-1/2 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-r-xl shadow-lg p-2.5 md:p-3">
              <svg className="w-5 h-5 md:w-6 md:h-6 opacity-90" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="white" opacity="0.95" />
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
                <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1" fill="none" opacity="0.6" />
                <text x="12" y="17" fontSize="14" fontWeight="bold" fill="rgba(236, 72, 153, 0.9)" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">$</text>
                <ellipse cx="9" cy="8" rx="3" ry="2" fill="white" opacity="0.4" />
              </svg>
            </button>
          </div>
        )}

        {/* Open wallet view */}
        {mockView === 'open' && (
          <div className="flex items-center animate-in fade-in duration-300">
            <div className="flex items-center transition-transform duration-300 ease-out">
              <div className="tutorial-mock-balance flex items-center gap-2 md:gap-3 rounded-r-full bg-white border border-gray-100 shadow-lg pl-3 md:pl-5 pr-2 py-2 scale-90 md:scale-100 origin-left">
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-0.5">
                    WALLET
                  </span>
                  <div className="flex items-baseline gap-1 md:gap-1.5">
                    <span className="text-[22px] md:text-[26px] font-bold text-black tracking-tight tabular-nums leading-none">
                      0
                    </span>
                    <span className="text-[10px] md:text-[11px] font-medium text-gray-400 uppercase tracking-[0.08em] pb-0.5">
                      COINS
                    </span>
                  </div>
                </div>
                <button className="tutorial-mock-add-btn relative flex items-center gap-1.5 md:gap-2 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white rounded-[22px] pl-2.5 md:pl-3 pr-3 md:pr-4 py-2 md:py-2.5 shadow-md">
                  <div className="flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-full bg-white/25 border-2 border-white shrink-0">
                    <svg width="12" height="12" className="md:w-[14px] md:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[13px] md:text-[15px] font-bold leading-none">Add</span>
                    <span className="text-[13px] md:text-[15px] font-bold leading-none">Coins</span>
                  </div>
                </button>
              </div>
            </div>
            <button className="absolute left-full top-1/2 -translate-y-1/2 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-r-xl shadow-lg p-2.5 md:p-3">
              <svg className="w-5 h-5 md:w-6 md:h-6 opacity-90" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="white" opacity="0.95" />
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
                <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1" fill="none" opacity="0.6" />
                <text x="12" y="17" fontSize="14" fontWeight="bold" fill="rgba(236, 72, 153, 0.9)" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">$</text>
                <ellipse cx="9" cy="8" rx="3" ry="2" fill="white" opacity="0.4" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render mock deposit modal
  const renderMockModal = () => {
    if (mockView !== 'modal') return null;

    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
          <button className="absolute top-3 right-3 md:top-4 md:right-4 text-black/60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <header className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Wallet</h1>
            <p className="mt-1 text-xs md:text-sm text-black/60">Add coins for purchases and tips.</p>
          </header>

          <section className="rounded-3xl border border-black/10 bg-white/5 p-4 md:p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs md:text-sm text-black/60">Current balance</p>
                <div className="mt-1 flex items-baseline gap-1.5 md:gap-2">
                  <span className="text-3xl md:text-4xl font-bold leading-none tracking-tight">0</span>
                  <span className="text-base md:text-lg text-black/70">coins</span>
                </div>
              </div>
              <span className="rounded-xl bg-gradient-to-br text-white from-[rgb(255,78,207)] to-purple-500 px-2.5 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-semibold shadow-lg shadow-[rgba(255,78,207,0.25)] whitespace-nowrap">
                1 coin = $1
              </span>
            </div>

            <div className="mt-4 md:mt-5">
              <div className="tutorial-mock-presets mb-3 grid grid-cols-4 gap-1.5 md:gap-2">
                {[10, 25, 50, 100].map((p) => (
                  <button key={p} className="rounded-2xl px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium transition border bg-white/5 text-black hover:bg-white/10 border-black/15">
                    +{p}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                <input type="number" value={10} readOnly className="flex-1 rounded-2xl border border-black/15 bg-black/5 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder-black/40 outline-none" placeholder="Amount (coins)" />
                <button className="inline-flex items-center text-white justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 px-4 py-2.5 md:py-3 text-xs md:text-sm font-semibold shadow-lg shadow-rose-500/25 whitespace-nowrap">
                  Add Coins
                </button>
              </div>

              <p className="mt-2 text-[10px] md:text-xs text-black/60">Minimum deposit is 1 coin.</p>
            </div>
          </section>
        </div>
      </div>
    );
  };

  // Render spotlight on target element
// Render spotlight with mobile-safe rect measurement
const renderSpotlight = () => {
  if (!step.targetSelector) return null;

  const el = document.querySelector(step.targetSelector);
  if (!el) return null;

  const rect = el.getBoundingClientRect();

  // If Safari hasn't finished layout yet, skip spotlight
  if (!rect || rect.width === 0 || rect.height === 0) return null;

  const padding = 8;

  return (
    <>
      <div
        className="absolute border-4 border-white rounded-xl transition-all duration-300"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
          pointerEvents: 'none',
          zIndex: 171,
        }}
      />
      <div
        className="absolute rounded-xl transition-all duration-300"
        style={{
          top: rect.top - padding - 4,
          left: rect.left - padding - 4,
          width: rect.width + padding * 2 + 8,
          height: rect.height + padding * 2 + 8,
          boxShadow: '0 0 20px 4px rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
          zIndex: 170,
        }}
      />
    </>
  );
};

  return (
    <div
      className={`fixed inset-0 z-[170] transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ pointerEvents: 'none' }}
    >
      {/* Dark overlay with spotlight */}
      {!step.centered && renderSpotlight()}
      {step.centered && (
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleSkip}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Mock wallet widget */}
      {renderMockWallet()}

      {/* Mock modal */}
      {renderMockModal()}

      {/* Tutorial tooltip */}
      <div
        className={`absolute z-[175] ${step.centered ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4' : ''}`}
        style={{
          pointerEvents: 'auto',
          ...((!step.centered && tooltipPosition)
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
              }
            : {})
        }}
      >
        <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden relative ${step.centered ? 'w-full max-w-[400px] mx-auto' : 'w-full max-w-[320px]'}`}>
          {/* Arrow pointing to element */}
          {!step.centered && tooltipPosition && (
            <div
              className="absolute w-0 h-0"
              style={{
                ...(tooltipPosition.arrowDirection === 'left' && {
                  left: '-12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '12px solid transparent',
                  borderBottom: '12px solid transparent',
                  borderRight: '12px solid white',
                }),
                ...(tooltipPosition.arrowDirection === 'right' && {
                  right: '-12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '12px solid transparent',
                  borderBottom: '12px solid transparent',
                  borderLeft: '12px solid white',
                }),
                ...(tooltipPosition.arrowDirection === 'top' && {
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderBottom: '12px solid white',
                }),
                ...(tooltipPosition.arrowDirection === 'bottom' && {
                  bottom: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '12px solid white',
                }),
              }}
            />
          )}

          {/* Header */}
          <div className="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 px-5 md:px-6 py-4 md:py-5 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium opacity-90">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-white/80 hover:text-white text-xs font-medium transition-colors"
              >
                Skip
              </button>
            </div>
            <h2 className={`font-bold mb-2 ${step.centered ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>{step.title}</h2>
            <p className={`text-white/90 leading-relaxed ${step.centered ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>{step.description}</p>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Navigation */}
          <div className="px-4 md:px-5 py-3 md:py-4 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 hover:shadow-lg transition-all"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
