import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from '../redux/store.js'
import { RouterProvider, Routes, Route, BrowserRouter } from 'react-router-dom'
import router from '../routes/router.jsx'
import './main.css';

createRoot(document.getElementById('root')).render(
  <ReduxProvider store={store}>
    <RouterProvider router={router} />
  </ReduxProvider>
)
