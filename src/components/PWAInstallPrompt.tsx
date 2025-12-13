import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      return isStandalone || isInWebAppiOS || isInWebAppChrome;
    };

    setIsInstalled(checkIfInstalled());

    // Track visit count
    const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0');
    const newVisitCount = visitCount + 1;
    localStorage.setItem('pwa-visit-count', newVisitCount.toString());

    // Show install prompt on second visit if not already installed
    if (newVisitCount >= 2 && !checkIfInstalled() && !localStorage.getItem('pwa-install-dismissed')) {
      const timer = setTimeout(() => {
        setShowInstallModal(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallModal(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-visit-count');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.removeItem('pwa-visit-count');
      }
      
      setDeferredPrompt(null);
      setShowInstallModal(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallModal(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleLater = () => {
    setShowInstallModal(false);
  };

  if (isInstalled || !showInstallModal) {
    return null;
  }

  return (
    <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-cyan-600" />
              Finora ilovasini o'rnating
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Finora ilovasini telefoningizga o'rnating va tezroq kirish, offline rejim va boshqa imkoniyatlardan foydalaning!
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
            <Download className="h-10 w-10 text-cyan-600" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Finora Markent</h3>
            <p className="text-sm text-muted-foreground">
              Mahalliy bozor va mahsulotlar platformasi
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            onClick={handleInstallClick}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            disabled={!deferredPrompt}
          >
            O'rnating
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLater}
            className="flex-1"
          >
            Keyinroq
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
