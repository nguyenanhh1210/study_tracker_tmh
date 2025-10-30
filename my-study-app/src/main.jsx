import React from 'react'
import ReactDOM from 'react-dom/client'
// Sử dụng đường dẫn tuyệt đối (absolute path)
// để trình biên dịch hiểu
import App from '/src/App.jsx' 
import '/src/index.css'     // Đường dẫn chuẩn

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)