import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ChatProvider } from './context/ChatContext.tsx'

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
if (/^#\/?admin\/?$/i.test(window.location.hash)) {
  const adminPath = basePath === '/' ? '/admin' : `${basePath}/admin`
  window.history.replaceState(null, '', adminPath)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChatProvider>
      <BrowserRouter basename={basePath === '/' ? undefined : basePath}>
        <App />
      </BrowserRouter>
    </ChatProvider>
  </StrictMode>,
)
