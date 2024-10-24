import { StrictMode } from 'react'
import App from './App.tsx'
// import '../../app/styles/antd/antd.less';
// import '../../app/styles/antd/night-theme.lazy.less';
// import '../../app/app.g.less';
import '../../app/themes.g.less';
import './index.less'
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(  // StrictMode is not supported in antd4
              // <StrictMode>
  <App />
// </StrictMode>,);
);
