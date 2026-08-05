import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './application/providers/ThemeProvider'
import { AnalyticsProvider } from './infrastructure/analytics/AnalyticsProvider'
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)

