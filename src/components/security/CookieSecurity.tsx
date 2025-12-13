import { useAuth } from '@/components/auth/useAuth';
import { useEffect } from 'react';

const CookieSecurity = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Set secure cookie attributes
    const setSecureCookie = (name: string, value: string, days: number = 7) => {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      
      // Secure cookie settings
      const secureCookie = `${name}=${value};${expires};path=/;SameSite=Strict;Secure;HttpOnly`;
      
      // For development, remove Secure flag
      const isDevelopment = process.env.NODE_ENV === 'development';
      const cookieSettings = isDevelopment 
        ? `${name}=${value};${expires};path=/;SameSite=Lax`
        : secureCookie;
      
      document.cookie = cookieSettings;
    };

    // Clear insecure cookies
    const clearInsecureCookies = () => {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        if (name && !name.includes('session') && !name.includes('auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        }
      });
    };

    if (user) {
      // Set user-specific secure cookies
      setSecureCookie('user_session', user.id, 1);
      setSecureCookie('last_activity', new Date().toISOString(), 7);
    }

    // Clean up insecure cookies
    clearInsecureCookies();

    // Set session timeout
    const sessionTimeout = setTimeout(() => {
      // Auto logout after 30 minutes of inactivity
      if (user) {
        document.cookie = 'user_session=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
        window.location.href = '/auth';
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearTimeout(sessionTimeout);
  }, [user]);

  // Add basic security headers via meta tags
  useEffect(() => {
    // Set security meta tags
    const updateMetaTags = () => {
      // Remove existing security meta tags if any
      const existingTags = document.querySelectorAll('meta[http-equiv]');
      existingTags.forEach(tag => tag.remove());

      // Add new security meta tags (excluding X-Frame-Options)
      const securityHeaders = [
        { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
        { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
        { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
      ];

      securityHeaders.forEach(header => {
        const meta = document.createElement('meta');
        meta.httpEquiv = header.httpEquiv;
        meta.content = header.content;
        document.head.appendChild(meta);
      });
    };

    updateMetaTags();
  }, []);

  return null;
};

export default CookieSecurity;
