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

function getGreeting(date = new Date()) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return 'Good Morning ☀️'
  }

  if (hour >= 12 && hour < 17) {
    return 'Good Afternoon 🌤️'
  }

  if (hour >= 17 && hour < 21) {
    return 'Good Evening 🌇'
  }

  return 'Good Night 🌙'
}

const Weather = () => {
  const [city, setCity] = useState('')
  const [data, setData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [favoriteCities, setFavoriteCities] = useState(() => readFavorites())
  const [greeting, setGreeting] = useState(() => getGreeting())
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setGreeting(getGreeting())
    }, 60000)

    setGreeting(getGreeting())

    return () => window.clearInterval(timerId)
  }, [])

  const loadWeatherByCity = useCallback(
    async (cityName, options = {}) => {
      const trimmedCity = (cityName ?? '').trim()

      if (!trimmedCity) return

      try {
        setLoading(true)
        setErrorMessage('')

        if (!API_KEY) {
          throw new Error('API key is missing')
        }

        const weatherResponse = await axiosInstance.get(
          `${Endpoints.weather}?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric`,
        )
        const forecastResponse = await axiosInstance.get(
          `${Endpoints.forecast}?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric`,
        )

        setForecast(forecastResponse.data)
        setData(weatherResponse.data)
        setCity(weatherResponse.data.name)

        if (options.updateUrl !== false) {
          navigate(`/?city=${encodeURIComponent(weatherResponse.data.name)}`, { replace: true })
        }
      } catch {
        setErrorMessage('Unable to find that city. Please try another city name.')
        setData(null)
        setForecast(null)
      } finally {
        setLoading(false)
      }
    },
    [navigate],
  )

  const loadWeatherByCoords = useCallback(
    async (latitude, longitude) => {
      try {
        setLoading(true)
        setErrorMessage('')

        if (!API_KEY) {
          throw new Error('API key is missing')
        }

        const weatherResponse = await axiosInstance.get(
          `${Endpoints.weather}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`,
        )
        const forecastResponse = await axiosInstance.get(
          `${Endpoints.forecast}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`,
        )

        setForecast(forecastResponse.data)
        setData(weatherResponse.data)
        setCity(weatherResponse.data.name)
        navigate(`/?city=${encodeURIComponent(weatherResponse.data.name)}`, { replace: true })
      } catch {
        setErrorMessage('Unable to load weather for your location right now. Please try again.')
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
      loadWeatherByCity(cityFromQuery, { updateUrl: false })
    }
  }, [location.search, loadWeatherByCity])

  const isFavorite = data ? favoriteCities.includes(data.name.toLowerCase()) : false

  const handleSearch = () => {
    loadWeatherByCity(city)
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        loadWeatherByCoords(latitude, longitude)
      },
      (geoError) => {
        setLoading(false)

        if (geoError.code === 1) {
          setErrorMessage('Location permission was denied. Please allow access and try again.')
          return
        }

        if (geoError.code === 2) {
          setErrorMessage('Unable to detect your location. Please try again in a moment.')
          return
        }

        if (geoError.code === 3) {
          setErrorMessage('Location request timed out. Please try again.')
          return
        }

        setErrorMessage('Unable to access your location right now. Please try again.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
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
        <h1 className="title weatherGreeting">{greeting}</h1>
        <p className="pageSubtitle weatherSubtitle">Search any city to get started</p>
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
          <button type="button" className="locationButton" onClick={handleUseLocation}>
            📍 Use My Location
          </button>
          <button type="button" onClick={handleSearch}>Search</button>
        </div>

        {loading && (
          <div className="weatherStatus" role="status" aria-live="polite">
            <span className="loadingSpinner" aria-hidden="true" />
            <p className="loading">Loading weather...</p>
          </div>
        )}
        {!loading && errorMessage && <p className="weatherError">{errorMessage}</p>}

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