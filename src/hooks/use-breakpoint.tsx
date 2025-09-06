import * as React from "react";
import { BREAKPOINTS } from "@/lib/breakpoints";

/**
 * Hook to check if the current viewport is smaller than a specified breakpoint
 * @param {keyof typeof BREAKPOINTS | number} breakpoint - The breakpoint to check against (can be a named breakpoint or custom size)
 * @returns {boolean} True if the viewport is smaller than the specified breakpoint
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS | number) {
  const size = typeof breakpoint === 'number' ? breakpoint : BREAKPOINTS[breakpoint];
  const [isSmaller, setIsSmaller] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${size - 1}px)`);
    const onChange = () => {
      setIsSmaller(window.innerWidth < size);
    };
    mql.addEventListener("change", onChange);
    setIsSmaller(window.innerWidth < size);
    return () => mql.removeEventListener("change", onChange);
  }, [size]);

  return !!isSmaller;
}
