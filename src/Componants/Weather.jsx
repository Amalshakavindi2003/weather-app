import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axiosInstance from './axiosInstance'
import Endpoints from './EndPoints'

const API_KEY = import.meta.env.VITE_API_KEY ?? import.meta.env.API_KEY
const FAVORITES_STORAGE_KEY = 'weatherAppFavorites'

function readFavorites() {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
    const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : []

    return Array.isArray(parsedFavorites) ? parsedFavorites : []
  } catch {
    return []
  }
}

function writeFavorites(favorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
}

const Weather = () => {
  const [city, setCity] = useState('')
  const [data, setData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [favoriteCities, setFavoriteCities] = useState(() => readFavorites())
  const location = useLocation()
  const navigate = useNavigate()

  const loadWeather = useCallback(
    async (cityName, options = {}) => {
      const trimmedCity = (cityName ?? '').trim()

      if (!trimmedCity) return

      try {
        setLoading(true)
        setError(false)

        if (!API_KEY) {
          throw new Error('API key is missing')
        }

        const res = await axiosInstance.get(
          `${Endpoints.weather}?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric`,
        )
        const res2 = await axiosInstance.get(
          `${Endpoints.forecast}?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric`,
        )

        setForecast(res2.data)
        setData(res.data)
        setError(false)

        if (options.updateUrl !== false) {
          navigate(`/?city=${encodeURIComponent(res.data.name)}`, { replace: true })
        }
      } catch {
        setError(true)
        setData(null)
        setForecast(null)
      } finally {
        setLoading(false)
      }
    },
    [navigate],
  )

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const cityFromQuery = params.get('city')

    if (cityFromQuery) {
      setCity(cityFromQuery)
      loadWeather(cityFromQuery, { updateUrl: false })
    }
  }, [location.search, loadWeather])

  const isFavorite = data ? favoriteCities.includes(data.name.toLowerCase()) : false

  const handleSearch = () => {
    loadWeather(city)
  }

  const handleFavoriteToggle = () => {
    if (!data?.name) return

    const normalizedCity = data.name.trim().toLowerCase()
    const nextFavorites = favoriteCities.includes(normalizedCity)
      ? favoriteCities
      : [...favoriteCities, normalizedCity]

    setFavoriteCities(nextFavorites)
    writeFavorites(nextFavorites)
  }

  return (
    <>
      <div className="container">
        <h1 className="title">Weather App</h1>
        <div className="searchBox">
          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {loading && <p className="loading">Loading...</p>}
        {error && <p className="loading">City Not Found</p>}

        {data && (
          <div className="mainCard">
            <div className="mainCardHeader">
              <h2>{data.name}</h2>
              <button
                type="button"
                className={`favoriteButton ${isFavorite ? 'saved' : ''}`}
                onClick={handleFavoriteToggle}
                aria-label={`Save ${data.name} to favorites`}
                title="Save to favorites"
              >
                ★
              </button>
            </div>
            <h1>
              {data.main.temp}
              {'\u00B0'}C
            </h1>
            <p>{data.weather[0].main}</p>
            <p>Wind {data.wind.speed} m/s</p>
            <p>Humidity {data.main.humidity}%</p>
            <p>Pressure {data.main.pressure} hPa</p>
          </div>
        )}

        <div className="hourlyWrapper">
          <div className="hourly">
            {forecast?.list?.slice(0, 6).map((item, i) => (
              <div key={i} className="hourBox">
                <p>
                  {new Date(item.dt_txt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <h3>
                  {item.main.temp}
                  {'\u00B0'}C
                </h3>
              </div>
            ))}
          </div>
        </div>

        <div className="daily">
          {forecast?.list
            ?.filter((_, i) => i % 8 === 0)
            .map((item, i) => {
              const weather = item.weather[0].main

              return (
                <div key={i} className="dayCard">
                  <p>{item.dt_txt.split(' ')[0]}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                    alt="weather"
                  />
                  <p>{weather}</p>
                  <h3>
                    {item.main.temp}
                    {'\u00B0'}C
                  </h3>
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}

export default Weather