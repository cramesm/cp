import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AccessibilityProvider } from './context/AccessibilityContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AccessibilityProvider>
  </StrictMode>,
)
