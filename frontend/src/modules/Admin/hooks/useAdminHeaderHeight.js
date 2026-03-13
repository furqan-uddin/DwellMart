import { useState, useEffect } from 'react';

/**
 * Hook to calculate the height of the admin header
 * This is useful for adding padding-top to admin page content on mobile
 */
const useAdminHeaderHeight = () => {
  const [headerHeight, setHeaderHeight] = useState(72); // Default to 72px (approximate header height)

  useEffect(() => {
    const calculateHeight = () => {
      // Look for admin header specifically
      const header = document.querySelector('header[class*="fixed"][class*="top-0"]');
      
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);
      } else {
        // Fallback: try to find any fixed header
        const fallbackHeader = document.querySelector('header.fixed');
        if (fallbackHeader) {
          setHeaderHeight(fallbackHeader.offsetHeight);
        }
      }
    };

    // Initial calculation
    calculateHeight();

    // Recalculate on resize
    window.addEventListener('resize', calculateHeight);
    
    // Recalculate after delays to ensure elements are rendered
    const timeoutId = setTimeout(calculateHeight, 100);
    const timeoutId2 = setTimeout(calculateHeight, 500);

    // Use MutationObserver to watch for header changes
    const observer = new MutationObserver(calculateHeight);
    const header = document.querySelector('header[class*="fixed"][class*="top-0"]');
    if (header) {
      observer.observe(header, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.removeEventListener('resize', calculateHeight);
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observer.disconnect();
    };
  }, []);

  return headerHeight;
};

export default useAdminHeaderHeight;

