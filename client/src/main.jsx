import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

const root = createRoot(document.getElementById('root'));
const Page = window.location.pathname === '/' ? App : NotFoundPage;

root.render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
