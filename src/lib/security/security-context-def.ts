import { createContext } from 'react';

export interface SecurityContextType {
  isSecure: boolean;
  sanitizeHTML: (html: string) => string;
  sanitizeInput: (input: string) => string;
}

export const SecurityContext = createContext<SecurityContextType | null>(null);
