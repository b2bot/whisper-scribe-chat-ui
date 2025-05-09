import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Forçar tema claro (remove classe "dark" e aplica "light")
document.documentElement.classList.remove('dark')
document.documentElement.classList.add('light')

createRoot(document.getElementById("root")!).render(<App />);
