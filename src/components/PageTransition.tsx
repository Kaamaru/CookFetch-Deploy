'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * PageTransition
 * Wraps page content and applies mount animations whenever the route changes.
 * Uses the Tailwind animation classes defined in tailwind.config.ts (slide-up, fade-in).
 */
const PageTransition: React.FC<React.PropsWithChildren<Record<string, unknown>>> = ({ children }) => {
  const pathname = usePathname();

  // Use pathname as key so the container remounts on navigation,
  // triggering the entry animation each time.
  return (
    // Use unified page animation for a cleaner, single effect on route change
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
};

export default PageTransition;
