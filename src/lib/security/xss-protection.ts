import { useEffect, useRef } from 'react';
import type { DOMPurify as DOMPurifyType } from 'dompurify';

// XSS Protection utilities
export class XSSProtection {
  private static sanitizer: DOMPurifyType | null = null;
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load DOMPurify dynamically for better security
      const DOMPurify = await import('dompurify');
      this.sanitizer = DOMPurify.default as DOMPurifyType;
      
      // Configure DOMPurify with strict settings
      if (this.sanitizer.setConfig) {
        this.sanitizer.setConfig({
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br',
            'ul', 'ol', 'li',
            'strong', 'em',
            'span'
          ],
          ALLOWED_ATTR: ['class', 'id', 'style'],
          ALLOW_DATA_ATTR: false,
          FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
          FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
          SANITIZE_DOM: true,
          SAFE_FOR_TEMPLATES: true,
          WHOLE_DOCUMENT: false,
          RETURN_DOM: false,
          RETURN_DOM_FRAGMENT: false
        });
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('DOMPurify not available, using fallback sanitization');
    }
  }

  static sanitizeHTML(html: string): string {
    if (this.sanitizer) {
      return this.sanitizer.sanitize(html);
    }
    
    // Fallback sanitization
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
}

// React Hook for XSS Protection
export function useXSSProtection() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      XSSProtection.initialize().then(() => {
        initializedRef.current = true;
      });
    }
  }, []);

  const sanitizeHTML = (html: string) => XSSProtection.sanitizeHTML(html);
  const sanitizeInput = (input: string) => XSSProtection.sanitizeInput(input);

  return { sanitizeHTML, sanitizeInput };
}

// Content Security Policy Monitor
export class CSPMonitor {
  private static violations: string[] = [];
  private static maxViolations = 10;

  static initialize(): void {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleViolation(event);
    });

    // Monitor for suspicious DOM modifications
    this.monitorDOMChanges();
  }

  private static handleViolation(event: SecurityPolicyViolationEvent): void {
    this.violations.push(`${event.violatedDirective}: ${event.blockedURI}`);
    
    if (this.violations.length > this.maxViolations) {
      this.triggerSecurityResponse();
    }
  }

  private static monitorDOMChanges(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'SCRIPT' || element.tagName === 'IFRAME') {
                this.handleSuspiciousElement(element);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private static handleSuspiciousElement(element: Element): void {
    // Check if element has suspicious attributes
    const suspiciousAttrs = ['onclick', 'onload', 'onerror', 'src'];
    let isSuspicious = false;

    suspiciousAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr);
        if (value && (value.includes('javascript:') || value.includes('data:'))) {
          isSuspicious = true;
        }
      }
    });

    if (isSuspicious) {
      element.remove();
      console.warn('Suspicious element removed by XSS protection');
    }
  }

  private static triggerSecurityResponse(): void {
    console.error('Too many security violations, triggering security response');
    
    // Clear sensitive data
    const tokenManager = import('./token-security').then(m => {
      const manager = m.TokenSecurityManager.getInstance();
      manager.clearSecureData();
    });

    // Redirect to login page
    window.location.href = '/login?security=violation';
  }
}

// Secure URL validator
export class SecureURLValidator {
  static isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);
      
      // Only allow same origin and whitelisted external domains
      const allowedDomains = [
        window.location.hostname,
        'supabase.co',
        'fonts.googleapis.com',
        'fonts.gstatic.com'
      ];

      return allowedDomains.some(domain => 
        parsed.hostname === domain || 
        parsed.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  static sanitizeURL(url: string): string {
    if (!this.isValidURL(url)) {
      return '#';
    }
    return url;
  }
}

// Initialize security measures
export function initializeSecurity(): void {
  // Initialize XSS protection
  XSSProtection.initialize();
  
  // Initialize CSP monitoring
  CSPMonitor.initialize();
  
  // Prevent console access in production
  if (process.env.NODE_ENV === 'production') {
    const consoleMethods = ['log', 'warn', 'error', 'debug', 'info'];
    consoleMethods.forEach((method: string) => {
      (console as unknown as Record<string, () => void>)[method] = () => {};
    });
  }
}
