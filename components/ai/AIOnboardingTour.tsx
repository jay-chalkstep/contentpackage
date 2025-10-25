'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAI } from '@/contexts/AIContext';
import Badge from '@/components/ui/Badge';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector for the element to highlight
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AIOnboardingTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
  className?: string;
}

const defaultSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI-Powered Aiproval!',
    description: 'Let me show you how AI can supercharge your workflow. This tour will only take a minute.',
    targetSelector: 'body',
    placement: 'bottom',
  },
  {
    id: 'analyze-button',
    title: 'Analyze with AI',
    description: 'Click this button to automatically extract tags, check accessibility, and analyze any mockup.',
    targetSelector: '[data-tour="analyze-button"]',
    placement: 'bottom',
  },
  {
    id: 'ai-tags',
    title: 'Smart Tags',
    description: 'AI automatically detects visual elements, colors, composition, and even brands in your mockups.',
    targetSelector: '[data-tour="ai-tags"]',
    placement: 'right',
  },
  {
    id: 'accessibility',
    title: 'Accessibility Checking',
    description: 'Get instant WCAG compliance feedback and suggestions to make your designs more accessible.',
    targetSelector: '[data-tour="accessibility-score"]',
    placement: 'right',
  },
  {
    id: 'similar-mockups',
    title: 'Find Similar Mockups',
    description: 'Discover visually similar mockups across your entire library using AI-powered search.',
    targetSelector: '[data-tour="similar-mockups"]',
    placement: 'left',
  },
  {
    id: 'search',
    title: 'Natural Language Search',
    description: 'Search using plain English like "blue backgrounds with minimal text" and AI will find exactly what you need.',
    targetSelector: '[data-tour="ai-search"]',
    placement: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'Start using AI features throughout Aiproval. You can replay this tour anytime from Settings.',
    targetSelector: 'body',
    placement: 'bottom',
  },
];

export default function AIOnboardingTour({
  steps = defaultSteps,
  onComplete,
  className = '',
}: AIOnboardingTourProps) {
  const { onboardingCompleted, markOnboardingComplete } = useAI();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(!onboardingCompleted);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (!isVisible) return;

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [currentStep, isVisible]);

  const updateSpotlight = () => {
    if (!step) return;

    const targetElement = document.querySelector(step.targetSelector);
    if (!targetElement) {
      // If target not found, position tooltip in center
      setSpotlightRect(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    setSpotlightRect(rect);

    // Calculate tooltip position based on placement
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setTooltipPosition({ top, left });
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    markOnboardingComplete();
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Overlay with spotlight effect */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - 8}
                  y={spotlightRect.top - 8}
                  width={spotlightRect.width + 16}
                  height={spotlightRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlighted element border */}
        {spotlightRect && (
          <div
            className="absolute border-2 border-purple-500 rounded-lg shadow-xl animate-pulse"
            style={{
              top: spotlightRect.top - 8,
              left: spotlightRect.left - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
              transition: 'all 0.3s ease-in-out',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-50 w-[400px] bg-white rounded-lg shadow-2xl border-2 border-purple-300 pointer-events-auto ${className}`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="h-5 w-5 flex-shrink-0" />
              <h3 className="font-semibold text-lg">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
              title="Skip tour"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">{step.description}</p>

          {/* Custom Action */}
          {step.action && (
            <button
              onClick={step.action.onClick}
              className="w-full mb-4 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 font-medium rounded-lg transition-colors"
            >
              {step.action.label}
            </button>
          )}

          {/* Progress */}
          <div className="flex items-center gap-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 inline mr-1" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLastStep ? (
                  <>
                    <Check className="h-4 w-4 inline mr-1" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 inline ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Badge */}
        <div className="absolute -top-3 -right-3">
          <Badge variant="ai" size="md">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Tour
          </Badge>
        </div>
      </div>
    </>
  );
}
