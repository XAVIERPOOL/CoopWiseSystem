import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSecurityDeterrents } from './lib/security'

// Initialize deterrents only in production so as not to disrupt active development
if (import.meta.env.PROD) {
  initSecurityDeterrents();
}

createRoot(document.getElementById("root")!).render(<App />);
