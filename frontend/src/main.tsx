/**
 * Application entry point.
 *
 * Mounts the React tree into the #root DOM node.
 * CineMoodApp contains the BrowserRouter, all context providers,
 * and the route definitions — nothing else belongs here.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CineMoodApp } from './components/cinemood-app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CineMoodApp />
  </StrictMode>,
)
