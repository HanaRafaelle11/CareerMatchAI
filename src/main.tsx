import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './application/providers/ThemeProvider'
import { AnalyticsProvider } from './infrastructure/analytics/AnalyticsProvider'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

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
            <App />
          </AnalyticsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

