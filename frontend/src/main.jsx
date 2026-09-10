import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ToastContext.jsx'
import { AccessibilityProvider } from './components/AccessibilityContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AccessibilityProvider>
  </StrictMode>,
)
