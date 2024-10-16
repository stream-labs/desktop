import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '../../app/styles/antd/antd.less';
import '../../app/styles/antd/night-theme.lazy.less';
import '../../app/app.g.less';
import '../../app/themes.g.less';
import './index.less'

createRoot(document.getElementById('root')!).render(
  // StrictMode is not supported in antd4
  // <StrictMode>
    <App />
  // </StrictMode>,
)
