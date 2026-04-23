import React from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Capture beforeinstallprompt before React mounts to avoid missing it
window.addEventListener('beforeinstallprompt', (e) =>
{
  e.preventDefault()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__pwaInstallPrompt = e
  window.dispatchEvent(new Event('pwaInstallPromptReady'))
})

const rootElement = document.getElementById('root')
if (!rootElement) 
{
  throw new Error('Failed to find the root element')
}

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
