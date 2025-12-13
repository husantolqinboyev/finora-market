import { useEffect } from 'react';
import { initializeSecurity } from './xss-protection';

// Security initialization component
export function SecurityInitializer() {
  useEffect(() => {
    initializeSecurity();
  }, []);

  return null;
}

// Higher-order component for security wrapping
export function withSecurity<P extends object>(Component: React.ComponentType<P>) {
  return function SecureComponent(props: P) {
    return (
      <>
        <SecurityInitializer />
        <Component {...props} />
      </>
    );
  };
}
