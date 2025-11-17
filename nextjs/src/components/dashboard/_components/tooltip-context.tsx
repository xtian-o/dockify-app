"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface TooltipContextType {
  activeTooltip: string | null;
  showTooltip: (id: string) => void;
  hideTooltip: (id: string) => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = useCallback(
    (id: string) => {
      // Clear any pending timeouts
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }

      // If switching between tooltips, do it instantly
      if (activeTooltip && activeTooltip !== id) {
        setActiveTooltip(id);
      } else if (!activeTooltip) {
        // Show with small delay only if no tooltip is active
        showTimeoutRef.current = setTimeout(() => {
          setActiveTooltip(id);
        }, 100);
      }
    },
    [activeTooltip],
  );

  const hideTooltip = useCallback((id: string) => {
    // Clear show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    // Hide with delay to allow switching between items
    hideTimeoutRef.current = setTimeout(() => {
      setActiveTooltip((current) => (current === id ? null : current));
    }, 150);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <TooltipContext.Provider
      value={{ activeTooltip, showTooltip, hideTooltip }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltip() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("useTooltip must be used within a TooltipProvider");
  }
  return context;
}
