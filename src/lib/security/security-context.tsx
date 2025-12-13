import { ReactNode } from 'react';
import { useXSSProtection } from './xss-protection';
import { SecurityContext, SecurityContextType } from './security-context-def';

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { sanitizeHTML, sanitizeInput } = useXSSProtection();
  
  const value: SecurityContextType = {
    isSecure: true,
    sanitizeHTML,
    sanitizeInput
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}
