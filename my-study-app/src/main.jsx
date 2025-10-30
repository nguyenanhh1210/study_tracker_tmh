import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'       // <-- Dùng đường dẫn chuẩn
import './index.css'     // <-- Dùng đường dẫn chuẩn

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)