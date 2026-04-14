import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import axiosInstance from './axiosInstance'

const API_KEY = import.meta.env.VITE_API_KEY ?? import.meta.env.API_KEY

function formatChartDate(dateString) {
  return new Date(dateString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function ForecastPage() {
  const [city, setCity] = useState('')
  const [displayCity, setDisplayCity] = useState('')
  const [forecastDays, setForecastDays] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSearch = async (event) => {
    event.preventDefault()

    const trimmedCity = city.trim()

    if (!trimmedCity) {
      setErrorMessage('Please enter a city name.')
      return
    }

    try {
      setLoading(true)
      setErrorMessage('')
      setForecastDays([])

      if (!API_KEY) {
        throw new Error('API key is missing')
      }

      const response = await axiosInstance.get(
        `/forecast?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric`,
      )

      const dailyEntries = response.data.list.filter((item) => item.dt_txt.includes('12:00:00'))

      const nextDays = dailyEntries.slice(0, 5).map((item) => ({
        date: formatChartDate(item.dt_txt),
        temp: Math.round(item.main.temp),
        min: Math.round(item.main.temp_min),
        max: Math.round(item.main.temp_max),
        condition: item.weather[0].main,
        icon: item.weather[0].icon,
      }))

      if (!nextDays.length) {
        throw new Error('Forecast data is not available for this city right now.')
      }

      setDisplayCity(response.data.city.name)
      setCity(response.data.city.name)
      setForecastDays(nextDays)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load forecast data'
      setErrorMessage(message)
      setForecastDays([])
      setDisplayCity('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forecastPage container">
      <h1 className="title">Forecast</h1>
      <p className="pageSubtitle">Search a city to see a clean temperature trend and daily breakdown.</p>

      <form className="searchBox forecastSearch" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search city for forecast..."
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Show Forecast'}
        </button>
      </form>

      {loading && (
        <div className="forecastStatus" role="status" aria-live="polite">
          <span className="loadingSpinner" aria-hidden="true" />
          <p className="loading">Loading forecast...</p>
        </div>
      )}

      {!loading && errorMessage && <p className="weatherError forecastError">{errorMessage}</p>}

      {forecastDays.length > 0 && (
        <>
          <div className="forecastHeader">
            <h2>{displayCity}</h2>
            <p>Daily readings are taken from the 12:00 UTC forecast entries.</p>
          </div>

          <section className="forecastChartCard">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={forecastDays} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                <XAxis dataKey="date" stroke="var(--page-text)" />
                <YAxis stroke="var(--page-text)" unit="°C" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '12px',
                    color: 'var(--page-text)',
                  }}
                  labelStyle={{ color: 'var(--page-text)' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#ff7b00"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ff7b00' }}
                  activeDot={{ r: 7 }}
                  name="Temperature (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <div className="forecastCardsGrid">
            {forecastDays.map((day) => (
              <article key={day.date} className="forecastDayCard">
                <p className="forecastDayDate">{day.date}</p>
                <img
                  className="forecastDayIcon"
                  src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                  alt={day.condition}
                />
                <p className="forecastDayCondition">{day.condition}</p>
                <div className="forecastDayTemps">
                  <span>Min {day.min}°C</span>
                  <span>Max {day.max}°C</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ForecastPage