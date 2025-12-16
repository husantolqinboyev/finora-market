interface SecureStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class TokenSecurityManager {
  private static instance: TokenSecurityManager;
  private storageKey = 'sb-auth-token';
  private obfuscationKey: string;
  private accessAttempts = 0;
  private maxAccessAttempts = 10;
  private lockoutDuration = 5 * 60 * 1000; // 5 minutes
  private lastAccessTime = 0;

  private constructor() {
    this.obfuscationKey = this.generateObfuscationKey();
    this.setupSecurityMonitoring();
  }

  static getInstance(): TokenSecurityManager {
    if (!TokenSecurityManager.instance) {
      TokenSecurityManager.instance = new TokenSecurityManager();
    }
    return TokenSecurityManager.instance;
  }

  private generateObfuscationKey(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return btoa(timestamp + random).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private setupSecurityMonitoring(): void {
    // Monitor for suspicious activity
    let accessCount = 0;
    const originalGetItem = localStorage.getItem.bind(localStorage);
    const originalSetItem = localStorage.setItem.bind(localStorage);
    
    localStorage.getItem = (key: string) => {
      if (key.includes('auth') || key.includes('token')) {
        accessCount++;
        if (accessCount > 50) { // Suspicious activity threshold
          this.triggerSecurityLockdown();
        }
      }
      return originalGetItem(key);
    };

    localStorage.setItem = (key: string, value: string) => {
      if (key.includes('auth') || key.includes('token')) {
        accessCount++;
        if (accessCount > 50) {
          this.triggerSecurityLockdown();
        }
      }
      return originalSetItem(key, value);
    };
  }

  private triggerSecurityLockdown(): void {
    console.warn('Suspicious activity detected - triggering security lockdown');
    this.clearSecureData();
    // In production, you might want to redirect to login page
    window.location.href = '/login?security=lockdown';
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    if (now - this.lastAccessTime < 100) { // Less than 100ms between accesses
      this.accessAttempts++;
      if (this.accessAttempts > this.maxAccessAttempts) {
        return true;
      }
    } else {
      this.accessAttempts = 0;
    }
    this.lastAccessTime = now;
    return false;
  }

  private obfuscateToken(token: string): string {
    const encoded = btoa(token);
    const obfuscated = encoded.split('').map((char, index) => {
      const keyChar = this.obfuscationKey[index % this.obfuscationKey.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    return btoa(obfuscated);
  }

  private deobfuscateToken(obfuscated: string): string | null {
    try {
      const decoded = atob(obfuscated);
      const token = decoded.split('').map((char, index) => {
        const keyChar = this.obfuscationKey[index % this.obfuscationKey.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      }).join('');
      return atob(token);
    } catch {
      return null;
    }
  }

  private validateContext(): boolean {
    // Check if we're in the right context (same origin, etc.)
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
      return false;
    }
    
    // Check for suspicious iframe context
    if (window.top !== window.self) {
      return false;
    }

    return true;
  }

  public secureGetToken(): string | null {
    if (!this.validateContext() || this.isRateLimited()) {
      return null;
    }

    try {
      const obfuscatedToken = localStorage.getItem(this.storageKey);
      if (!obfuscatedToken) return null;
      
      const token = this.deobfuscateToken(obfuscatedToken);
      if (!token) {
        this.removeItem();
        return null;
      }

      // Validate token format (basic JWT check)
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.removeItem();
        return null;
      }

      return token;
    } catch {
      this.removeItem();
      return null;
    }
  }

  public secureSetToken(token: string): void {
    if (!this.validateContext()) {
      throw new Error('Invalid security context');
    }

    try {
      // Validate token format before storing
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const obfuscatedToken = this.obfuscateToken(token);
      localStorage.setItem(this.storageKey, obfuscatedToken);
    } catch {
      throw new Error('Failed to secure token');
    }
  }

  public removeItem(): void {
    localStorage.removeItem(this.storageKey);
    // Also clear any other auth-related items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth') || key.includes('token') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  public clearSecureData(): void {
    this.removeItem();
    // Clear session storage as well
    sessionStorage.clear();
  }

  // Method to check if storage is accessible
  public isStorageAccessible(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

// Create secure storage adapter for Supabase
// DISABLED: Using standard Supabase localStorage to avoid token conflicts
const createSecureStorage = (): SecureStorage => {
  // Use standard localStorage to avoid conflicts with Supabase auth
  return {
    getItem: (key: string) => {
      return localStorage.getItem(key);
    },
    
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    
    removeItem: (key: string) => {
      localStorage.removeItem(key);
    },
    
    clear: () => {
      // Only clear non-auth items to preserve Supabase session
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('sb-') && !key.includes('auth') && !key.includes('token')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };
};

// Utility function to reset Supabase authentication storage
export const resetSupabaseAuth = (): void => {
  console.log('Resetting Supabase authentication storage...');
  
  // Clear all Supabase-related items
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('sb-') || key.includes('auth') || key.includes('token'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log(`Removing: ${key}`);
    localStorage.removeItem(key);
  });
  
  console.log(`Cleared ${keysToRemove.length} authentication items`);
};

// Utility function to check current auth state
export const checkAuthState = (): { hasToken: boolean; keys: string[] } => {
  const authKeys: string[] = [];
  let hasToken = false;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('sb-') || key.includes('auth') || key.includes('token'))) {
      authKeys.push(key);
      const value = localStorage.getItem(key);
      if (value && value.includes('ey')) { // JWT tokens start with 'ey'
        hasToken = true;
      }
    }
  }
  
  return { hasToken, keys: authKeys };
};

export { TokenSecurityManager, createSecureStorage };
export type { SecureStorage };
