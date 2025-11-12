import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  hasConsent: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: Partial<CookiePreferences>) => void;
  resetPreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const STORAGE_KEY = 'lovabi_cookie_consent';
const CONSENT_VERSION = '1.0';

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: Date.now(),
  version: CONSENT_VERSION,
};

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences(parsed);
        setShowBanner(false);
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const saveToStorage = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
  };

  const acceptAll = () => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    saveToStorage(prefs);
  };

  const rejectAll = () => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    saveToStorage(prefs);
  };

  const savePreferences = (partialPrefs: Partial<CookiePreferences>) => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: partialPrefs.analytics ?? false,
      marketing: partialPrefs.marketing ?? false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    saveToStorage(prefs);
  };

  const resetPreferences = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferences(null);
    setShowBanner(true);
  };

  const hasConsent = preferences !== null;

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        hasConsent,
        showBanner,
        acceptAll,
        rejectAll,
        savePreferences,
        resetPreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
};
