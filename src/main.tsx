
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize the root element
const root = createRoot(document.getElementById("root")!);

// Render the application
root.render(<App />);

console.log('App initialized');
