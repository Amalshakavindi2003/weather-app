import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { ThemeProvider } from './Componants/ThemeContext'
import Weather from './Componants/Weather'
import ComparePage from './Componants/ComparePage'
import FavoritesPage from './Componants/FavoritesPage'
import AirQualityPage from './Componants/AirQualityPage'
import ForecastPage from './Componants/ForecastPage'
import Navbar from './Componants/Navbar'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="appShell">
          <Navbar />
          <main className="appContent">
            <Routes>
              <Route path="/" element={<Weather />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/air-quality" element={<AirQualityPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App