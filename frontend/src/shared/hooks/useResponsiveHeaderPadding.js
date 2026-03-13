import { useState, useEffect } from 'react';
import useHeaderHeight from './useHeaderHeight';

/**
 * Hook to calculate responsive padding-top for desktop vs mobile
 * On desktop (≥1024px), reduces padding to prevent excessive top spacing
 * On mobile, maintains full header height padding
 */
const useResponsiveHeaderPadding = () => {
  const headerHeight = useHeaderHeight();
  const [responsivePadding, setResponsivePadding] = useState(headerHeight);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updatePadding = () => {
      const width = window.innerWidth;
      const desktop = width >= 1024; // lg breakpoint
      setIsDesktop(desktop);

      if (desktop) {
        // Desktop: Use minimal padding (20% of header height, minimum 30px, maximum 50px)
        // Since headers are sticky on desktop, we only need minimal clearance to prevent overlap
        setResponsivePadding(Math.min(Math.max(headerHeight * 0.2, 30), 50));
      } else {
        // Mobile: Use full header height padding
        setResponsivePadding(headerHeight);
      }
    };

    // Initial calculation
    updatePadding();

    // Update on resize
    window.addEventListener('resize', updatePadding);

    // Recalculate when headerHeight changes
    const timeoutId = setTimeout(updatePadding, 100);

    return () => {
      window.removeEventListener('resize', updatePadding);
      clearTimeout(timeoutId);
    };
  }, [headerHeight]);

  return { responsivePadding, isDesktop };
};

export default useResponsiveHeaderPadding;

