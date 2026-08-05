import React, { createContext, useContext } from 'react';
import { LinkedInInsightTag } from './LinkedInInsightTag';
import { tracker } from './tracker';

interface AnalyticsContextType {
  trackEvent: (eventName: string, category: string, metadata?: any) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: (eventName, category, metadata) => {
    tracker.track(eventName, category, metadata);
  }
});

export const useAnalytics = () => useContext(AnalyticsContext);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  linkedInPartnerId?: string;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children, linkedInPartnerId }) => {
  const trackEvent = (eventName: string, category: string, metadata?: any) => {
    tracker.track(eventName, category, metadata);
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {/* Tags e Pixels de Analytics em Produção */}
      <LinkedInInsightTag partnerId={linkedInPartnerId} />
      {children}
    </AnalyticsContext.Provider>
  );
};
