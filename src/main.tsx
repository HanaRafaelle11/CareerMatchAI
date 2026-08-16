import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './application/providers/ThemeProvider'
import { AnalyticsProvider } from './infrastructure/analytics/AnalyticsProvider'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

import { ToastProvider } from './application/context/ToastContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AnalyticsProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Registro do Service Worker PWA com Atualização Imediata (skipWaiting / clients.claim)
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Checagem proativa por novos deploys
        registration.update().catch(() => {});
      })
      .catch((error) => {
        console.warn('[PWA] Falha no registro do Service Worker:', error);
      });
  });
}

