import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Weather from './Componants/Weather'
import ComparePage from './Componants/ComparePage'
import Navbar from './Componants/Navbar'

function App() {
  return (
    <BrowserRouter>
      <div className="appShell">
        <Navbar />
        <main className="appContent">
          <Routes>
            <Route path="/" element={<Weather />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App